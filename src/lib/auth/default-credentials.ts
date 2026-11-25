/**
 * Institution-issued first sign-in credentials for faculty accounts.
 *
 * These are only a starting password: as soon as the teacher sets their own
 * password (mandatory on first sign in), that password is what authenticates
 * them. The defaults must never override a password that has been set.
 */
export const DEFAULT_FACULTY_CREDENTIALS: Record<string, string> = {
  'manasa-cs@dsatm.edu.in': 'Manasa',
};

type CredentialHolder = { email?: string; role?: string } | null | undefined;

export function getDefaultFacultyPassword(user: CredentialHolder): string | undefined {
  if (!user || user.role !== 'faculty') return undefined;
  return DEFAULT_FACULTY_CREDENTIALS[(user.email || '').trim().toLowerCase()];
}

/** True when the supplied password is the institution-issued default for this faculty account. */
export function isDefaultFacultyCredential(user: CredentialHolder, password: string | undefined): boolean {
  const expected = getDefaultFacultyPassword(user);
  if (!expected || password === undefined) return false;
  return password.trim() === expected;
}
