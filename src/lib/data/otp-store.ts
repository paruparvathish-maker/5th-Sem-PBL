// In-memory and Serverless Cloud KV OTP store for password reset verification
const KV_BUCKET = 'UsUUJQ2jfHa2frgSXWQ2bD';
const KV_BASE_URL = `https://kvdb.io/${KV_BUCKET}`;

interface OtpEntry {
  otp: string;
  email: string;
  expiresAt: number;
  verified?: boolean;
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

export async function createAndSaveOtp(identifier: string, email: string): Promise<string> {
  const cleanKey = normalizeKey(identifier);
  const cleanEmailKey = normalizeKey(email);
  
  // Generate random 6-digit number between 100000 and 999999
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  const entry: OtpEntry = {
    otp,
    email: email.toLowerCase(),
    expiresAt,
    verified: false
  };

  // 1. Save in local memory
  memoryOtpMap.set(cleanKey, entry);
  memoryOtpMap.set(cleanEmailKey, entry);

  // 2. Persist to serverless Cloud KV for cross-lambda availability
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    await fetch(`${KV_BASE_URL}/pbl_otp_${cleanKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
      signal: controller.signal
    });
    clearTimeout(timeout);
  } catch {}

  return otp;
}

export async function verifyOtpCode(identifier: string, enteredOtp: string): Promise<{ valid: boolean; error?: string; codeBurned?: boolean }> {
  const cleanKey = normalizeKey(identifier);
  const cleanOtp = enteredOtp.trim();

  let entry = memoryOtpMap.get(cleanKey);

  // Fallback to serverless Cloud KV
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

  if (!entry) {
    return { valid: false, error: 'No active OTP found for this account. Please request a new verification code.', codeBurned: true };
  }

  if (Date.now() > entry.expiresAt) {
    memoryOtpMap.delete(cleanKey);
    try {
      fetch(`${KV_BASE_URL}/pbl_otp_${cleanKey}`, { method: 'DELETE' }).catch(() => {});
    } catch {}
    return { valid: false, error: 'Verification code has expired. Please request a new code.', codeBurned: true };
  }

  // If wrong OTP is entered, immediately burn/invalidate the code for security
  if (entry.otp !== cleanOtp) {
    memoryOtpMap.delete(cleanKey);
    try {
      fetch(`${KV_BASE_URL}/pbl_otp_${cleanKey}`, { method: 'DELETE' }).catch(() => {});
    } catch {}
    return {
      valid: false,
      error: 'Incorrect verification code. For security, this code is no longer valid. Please re-enter your details to request a new OTP.',
      codeBurned: true
    };
  }

  entry.verified = true;
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
  memoryOtpMap.delete(cleanKey);
  try {
    fetch(`${KV_BASE_URL}/pbl_otp_${cleanKey}`, { method: 'DELETE' }).catch(() => {});
  } catch {}
}

