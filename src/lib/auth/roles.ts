/**
 * Role-based access control and executive leadership viewer helpers.
 * HOD, Principal, and Industry Expert accounts have read-only supervision access
 * to 4th Semester Research Papers and 5th Semester PBL Projects only.
 * Full administrative privileges (deadline configuration, additions, modifications, deletions)
 * are strictly reserved for the Main Administrator account.
 */

export function isExecutiveViewer(user?: { id?: string; email?: string; role?: string } | null): boolean {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  const id = (user.id || '').toLowerCase().trim();

  return (
    id === 'admin-hod' ||
    id === 'admin-principal' ||
    id === 'admin-industry' ||
    email === 'hod.cse@dsatm.edu.in' ||
    email === 'principal@dsatm.edu.in' ||
    email === 'industry.expert@dsatm.edu.in' ||
    email.includes('hod') ||
    email.includes('principal') ||
    email.includes('industry')
  );
}

export function isFullAdmin(user?: { id?: string; email?: string; role?: string } | null): boolean {
  if (!user || user.role !== 'admin') return false;
  return !isExecutiveViewer(user);
}
