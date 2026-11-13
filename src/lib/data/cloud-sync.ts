/**
 * Cross-device persistence for authentication, submissions, teams and dynamic state.
 *
 * All reads and writes go through `./persistence`, which stores documents in a
 * shared database (Turso/libsql) so laptops, desktops and phones see the same
 * data. The previous kvdb.io transport silently dropped every write once the
 * bucket ran out of disk, which is why faculty updates never left one device.
 */

import { readDoc, writeDoc, updateDoc, storageBackend, isDurableStorageConfigured } from './persistence';

const PASSWORDS_KEY = 'pbl_passwords';

// The main administrator is a separate identity from the faculty account of the
// same person. These two keys belong to that identity only.
const SUPER_ADMIN_ID = '180881';
const SUPER_ADMIN_EMAIL = 'paruparvathish@gmail.com';
const DYNAMIC_STORE_KEY = 'pbl_dynamic_store';
const SUBMISSIONS_KEY = 'pbl_submissions';
const SUBMISSION_RESET_KEY = 'pbl_submissions_reset';
const PROFILES_KEY = 'pbl_profiles';

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

// Short in-process cache to avoid repeated round-trips inside one request lifecycle.
let cachedCreds: Record<string, CredentialRecord> | null = null;
let lastCredsFetch = 0;

let cachedSubmissions: Record<string, any> | null = null;
let lastSubmissionsFetch = 0;

let cachedDynamic: any | null = null;
let lastDynamicFetch = 0;

const CACHE_TTL_MS = 2000;

export function storageStatus() {
  return {
    backend: storageBackend(),
    durable: isDurableStorageConfigured(),
    hint: isDurableStorageConfigured()
      ? undefined
      : 'Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN so submissions and paper proofs persist across devices.',
  };
}

// --- Team merge rules (shared by every writer so nothing is lost) ---
function timestamp(value?: string): number {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}

function usableTitle(value?: string): boolean {
  return Boolean(value && value.trim() && value.trim() !== 'To Be Decided (TBD)');
}

/**
 * Merges two records of the same team. The newest research-paper update wins,
 * proof documents are never dropped, and stale defaults never overwrite real
 * project details or member lists.
 */
export function mergeTeamRecords(existing: any, incoming: any): any {
  if (!existing) return incoming;
  if (!incoming) return existing;

  const incomingNewer = timestamp(incoming.researchPaperUpdatedAt) >= timestamp(existing.researchPaperUpdatedAt);
  const paperSource = incomingNewer ? incoming : existing;
  const paperFallback = incomingNewer ? existing : incoming;

  const merged: any = { ...existing, ...incoming };

  merged.researchPaperStatus =
    paperSource.researchPaperStatus || paperFallback.researchPaperStatus || existing.researchPaperStatus || 'submitted';
  merged.researchPaperProofName =
    paperSource.researchPaperProofName || paperFallback.researchPaperProofName || undefined;
  merged.researchPaperProofPath =
    paperSource.researchPaperProofPath || paperFallback.researchPaperProofPath || undefined;
  merged.researchPaperUpdatedAt =
    paperSource.researchPaperUpdatedAt || paperFallback.researchPaperUpdatedAt || undefined;
  merged.researchPaperProofClearedAt =
    paperSource.researchPaperProofClearedAt || paperFallback.researchPaperProofClearedAt || undefined;

  // Removing a proof is an update in its own right. When the removal is newer
  // than the document it replaced, the proof must stay gone instead of being
  // restored from an older copy still cached on another device.
  const clearedAt = timestamp(merged.researchPaperProofClearedAt);
  if (clearedAt && timestamp(merged.researchPaperUpdatedAt) <= clearedAt) {
    delete merged.researchPaperProofName;
    delete merged.researchPaperProofPath;
    merged.researchPaperStatus = 'submitted';
    merged.researchPaperUpdatedAt = merged.researchPaperProofClearedAt;
  }

  if (!merged.members || merged.members.length === 0) {
    merged.members = existing.members?.length ? existing.members : incoming.members || [];
  }
  if (!usableTitle(merged.projectTitle)) {
    merged.projectTitle = usableTitle(existing.projectTitle)
      ? existing.projectTitle
      : usableTitle(incoming.projectTitle)
      ? incoming.projectTitle
      : merged.projectTitle;
  }
  if (!merged.projectDescription || !merged.projectDescription.trim()) {
    merged.projectDescription = existing.projectDescription || incoming.projectDescription || '';
  }
  merged.semester = existing.semester || incoming.semester || 5;
  merged.section = existing.section || incoming.section;
  merged.teamNumber = existing.teamNumber || incoming.teamNumber;
  merged.guideId = incoming.guideId || existing.guideId;
  merged.guideName = incoming.guideName || existing.guideName;
  merged.guideEmail = incoming.guideEmail || existing.guideEmail;

  return merged;
}

function mergeTeamList(existing: any[] | undefined, incoming: any[] | undefined): any[] {
  const map = new Map<string, any>();
  (existing || []).forEach((t) => t && t.id && map.set(t.id, t));
  (incoming || []).forEach((t) => {
    if (!t || !t.id) return;
    map.set(t.id, mergeTeamRecords(map.get(t.id), t));
  });
  return Array.from(map.values());
}

function mergeById(existing: any[] | undefined, incoming: any[] | undefined): any[] {
  const map = new Map<string, any>();
  (existing || []).forEach((r) => r && r.id && map.set(r.id, r));
  (incoming || []).forEach((r) => {
    if (!r || !r.id) return;
    map.set(r.id, { ...(map.get(r.id) || {}), ...r });
  });
  return Array.from(map.values());
}

// --- Credentials Synchronization ---
export async function fetchCloudCredentials(): Promise<Record<string, CredentialRecord>> {
  const now = Date.now();
  if (cachedCreds && now - lastCredsFetch < CACHE_TTL_MS) return cachedCreds;

  const data = await readDoc<Record<string, CredentialRecord>>(PASSWORDS_KEY);
  if (data && typeof data === 'object') {
    cachedCreds = data;
    lastCredsFetch = now;
    return data;
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
  let saved = false;

  await updateDoc<Record<string, CredentialRecord>>(PASSWORDS_KEY, (current) => {
    const currentMap: Record<string, CredentialRecord> = { ...(current || {}) };
    const existing = currentMap[userId] || {};
    const effectiveEmail = (record.email || existing.email)?.toLowerCase().trim();
    const effectiveUsn = (record.usn || existing.usn)?.toUpperCase().trim();

    // A faculty/student record must never occupy the main administrator's id or
    // email key, otherwise logging in with it would resolve to the wrong role.
    const recordRole = record.role || existing.role;
    const mainAdminRecord =
      recordRole === 'admin' &&
      (userId === SUPER_ADMIN_ID ||
        effectiveEmail === SUPER_ADMIN_EMAIL ||
        (existing.email || '').toLowerCase() === SUPER_ADMIN_EMAIL);
    const lockedAdminKey = (key?: string) =>
      Boolean(key) && !mainAdminRecord && (key === SUPER_ADMIN_ID || (key as string).toLowerCase() === SUPER_ADMIN_EMAIL);

    const fullRecord: CredentialRecord = {
      password: record.password !== undefined ? record.password : existing.password,
      isFirstLogin: record.isFirstLogin !== undefined ? record.isFirstLogin : existing.isFirstLogin ?? false,
      isActivated: record.isActivated !== undefined ? record.isActivated : existing.isActivated,
      activationToken: record.activationToken !== undefined ? record.activationToken : existing.activationToken,
      passwordUpdatedAt: record.passwordUpdatedAt || existing.passwordUpdatedAt || new Date().toISOString(),
      email: effectiveEmail,
      name: record.name || existing.name,
      usn: effectiveUsn,
      role: record.role || existing.role,
      updatedAt: new Date().toISOString(),
    };

    if (!lockedAdminKey(userId)) currentMap[userId] = fullRecord;
    if (userId.toLowerCase() !== userId && !lockedAdminKey(userId.toLowerCase())) {
      currentMap[userId.toLowerCase()] = fullRecord;
    }
    if (effectiveEmail && !lockedAdminKey(effectiveEmail)) currentMap[effectiveEmail] = fullRecord;
    if (effectiveUsn) {
      if (!lockedAdminKey(effectiveUsn)) currentMap[effectiveUsn] = fullRecord;
      if (!lockedAdminKey(effectiveUsn.toLowerCase())) currentMap[effectiveUsn.toLowerCase()] = fullRecord;
    }
    aliases.filter(Boolean).forEach((alias) => {
      if (lockedAdminKey(alias)) return;
      currentMap[alias] = fullRecord;
      if (!lockedAdminKey(alias.toLowerCase())) currentMap[alias.toLowerCase()] = fullRecord;
    });

    cachedCreds = currentMap;
    lastCredsFetch = Date.now();
    saved = true;
    return currentMap;
  }).then((ok) => {
    if (!ok) {
      saved = false;
      console.error('[cloud-sync] Credentials were NOT persisted for user', userId);
    }
  });

  return saved;
}

// --- Shared profile overrides (registrations and profile edits from any device) ---
export async function fetchCloudProfiles(): Promise<any[]> {
  const data = await readDoc<Record<string, any>>(PROFILES_KEY);
  return data && typeof data === 'object' ? Object.values(data) : [];
}

export async function saveCloudProfile(profile: any): Promise<boolean> {
  if (!profile || !profile.id) return false;
  return updateDoc<Record<string, any>>(PROFILES_KEY, (current) => ({
    ...(current || {}),
    [profile.id]: { ...(current?.[profile.id] || {}), ...profile },
  }));
}

// --- Submissions Synchronization ---
export async function fetchCloudSubmissions(): Promise<any[]> {
  const now = Date.now();
  if (cachedSubmissions && now - lastSubmissionsFetch < CACHE_TTL_MS) return Object.values(cachedSubmissions);

  const data = await readDoc<Record<string, any>>(SUBMISSIONS_KEY);
  if (data && typeof data === 'object') {
    cachedSubmissions = data;
    lastSubmissionsFetch = now;
    return Object.values(data);
  }
  return cachedSubmissions ? Object.values(cachedSubmissions) : [];
}

/**
 * A deliberate wipe of a deadline's submissions. Everything submitted before
 * `clearedAt` is treated as deleted, so a browser that still caches an old
 * submission cannot upload it back while students submit afresh.
 */
export async function fetchSubmissionReset(): Promise<{ clearedAt: string; deadlineId?: string } | null> {
  const doc = await readDoc<{ clearedAt?: string; deadlineId?: string }>(SUBMISSION_RESET_KEY);
  return doc?.clearedAt ? { clearedAt: doc.clearedAt, deadlineId: doc.deadlineId } : null;
}

export async function saveSubmissionReset(clearedAt: string, deadlineId?: string): Promise<boolean> {
  return writeDoc(SUBMISSION_RESET_KEY, { clearedAt, deadlineId });
}

/** True when this submission predates the last deliberate reset of its deadline. */
export function isSubmissionCleared(
  submission: any,
  reset: { clearedAt?: string | null; deadlineId?: string | null } | null | undefined
): boolean {
  if (!reset?.clearedAt) return false;
  if (reset.deadlineId && submission?.deadlineId && submission.deadlineId !== reset.deadlineId) return false;
  const clearedAt = Date.parse(reset.clearedAt);
  if (Number.isNaN(clearedAt)) return false;
  const submittedAt = Date.parse(submission?.submissionTime || submission?.createdAt || '');
  // Undated legacy records still belong to the wipe when the scope matches.
  if (Number.isNaN(submittedAt)) return true;
  return submittedAt <= clearedAt;
}

export async function saveCloudSubmission(submission: any): Promise<boolean> {
  if (!submission || !submission.id) return false;
  return saveCloudSubmissionsBatch([submission]);
}

export async function saveCloudSubmissionsBatch(submissions: any[]): Promise<boolean> {
  if (!Array.isArray(submissions) || submissions.length === 0) return true;

  const files: Array<{ id: string; fileData: string }> = [];
  const cleaned = submissions.map((s) => {
    const { fileData, ...cleanSub } = s;
    if (fileData && typeof fileData === 'string' && fileData.length > 50) {
      files.push({ id: s.id, fileData });
    }
    return cleanSub;
  });

  const ok = await updateDoc<Record<string, any>>(SUBMISSIONS_KEY, (current) => {
    const currentMap: Record<string, any> = { ...(current || {}) };
    cleaned.forEach((s) => {
      if (s && s.id) currentMap[s.id] = { ...(currentMap[s.id] || {}), ...s };
    });
    cachedSubmissions = currentMap;
    lastSubmissionsFetch = Date.now();
    return currentMap;
  });

  // Documents are stored separately so the index document stays small.
  await Promise.all(files.map((f) => saveCloudSubmissionFile(f.id, f.fileData))).catch(() => {});
  return ok;
}

export async function saveCloudSubmissionFile(submissionId: string, fileData: string): Promise<boolean> {
  if (!submissionId || !fileData) return false;
  return writeDoc(`pbl_file_${submissionId}`, fileData);
}

export async function fetchCloudSubmissionFile(submissionId: string): Promise<string | null> {
  if (!submissionId) return null;
  const data = await readDoc<string>(`pbl_file_${submissionId}`);
  return typeof data === 'string' && data.length > 50 ? data : null;
}

// --- Research paper proofs (stored apart from the index document) ---
export async function saveCloudTeamProof(teamId: string, dataUrl: string): Promise<boolean> {
  if (!teamId || !dataUrl) return false;
  return writeDoc(`pbl_proof_${teamId}`, dataUrl);
}

export async function fetchCloudTeamProof(teamId: string): Promise<string | null> {
  if (!teamId) return null;
  const data = await readDoc<string>(`pbl_proof_${teamId}`);
  return typeof data === 'string' && data.startsWith('data:') ? data : null;
}

// --- Dynamic Store (teams, evaluations, guide meetings, audit logs) ---
export async function fetchCloudDynamicStore(): Promise<any | null> {
  const now = Date.now();
  if (cachedDynamic && now - lastDynamicFetch < CACHE_TTL_MS) return cachedDynamic;

  const data = await readDoc<any>(DYNAMIC_STORE_KEY);
  if (data && typeof data === 'object') {
    cachedDynamic = data;
    lastDynamicFetch = now;
    return data;
  }
  // Never serve the previous in-memory copy here: a deleted or corrected record
  // must not reappear from a warm instance's cache.
  return null;
}

export async function saveCloudDynamicStore(payload: any): Promise<boolean> {
  const ok = await updateDoc<any>(DYNAMIC_STORE_KEY, (current) => {
    const base = current && typeof current === 'object' ? current : {};
    const merged = {
      ...base,
      teams: mergeTeamList(base.teams, payload?.teams),
      evaluations: mergeById(base.evaluations, payload?.evaluations),
      guideMeetings: mergeById(base.guideMeetings, payload?.guideMeetings),
      auditLogs: mergeById(base.auditLogs, payload?.auditLogs),
    };
    cachedDynamic = merged;
    lastDynamicFetch = Date.now();
    return merged;
  });

  if (!ok) {
    console.error('[cloud-sync] Dynamic store write did NOT reach durable storage.');
  }
  return ok;
}

/** Persists one team (paper status, proof, project details) so every device sees it. */
export async function saveCloudTeam(team: any): Promise<boolean> {
  if (!team || !team.id) return false;
  return saveCloudDynamicStore({ teams: [team] });
}

export async function fetchCloudTeams(): Promise<any[]> {
  const store = await fetchCloudDynamicStore();
  return Array.isArray(store?.teams) ? store.teams : [];
}
