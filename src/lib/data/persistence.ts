/**
 * Durable shared persistence for the PBL portal.
 *
 * Serverless deployments (Vercel) cannot write to the repository filesystem, and
 * per-lambda /tmp storage is discarded between requests, so every device must
 * read and write one shared store. This module provides that store as a small
 * key/value document layer:
 *
 *   1. libsql / Turso (or a local `file:` SQLite database for development) when
 *      TURSO_DATABASE_URL or a `file:` DATABASE_URL is configured.
 *   2. Legacy kvdb.io bucket as a last resort.
 *
 * Writes are reported honestly: callers receive `false` (and an error is logged)
 * instead of a silent "success" when nothing was durably stored.
 */

// Type-only import: keeps the database driver out of the browser bundle. The
// driver itself is loaded lazily, server-side only.
import type { Client } from '@libsql/client';

const LEGACY_KV_BUCKET = 'UsUUJQ2jfHa2frgSXWQ2bD';
const LEGACY_KV_BASE_URL = `https://kvdb.io/${LEGACY_KV_BUCKET}`;
const LEGACY_TIMEOUT_MS = 4000;

export type StorageBackend = 'libsql' | 'legacy-kv';

interface GlobalWithDb {
  __pblDocClient?: Client;
  __pblDocReady?: boolean;
}

const globalRef = globalThis as unknown as GlobalWithDb;

function sqliteUrl(): string {
  if (process.env.TURSO_DATABASE_URL) return process.env.TURSO_DATABASE_URL;
  const databaseUrl = process.env.DATABASE_URL || '';
  return databaseUrl.startsWith('file:') ? databaseUrl : '';
}

export function storageBackend(): StorageBackend {
  return sqliteUrl() ? 'libsql' : 'legacy-kv';
}

export function isDurableStorageConfigured(): boolean {
  return Boolean(sqliteUrl());
}

async function getClient(): Promise<Client | null> {
  const url = sqliteUrl();
  if (!url) return null;

  if (!globalRef.__pblDocClient) {
    const { createClient } = await import('@libsql/client');
    globalRef.__pblDocClient = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    });
  }
  const client = globalRef.__pblDocClient;

  if (!globalRef.__pblDocReady) {
    await client.execute(
      'CREATE TABLE IF NOT EXISTS pbl_docs (doc_key TEXT PRIMARY KEY, doc_value TEXT NOT NULL, updated_at TEXT NOT NULL)'
    );
    globalRef.__pblDocReady = true;
  }

  return client;
}

function legacyUrl(key: string): string {
  return `${LEGACY_KV_BASE_URL}/${encodeURIComponent(key)}`;
}

async function legacyRead(key: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LEGACY_TIMEOUT_MS);
    const res = await fetch(legacyUrl(key), { cache: 'no-store', signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function legacyWrite(key: string, rawValue: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LEGACY_TIMEOUT_MS);
    const res = await fetch(legacyUrl(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rawValue,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(
        `[storage] Durable write failed for "${key}" (backend: legacy-kv, HTTP ${res.status}). ` +
          `Nothing was persisted. ${detail.slice(0, 200)}`
      );
      return false;
    }
    return true;
  } catch (err: any) {
    console.error(`[storage] Durable write failed for "${key}" (backend: legacy-kv):`, err?.message || err);
    return false;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Reads a JSON document. Returns null when the document does not exist.
 *
 * A cold serverless instance can fail its very first database round-trip
 * (connection setup, DNS, transient 5xx). Such a failure must never be reported
 * as "no data", otherwise another device would briefly see zero papers, so the
 * read is retried before giving up.
 */
export async function readDoc<T = any>(key: string): Promise<T | null> {
  const client = await getClient().catch((err) => {
    console.error('[storage] Could not open the configured database:', err?.message || err);
    return null;
  });

  if (client) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await client.execute({
          sql: 'SELECT doc_value FROM pbl_docs WHERE doc_key = ?',
          args: [key],
        });
        const row = result.rows[0] as any;
        if (!row) return null;
        return JSON.parse(String(row.doc_value)) as T;
      } catch (err: any) {
        if (attempt < 2) {
          await sleep(80 * (attempt + 1));
          continue;
        }
        console.error(`[storage] Read failed for "${key}":`, err?.message || err);
        return null;
      }
    }
    return null;
  }

  const raw = await legacyRead(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Writes a JSON document. Returns false when the write did not reach durable storage. */
export async function writeDoc(key: string, value: unknown): Promise<boolean> {
  const rawValue = JSON.stringify(value);
  const client = await getClient().catch((err) => {
    console.error('[storage] Could not open the configured database:', err?.message || err);
    return null;
  });

  if (client) {
    try {
      await client.execute({
        sql:
          'INSERT INTO pbl_docs (doc_key, doc_value, updated_at) VALUES (?, ?, ?) ' +
          'ON CONFLICT(doc_key) DO UPDATE SET doc_value = excluded.doc_value, updated_at = excluded.updated_at',
        args: [key, rawValue, new Date().toISOString()],
      });
      return true;
    } catch (err: any) {
      console.error(`[storage] Write failed for "${key}":`, err?.message || err);
      return false;
    }
  }

  return legacyWrite(key, rawValue);
}

/**
 * Read-modify-write with an optimistic concurrency check, so two devices saving
 * at the same time merge instead of overwriting each other's records.
 */
export async function updateDoc<T = any>(
  key: string,
  mutator: (current: T | null) => T,
  attempts = 5
): Promise<boolean> {
  const client = await getClient().catch(() => null);

  if (!client) {
    // No compare-and-set available on the legacy bucket: read, merge, write.
    const current = await readDoc<T>(key);
    return writeDoc(key, mutator(current));
  }

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const result = await client.execute({
        sql: 'SELECT doc_value, updated_at FROM pbl_docs WHERE doc_key = ?',
        args: [key],
      });
      const row = result.rows[0] as any;
      const currentRaw = row ? String(row.doc_value) : null;
      const currentVersion = row ? String(row.updated_at) : null;
      const current = currentRaw ? (JSON.parse(currentRaw) as T) : null;
      const nextRaw = JSON.stringify(mutator(current));
      const nextVersion = new Date().toISOString();

      if (currentVersion === null) {
        try {
          await client.execute({
            sql: 'INSERT INTO pbl_docs (doc_key, doc_value, updated_at) VALUES (?, ?, ?)',
            args: [key, nextRaw, nextVersion],
          });
          return true;
        } catch (err: any) {
          // Another device created the document between our SELECT and INSERT.
          // Fall through to a re-read + merge instead of losing this write.
          if (!String(err?.message || '').includes('UNIQUE constraint')) throw err;
          await sleep(25 * (attempt + 1));
          continue;
        }
      }

      const update = await client.execute({
        sql: 'UPDATE pbl_docs SET doc_value = ?, updated_at = ? WHERE doc_key = ? AND updated_at = ?',
        args: [nextRaw, nextVersion, key, currentVersion],
      });
      if (update.rowsAffected > 0) return true;
      // Another lambda wrote in between: re-read and merge again.
      await sleep(25 * (attempt + 1));
    } catch (err: any) {
      if (attempt < attempts - 1) {
        await sleep(80 * (attempt + 1));
        continue;
      }
      console.error(`[storage] Update failed for "${key}":`, err?.message || err);
      return false;
    }
  }

  console.error(`[storage] Could not commit update for "${key}" after ${attempts} attempts.`);
  return false;
}
