#!/usr/bin/env node
/**
 * READ-ONLY Turso backup.
 *
 * Runs a single `SELECT doc_key, doc_value, updated_at FROM pbl_docs` and writes
 * every row to backups/turso-backup-<timestamp>.json.
 *
 * Guarantees:
 *  - only a SELECT is ever executed against Turso (no writes, no schema changes)
 *  - the connection URL and auth token are read from .env.local and never printed
 *  - stdout shows only the row count, total bytes and the 10 largest doc_keys
 *
 * Usage: node scripts/turso-backup.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env.local');
const OUT_DIR = path.join(ROOT, 'backups');

function readEnv(file) {
  const text = fs.readFileSync(file, 'utf8');
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function bytesOf(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'string') return Buffer.byteLength(value, 'utf8');
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

async function main() {
  const env = readEnv(ENV_FILE);
  const url = env.TURSO_DATABASE_URL;
  const authToken = env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env.local');
    process.exit(1);
  }

  const { createClient } = require('@libsql/client');
  const client = createClient({ url, authToken });

  // The only statement this script ever sends.
  const result = await client.execute('SELECT doc_key, doc_value, updated_at FROM pbl_docs');

  const rows = result.rows.map((row) => ({
    doc_key: row.doc_key,
    doc_value: row.doc_value,
    updated_at: row.updated_at === null || row.updated_at === undefined ? null : String(row.updated_at),
  }));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(OUT_DIR, `turso-backup-${stamp}.json`);

  const payload = {
    takenAt: new Date().toISOString(),
    source: 'turso pbl_docs (read-only SELECT)',
    rowCount: rows.length,
    rows,
  };
  const serialized = JSON.stringify(payload, null, 2);
  fs.writeFileSync(outFile, serialized, 'utf8');

  const totalBytes = Buffer.byteLength(serialized, 'utf8');
  console.log(`rows: ${rows.length}`);
  console.log(`total bytes: ${totalBytes} (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`file: ${path.relative(ROOT, outFile)}`);
  console.log('10 largest doc_keys:');
  rows
    .map((r) => ({ key: r.doc_key, bytes: bytesOf(r.doc_value) }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10)
    .forEach((r, i) => {
      console.log(`  ${String(i + 1).padStart(2, ' ')}. ${r.key} — ${r.bytes} bytes (${(r.bytes / 1024).toFixed(1)} KB)`);
    });

  client.close();
}

main().catch((err) => {
  console.error('backup failed:', err.message);
  process.exit(1);
});
