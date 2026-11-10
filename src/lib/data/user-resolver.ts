import * as fs from 'fs';
import * as path from 'path';
import { store } from '@/lib/data/store';
import { fetchCloudCredentials, saveCloudCredentials } from '@/lib/data/cloud-sync';
import { UserProfile } from '@/lib/types/pbl';

const BACKEND_DATA_PATH = path.join(process.cwd(), 'backend', 'data.json');
const TMP_DATA_PATH = '/tmp/pbl_backend_data.json';

function getDiskProfiles(): UserProfile[] {
  try {
    const targetPath = fs.existsSync(TMP_DATA_PATH) 
      ? TMP_DATA_PATH 
      : (fs.existsSync(BACKEND_DATA_PATH) ? BACKEND_DATA_PATH : null);
    
    if (targetPath) {
      const raw = fs.readFileSync(targetPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.profiles)) {
        return parsed.profiles;
      }
    }
  } catch (err) {
    console.warn('[UserResolver] Error reading profiles from disk:', err);
  }
  return [];
}

export function persistProfileToDisk(updatedProfile: UserProfile): void {
  try {
    const targetPaths = [BACKEND_DATA_PATH, TMP_DATA_PATH];
    
    for (const p of targetPaths) {
      try {
        let data: any = { profiles: [], teams: [] };
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, 'utf8');
          data = JSON.parse(raw);
        }
        if (!Array.isArray(data.profiles)) {
          data.profiles = [];
        }

        const idx = data.profiles.findIndex((existing: any) => 
          existing.id === updatedProfile.id || 
          (existing.usn && updatedProfile.usn && existing.usn.toUpperCase() === updatedProfile.usn.toUpperCase()) ||
          (existing.email && updatedProfile.email && existing.email.toLowerCase() === updatedProfile.email.toLowerCase())
        );

        if (idx >= 0) {
          data.profiles[idx] = { ...data.profiles[idx], ...updatedProfile };
        } else {
          data.profiles.push(updatedProfile);
        }

        const dir = path.dirname(p);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
      } catch (e) {
        // Continue to other path if one is not writable
      }
    }
  } catch (err) {
    console.warn('[UserResolver] Error persisting profile to disk:', err);
  }
}

export interface ResolvedUser {
  user: UserProfile;
  targetEmail: string;
  isActivated: boolean;
  hasCustomPassword: boolean;
}

export async function resolveUserForAuth(identifier: string): Promise<ResolvedUser | null> {
  if (!identifier || typeof identifier !== 'string') return null;
  const clean = identifier.trim();
  const cleanLower = clean.toLowerCase();
  const cleanUpper = clean.toUpperCase();

  // 1. Fetch Cloud Credentials KV snapshot
  let cloudCreds: Record<string, any> = {};
  try {
    cloudCreds = await fetchCloudCredentials();
  } catch {}

  const cred = cloudCreds[clean] || 
               cloudCreds[cleanLower] || 
               cloudCreds[cleanUpper] || 
               cloudCreds[`stud-${cleanUpper}`] ||
               cloudCreds[`fac-${clean}`];

  // Also check if any record in cloudCreds matches by email or USN
  let matchedCred = cred;
  if (!matchedCred) {
    for (const [key, val] of Object.entries(cloudCreds)) {
      if (val && typeof val === 'object') {
        const v = val as any;
        if (
          (v.email && v.email.toLowerCase() === cleanLower) ||
          (v.usn && v.usn.toUpperCase() === cleanUpper) ||
          (key.toLowerCase() === cleanLower)
        ) {
          matchedCred = v;
          break;
        }
      }
    }
  }

  // 2. Search Disk Profiles
  const diskProfiles = getDiskProfiles();
  let diskUser = diskProfiles.find(p => {
    const e = p.email?.toLowerCase();
    const u = p.usn?.toUpperCase();
    const id = p.id?.toLowerCase();
    const sc = p.staffCode?.toUpperCase();
    return (
      e === cleanLower ||
      u === cleanUpper ||
      id === cleanLower ||
      sc === cleanUpper
    );
  });

  // 3. Search in-memory store
  let inMemUser = store.findUserByUsernameOrEmail(clean);

  // Combine and pick the most up-to-date representation
  let baseUser = diskUser || inMemUser;
  if (!baseUser && matchedCred && matchedCred.role) {
    baseUser = {
      id: matchedCred.userId || `user-${Date.now()}`,
      name: matchedCred.name || clean,
      email: matchedCred.email || (clean.includes('@') ? cleanLower : ''),
      role: matchedCred.role as any,
      usn: matchedCred.usn || (cleanUpper.startsWith('1DT') ? cleanUpper : undefined),
      password: matchedCred.password,
      isActivated: matchedCred.isActivated ?? false,
      isFirstLogin: false,
      createdAt: matchedCred.updatedAt || new Date().toISOString()
    };
  }

  if (!baseUser) {
    return null;
  }

  // Determine real registered email:
  // Priority 1: Cloud KV stored email (actively saved during Signup or Password Reset)
  // Priority 2: Disk profile email (if not the dummy @student.dsatm.edu.in)
  // Priority 3: Input identifier if it is an email
  // Priority 4: User profile email if not dummy
  // Priority 5: User profile email
  let realEmail = '';
  if (matchedCred && matchedCred.email && matchedCred.email.includes('@')) {
    realEmail = matchedCred.email.toLowerCase().trim();
  } else if (clean.includes('@')) {
    realEmail = cleanLower;
  } else if (baseUser.email && !baseUser.email.endsWith('@student.dsatm.edu.in')) {
    realEmail = baseUser.email.toLowerCase().trim();
  } else if (baseUser.email) {
    realEmail = baseUser.email.toLowerCase().trim();
  }

  // Ensure baseUser has the correct email updated
  if (realEmail && baseUser.email !== realEmail) {
    baseUser.email = realEmail;
  }

  const isActivated = matchedCred?.isActivated !== undefined 
    ? Boolean(matchedCred.isActivated) 
    : Boolean(baseUser.isActivated);

  const hasCustomPassword = Boolean(matchedCred?.password || baseUser.password);

  return {
    user: baseUser,
    targetEmail: realEmail,
    isActivated,
    hasCustomPassword
  };
}

