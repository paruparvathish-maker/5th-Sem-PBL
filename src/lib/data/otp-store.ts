// In-memory and Serverless Cloud KV OTP store for password reset verification
const KV_BUCKET = 'UsUUJQ2jfHa2frgSXWQ2bD';
const KV_BASE_URL = `https://kvdb.io/${KV_BUCKET}`;

interface OtpEntry {
  otp: string;
  email: string;
  expiresAt: number;
  verified?: boolean;
  attempts: number;
  aliases: string[];
}

const memoryOtpMap = new Map<string, OtpEntry>();

function normalizeKey(identifier: string): string {
  return identifier.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  const first = user[0];
  const last = user[user.length - 1];
  return `${first}${'*'.repeat(Math.max(3, user.length - 2))}${last}@${domain}`;
}

export async function createAndSaveOtp(identifier: string, email: string, additionalKeys: string[] = []): Promise<string> {
  const cleanKey = normalizeKey(identifier);
  const cleanEmailKey = normalizeKey(email);
  
  // Generate random 6-digit number between 100000 and 999999
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Valid for 10 minutes
  const expiresAt = Date.now() + 10 * 60 * 1000;

  const aliasSet = new Set<string>();
  aliasSet.add(cleanKey);
  aliasSet.add(cleanEmailKey);
  if (identifier.includes('@')) {
    aliasSet.add(normalizeKey(identifier.split('@')[0]));
  }
  if (email.includes('@')) {
    aliasSet.add(normalizeKey(email.split('@')[0]));
  }
  additionalKeys.forEach(k => {
    if (k) {
      aliasSet.add(normalizeKey(k));
      if (k.includes('@')) aliasSet.add(normalizeKey(k.split('@')[0]));
    }
  });

  const allAliases = Array.from(aliasSet).filter(Boolean);

  const entry: OtpEntry = {
    otp,
    email: email.toLowerCase().trim(),
    expiresAt,
    verified: false,
    attempts: 0,
    aliases: allAliases
  };

  // 1. Save in local memory across all alias keys
  for (const k of allAliases) {
    memoryOtpMap.set(k, entry);
  }

  // 2. Persist to serverless Cloud KV for cross-lambda availability
  const primaryKeys = Array.from(new Set([cleanKey, cleanEmailKey].filter(Boolean)));
  for (const k of primaryKeys) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      await fetch(`${KV_BASE_URL}/pbl_otp_${k}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
        signal: controller.signal
      });
      clearTimeout(timeout);
    } catch {}
  }

  return otp;
}

export async function verifyOtpCode(identifier: string, enteredOtp: string): Promise<{ valid: boolean; error?: string; codeBurned?: boolean }> {
  const cleanKey = normalizeKey(identifier);
  const cleanOtp = enteredOtp.replace(/\D/g, '').trim();

  if (!cleanOtp || cleanOtp.length !== 6) {
    return { valid: false, error: 'Please enter the complete 6-digit verification code.', codeBurned: false };
  }

  let entry = memoryOtpMap.get(cleanKey);

  // Fallback 1: check memory values by email or aliases
  if (!entry) {
    const rawLower = identifier.trim().toLowerCase();
    for (const val of Array.from(memoryOtpMap.values())) {
      if (
        val.email.toLowerCase() === rawLower ||
        val.aliases.includes(cleanKey) ||
        (rawLower.includes('@') && val.email === rawLower)
      ) {
        entry = val;
        break;
      }
    }
  }

  // Fallback 2: query serverless Cloud KV
  if (!entry) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${KV_BASE_URL}/pbl_otp_${cleanKey}`, {
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        entry = await res.json();
      }
    } catch {}
  }

  // Fallback 3: if identifier is email or USN, try prefix from Cloud KV
  if (!entry && identifier.includes('@')) {
    const prefix = normalizeKey(identifier.split('@')[0]);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${KV_BASE_URL}/pbl_otp_${prefix}`, {
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        entry = await res.json();
      }
    } catch {}
  }

  if (!entry) {
    return { valid: false, error: 'No active verification code found for this account. Please request a new OTP.', codeBurned: true };
  }

  if (Date.now() > entry.expiresAt) {
    clearOtp(identifier);
    return { valid: false, error: 'Verification code has expired. Please request a new code.', codeBurned: true };
  }

  // Check code matching
  if (entry.otp !== cleanOtp) {
    entry.attempts = (entry.attempts || 0) + 1;
    if (entry.attempts >= 5) {
      clearOtp(identifier);
      return {
        valid: false,
        error: 'Too many incorrect attempts. For security, this verification code has been invalidated. Please request a new OTP.',
        codeBurned: true
      };
    }
    return {
      valid: false,
      error: `Incorrect verification code. Please check your email and try again (${5 - entry.attempts} attempt(s) remaining).`,
      codeBurned: false
    };
  }

  // Code verified successfully
  entry.verified = true;
  if (entry.aliases) {
    for (const a of entry.aliases) {
      memoryOtpMap.set(a, entry);
    }
  }
  memoryOtpMap.set(cleanKey, entry);

  // Update verified status in Cloud KV
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    await fetch(`${KV_BASE_URL}/pbl_otp_${cleanKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch {}

  return { valid: true };
}

export async function isOtpVerified(identifier: string): Promise<boolean> {
  const cleanKey = normalizeKey(identifier);
  let entry = memoryOtpMap.get(cleanKey);

  if (!entry) {
    const rawLower = identifier.trim().toLowerCase();
    for (const val of Array.from(memoryOtpMap.values())) {
      if (
        val.email.toLowerCase() === rawLower ||
        val.aliases?.includes(cleanKey) ||
        (rawLower.includes('@') && val.email === rawLower)
      ) {
        entry = val;
        break;
      }
    }
  }

  if (!entry) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${KV_BASE_URL}/pbl_otp_${cleanKey}`, {
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        entry = await res.json();
      }
    } catch {}
  }

  return !!entry && !!entry.verified && Date.now() <= entry.expiresAt;
}

export async function clearOtp(identifier: string): Promise<void> {
  const cleanKey = normalizeKey(identifier);
  const entry = memoryOtpMap.get(cleanKey);

  if (entry && entry.aliases) {
    for (const a of entry.aliases) {
      memoryOtpMap.delete(a);
      try {
        fetch(`${KV_BASE_URL}/pbl_otp_${a}`, { method: 'DELETE' }).catch(() => {});
      } catch {}
    }
  }

  memoryOtpMap.delete(cleanKey);
  try {
    fetch(`${KV_BASE_URL}/pbl_otp_${cleanKey}`, { method: 'DELETE' }).catch(() => {});
  } catch {}
}

// ==========================================
// ACCOUNT ACTIVATION TOKEN SYSTEM (EMAIL LINK)
// ==========================================
interface ActivationEntry {
  token: string;
  email: string;
  expiresAt: number;
}

const memoryActivationMap = new Map<string, ActivationEntry>();

export async function createAndSaveActivationToken(email: string): Promise<string> {
  const cleanKey = normalizeKey(email);
  // Generate high-entropy secure activation token
  const token = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  
  // 24 hours activation window
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  const entry: ActivationEntry = {
    token,
    email: email.toLowerCase().trim(),
    expiresAt
  };

  memoryActivationMap.set(cleanKey, entry);
  memoryActivationMap.set(token, entry);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    await fetch(`${KV_BASE_URL}/pbl_act_${cleanKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch {}

  return token;
}

export async function verifyActivationToken(email: string, token: string): Promise<{ valid: boolean; error?: string }> {
  const cleanKey = normalizeKey(email);
  let entry = memoryActivationMap.get(cleanKey) || memoryActivationMap.get(token);

  if (!entry) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${KV_BASE_URL}/pbl_act_${cleanKey}`, {
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        entry = await res.json();
      }
    } catch {}
  }

  if (!entry) {
    return { valid: false, error: 'Invalid activation link or account is already activated. Please try signing in.' };
  }

  if (entry.token !== token.trim()) {
    return { valid: false, error: 'Invalid activation token. Please request a new activation email.' };
  }

  if (Date.now() > entry.expiresAt) {
    clearActivationToken(email);
    return { valid: false, error: 'Activation link has expired. Please request a new activation email.' };
  }

  // Clear token upon successful activation
  clearActivationToken(email);
  return { valid: true };
}

export async function clearActivationToken(email: string): Promise<void> {
  const cleanKey = normalizeKey(email);
  memoryActivationMap.delete(cleanKey);
  try {
    fetch(`${KV_BASE_URL}/pbl_act_${cleanKey}`, { method: 'DELETE' }).catch(() => {});
  } catch {}
}

