// Cloud persistence helper for cross-device authentication, submissions, and dynamic database state.
// Uses high-availability serverless KV store (kvdb.io) to ensure multi-device synchronization
// across mobile phones, laptops, desktops, and Vercel serverless lambdas.

const KV_BUCKET = 'UsUUJQ2jfHa2frgSXWQ2bD';
const KV_BASE_URL = `https://kvdb.io/${KV_BUCKET}`;
const PASSWORDS_KEY = 'pbl_passwords';
const DYNAMIC_STORE_KEY = 'pbl_dynamic_store';
const SUBMISSIONS_KEY = 'pbl_submissions';

interface CredentialRecord {
  password?: string;
  isFirstLogin: boolean;
  isActivated?: boolean;
  activationToken?: string;
  passwordUpdatedAt?: string;
  email?: string;
  name?: string;
  usn?: string;
  role?: string;
  updatedAt?: string;
}

// In-memory micro-cache (3 seconds) to avoid redundant network round-trips within a single request cycle
let cachedCreds: Record<string, CredentialRecord> | null = null;
let lastCredsFetch = 0;

let cachedSubmissions: Record<string, any> | null = null;
let lastSubmissionsFetch = 0;

// --- Credentials Synchronization ---
export async function fetchCloudCredentials(): Promise<Record<string, CredentialRecord>> {
  const now = Date.now();
  if (cachedCreds && now - lastCredsFetch < 3000) {
    return cachedCreds;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
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
    // Non-blocking fallback
  }

  return cachedCreds || {};
}

export async function saveCloudCredentials(
  userId: string,
  record: {
    password?: string;
    isFirstLogin?: boolean;
    isActivated?: boolean;
    activationToken?: string;
    passwordUpdatedAt?: string;
    email?: string;
    name?: string;
    usn?: string;
    role?: string;
  },
  aliases: string[] = []
): Promise<boolean> {
  try {
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

    const existing = currentMap[userId] || {};
    const effectiveEmail = (record.email || existing.email)?.toLowerCase().trim();
    const effectiveUsn = (record.usn || existing.usn)?.toUpperCase().trim();

    const fullRecord: CredentialRecord = {
      password: record.password !== undefined ? record.password : existing.password,
      isFirstLogin: record.isFirstLogin !== undefined ? record.isFirstLogin : (existing.isFirstLogin ?? false),
      isActivated: record.isActivated !== undefined ? record.isActivated : existing.isActivated,
      activationToken: record.activationToken !== undefined ? record.activationToken : existing.activationToken,
      passwordUpdatedAt: record.passwordUpdatedAt || existing.passwordUpdatedAt || new Date().toISOString(),
      email: effectiveEmail,
      name: record.name || existing.name,
      usn: effectiveUsn,
      role: record.role || existing.role,
      updatedAt: new Date().toISOString()
    };

    currentMap[userId] = fullRecord;
    if (userId.toLowerCase() !== userId) {
      currentMap[userId.toLowerCase()] = fullRecord;
    }

    if (effectiveEmail) {
      currentMap[effectiveEmail] = fullRecord;
    }
    if (effectiveUsn) {
      currentMap[effectiveUsn] = fullRecord;
      currentMap[effectiveUsn.toLowerCase()] = fullRecord;
    }

    aliases.forEach(alias => {
      if (alias) {
        currentMap[alias] = fullRecord;
        currentMap[alias.toLowerCase()] = fullRecord;
      }
    });

    cachedCreds = currentMap;
    lastCredsFetch = Date.now();

    const saveController = new AbortController();
    const saveTimeout = setTimeout(() => saveController.abort(), 2500);
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

// --- Submissions Synchronization ---
export async function fetchCloudSubmissions(): Promise<any[]> {
  const now = Date.now();
  if (cachedSubmissions && now - lastSubmissionsFetch < 3000) {
    return Object.values(cachedSubmissions);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${KV_BASE_URL}/${SUBMISSIONS_KEY}`, {
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        cachedSubmissions = data;
        lastSubmissionsFetch = now;
        return Object.values(data);
      }
    }
  } catch (err) {
    // Non-blocking fallback
  }

  return cachedSubmissions ? Object.values(cachedSubmissions) : [];
}

export async function saveCloudSubmission(submission: any): Promise<boolean> {
  if (!submission || !submission.id) return false;

  try {
    let currentMap: Record<string, any> = {};
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${KV_BASE_URL}/${SUBMISSIONS_KEY}`, {
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) currentMap = await res.json();
    } catch {}

    // Lightweight submission record (without heavy base64 to keep index lean and ultra-fast)
    const { fileData, ...cleanSub } = submission;
    currentMap[submission.id] = cleanSub;

    cachedSubmissions = currentMap;
    lastSubmissionsFetch = Date.now();

    // 1. Save metadata to submissions map
    const saveController = new AbortController();
    const saveTimeout = setTimeout(() => saveController.abort(), 2500);
    await fetch(`${KV_BASE_URL}/${SUBMISSIONS_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentMap),
      signal: saveController.signal
    });
    clearTimeout(saveTimeout);

    // 2. If fileData is present, save full file data under its dedicated key
    if (fileData && typeof fileData === 'string' && fileData.length > 50) {
      saveCloudSubmissionFile(submission.id, fileData).catch(console.error);
    }

    return true;
  } catch (err) {
    console.warn('Failed to save cloud submission:', err);
    return false;
  }
}

export async function saveCloudSubmissionsBatch(submissions: any[]): Promise<boolean> {
  if (!Array.isArray(submissions) || submissions.length === 0) return true;

  try {
    let currentMap: Record<string, any> = {};
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${KV_BASE_URL}/${SUBMISSIONS_KEY}`, {
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) currentMap = await res.json();
    } catch {}

    submissions.forEach(s => {
      if (s && s.id) {
        const { fileData, ...cleanSub } = s;
        currentMap[s.id] = { ...currentMap[s.id], ...cleanSub };

        // Save heavy fileData asynchronously if present
        if (fileData && typeof fileData === 'string' && fileData.length > 50) {
          saveCloudSubmissionFile(s.id, fileData).catch(() => {});
        }
      }
    });

    cachedSubmissions = currentMap;
    lastSubmissionsFetch = Date.now();

    const saveController = new AbortController();
    const saveTimeout = setTimeout(() => saveController.abort(), 2500);
    await fetch(`${KV_BASE_URL}/${SUBMISSIONS_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentMap),
      signal: saveController.signal
    });
    clearTimeout(saveTimeout);
    return true;
  } catch (err) {
    return false;
  }
}

export async function saveCloudSubmissionFile(submissionId: string, fileData: string): Promise<boolean> {
  if (!submissionId || !fileData) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    await fetch(`${KV_BASE_URL}/pbl_file_${submissionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: fileData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
}

export async function fetchCloudSubmissionFile(submissionId: string): Promise<string | null> {
  if (!submissionId) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${KV_BASE_URL}/pbl_file_${submissionId}`, {
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 50) return text;
    }
  } catch {}

  return null;
}

// --- Dynamic Store (Evaluations, Guide Meetings, Audit Logs) ---
export async function fetchCloudDynamicStore(): Promise<any | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
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
    const timeoutId = setTimeout(() => controller.abort(), 2500);
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
