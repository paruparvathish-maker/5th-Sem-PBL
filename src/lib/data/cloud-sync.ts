// Cloud persistence helper for cross-device authentication and dynamic store
// Uses a high-availability serverless KV store (kvdb.io) to synchronize credentials & data across mobile phones, laptops, and Vercel serverless lambdas.

const KV_BUCKET = 'UsUUJQ2jfHa2frgSXWQ2bD';
const KV_BASE_URL = `https://kvdb.io/${KV_BUCKET}`;
const PASSWORDS_KEY = 'pbl_passwords';
const DYNAMIC_STORE_KEY = 'pbl_dynamic_store';

interface CredentialRecord {
  password: string;
  isFirstLogin: boolean;
  passwordUpdatedAt?: string;
  updatedAt?: string;
}

// In-memory micro-cache (3 seconds) to avoid redundant HTTP calls in a single request lifecycle
let cachedCreds: Record<string, CredentialRecord> | null = null;
let lastCredsFetch = 0;

export async function fetchCloudCredentials(): Promise<Record<string, CredentialRecord>> {
  const now = Date.now();
  if (cachedCreds && now - lastCredsFetch < 3000) {
    return cachedCreds;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);
    const res = await fetch(`${KV_BASE_URL}/${PASSWORDS_KEY}`, {
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        cachedCreds = data;
        lastCredsFetch = now;
        return data;
      }
    }
  } catch (err) {
    // Cloud KV offline or timed out; non-blocking fallback
  }

  return cachedCreds || {};
}

export async function saveCloudCredentials(
  userId: string,
  record: { password: string; isFirstLogin: boolean; passwordUpdatedAt?: string },
  aliases: string[] = []
): Promise<boolean> {
  try {
    // Fetch latest map
    let currentMap: Record<string, CredentialRecord> = {};
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${KV_BASE_URL}/${PASSWORDS_KEY}`, {
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        currentMap = await res.json();
      }
    } catch {}

    const fullRecord: CredentialRecord = {
      password: record.password,
      isFirstLogin: record.isFirstLogin,
      passwordUpdatedAt: record.passwordUpdatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    currentMap[userId] = fullRecord;
    aliases.forEach(alias => {
      if (alias) currentMap[alias.toLowerCase()] = fullRecord;
    });

    // Update in-memory cache
    cachedCreds = currentMap;
    lastCredsFetch = Date.now();

    // Persist to KV
    const saveController = new AbortController();
    const saveTimeout = setTimeout(() => saveController.abort(), 2000);
    await fetch(`${KV_BASE_URL}/${PASSWORDS_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentMap),
      signal: saveController.signal
    });
    clearTimeout(saveTimeout);
    return true;
  } catch (err) {
    console.warn('Failed to save cloud credentials:', err);
    return false;
  }
}

export async function fetchCloudDynamicStore(): Promise<any | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);
    const res = await fetch(`${KV_BASE_URL}/${DYNAMIC_STORE_KEY}`, {
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export async function saveCloudDynamicStore(payload: any): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    await fetch(`${KV_BASE_URL}/${DYNAMIC_STORE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
}

