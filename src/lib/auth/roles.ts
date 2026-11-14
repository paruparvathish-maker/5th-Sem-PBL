/**
 * Role-based access control and executive leadership / industry viewer helpers.
 * HOD, Principal, and Industry Expert accounts have read-only supervision access
 * to 4th Semester Research Papers and 5th Semester PBL Projects only.
 * Full administrative privileges (deadline configuration, additions, modifications, deletions)
 * are strictly reserved for the Main Administrator account.
 */

export interface IndustryAccess {
  isIndustry: boolean;
  industryName: string;
  allowedSemesters: number[];
  allowedSectionsBySemester: Record<number, string[]>;
  allAllowedSections: string[];
}

export function isExecutiveViewer(user?: { id?: string; email?: string; role?: string } | null): boolean {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  const id = (user.id || '').toLowerCase().trim();

  return (
    id === 'admin-hod' ||
    id === 'admin-vp' ||
    id === 'admin-principal' ||
    id === 'admin-industry' ||
    id.startsWith('industry-') ||
    email === 'vp@dsatm.edu.in' ||
    email === 'hod.cse@dsatm.edu.in' ||
    email === 'principal@dsatm.edu.in' ||
    email.startsWith('vp@') ||
    email.includes('industry') ||
    email.includes('hod') ||
    email.includes('principal')
  );
}

export function isFullAdmin(user?: { id?: string; email?: string; role?: string } | null): boolean {
  if (!user || user.role !== 'admin') return false;
  return !isExecutiveViewer(user);
}

/**
 * Determines exact section and semester permissions for industry personnel.
 * - 4th Sem:
 *   - Mr. Girish: 4A and 4D
 *   - Mr. Raghu: 4B and 4E
 *   - Mr. Raja Shekhar: 4C and 4F
 * - 5th Sem:
 *   - Ms. Manasa S: 5A and 5D
 *   - Mr. Raja Shekhar: 5B and 5E
 *   - Ms. Harshitha R: 5C and 5F
 */
export function getIndustryPersonAccess(user?: { id?: string; email?: string; name?: string; phone?: string } | null): IndustryAccess {
  if (!user) {
    return { isIndustry: false, industryName: '', allowedSemesters: [], allowedSectionsBySemester: {}, allAllowedSections: [] };
  }
  const email = (user.email || '').toLowerCase().trim();
  const id = (user.id || '').toLowerCase().trim();
  const name = (user.name || '').toLowerCase().trim();
  const phone = (user.phone || '').replace(/\D/g, '');

  if (id === 'industry-girish' || email.includes('girish') || name.includes('girish') || phone === '9986765626') {
    return {
      isIndustry: true,
      industryName: 'Mr. Girish',
      allowedSemesters: [4],
      allowedSectionsBySemester: { 4: ['A', 'D'] },
      allAllowedSections: ['A', 'D']
    };
  }

  if (id === 'industry-raghu' || email.includes('raghu') || name.includes('raghu') || phone === '8123573747') {
    return {
      isIndustry: true,
      industryName: 'Mr. Raghu',
      allowedSemesters: [4],
      allowedSectionsBySemester: { 4: ['B', 'E'] },
      allAllowedSections: ['B', 'E']
    };
  }

  if (id === 'industry-rajashekhar' || email.includes('rajashekhar') || email.includes('raja') || name.includes('raja') || phone === '9964222260') {
    return {
      isIndustry: true,
      industryName: 'Mr. Raja Shekhar',
      allowedSemesters: [4, 5],
      allowedSectionsBySemester: { 4: ['C', 'F'], 5: ['B', 'E'] },
      allAllowedSections: ['B', 'C', 'E', 'F']
    };
  }

  if (id === 'industry-manasa' || email.includes('manasa') || name.includes('manasa') || phone === '9108932557') {
    return {
      isIndustry: true,
      industryName: 'Ms. Manasa S',
      allowedSemesters: [5],
      allowedSectionsBySemester: { 5: ['A', 'D'] },
      allAllowedSections: ['A', 'D']
    };
  }

  if (id === 'industry-harshitha' || email.includes('harshitha') || name.includes('harshitha') || phone === '9611172433') {
    return {
      isIndustry: true,
      industryName: 'Ms. Harshitha R',
      allowedSemesters: [5],
      allowedSectionsBySemester: { 5: ['C', 'F'] },
      allAllowedSections: ['C', 'F']
    };
  }

  // Fallback for legacy admin-industry account
  if (id === 'admin-industry' || email === 'industry.expert@dsatm.edu.in') {
    return {
      isIndustry: true,
      industryName: 'Industry Partner',
      allowedSemesters: [4, 5],
      allowedSectionsBySemester: { 4: ['A', 'B', 'C', 'D', 'E', 'F'], 5: ['A', 'B', 'C', 'D', 'E', 'F'] },
      allAllowedSections: ['A', 'B', 'C', 'D', 'E', 'F']
    };
  }

  return { isIndustry: false, industryName: '', allowedSemesters: [], allowedSectionsBySemester: {}, allAllowedSections: [] };
}

/**
 * Names, institutional emails and phone numbers the college publishes for its
 * leadership and section supervisors. A registration submitted with any of
 * these values must land on the matching pre-provisioned profile instead of
 * creating a duplicate account.
 */
export interface SupervisorIdentity {
  id: string;
  designations: string[];
  emails: string[];
  phones: string[];
}

const normalizeIdentity = (value?: string): string =>
  (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const SUPERVISOR_IDENTITIES: SupervisorIdentity[] = [
  {
    id: 'admin-principal',
    designations: ['mravishankar', 'ravishankar', 'drmravishankar', 'drravishankar'],
    emails: ['principal@dsatm.edu.in'],
    phones: []
  },
  {
    id: 'admin-hod',
    designations: ['cnandini', 'drcnandini', 'nandini', 'nandinic', 'drnandinic'],
    emails: ['vp@dsatm.edu.in', 'hod.cse@dsatm.edu.in'],
    phones: ['9972634890']
  },
  {
    id: 'industry-girish',
    designations: ['girish', 'girishn', 'mrgirish', 'mrgirishn'],
    emails: ['girish.industry@dsatm.edu.in'],
    phones: ['9986765626']
  },
  {
    id: 'industry-raghu',
    designations: ['raghu', 'raghun', 'mrraghu'],
    emails: ['raghu.industry@dsatm.edu.in'],
    phones: ['8123573747']
  },
  {
    id: 'industry-rajashekhar',
    designations: ['rajashekhara', 'rajashekhar', 'rajashekara', 'rajashekar', 'mrajashekhara'],
    emails: ['rajashekhar.industry@dsatm.edu.in'],
    phones: ['9964222260']
  },
  {
    id: 'industry-manasa',
    designations: ['manasa', 'manasas', 'msmanasas'],
    emails: ['manasa.industry@dsatm.edu.in'],
    phones: ['9108932557']
  },
  {
    id: 'industry-harshitha',
    designations: ['harshitha', 'harshithar', 'msharshithar'],
    emails: ['harshitha.industry@dsatm.edu.in'],
    phones: ['9611172433']
  }
];

/**
 * Resolves a published supervisor / leadership name, email or phone number to
 * the account that already owns that supervision scope. Unknown values return
 * undefined so a brand new account can be created for them.
 */
export function matchSupervisorIdentity(input: { name?: string; email?: string; phone?: string }): string | undefined {
  const name = normalizeIdentity(input.name);
  const email = (input.email || '').toLowerCase().trim();
  const phone = (input.phone || '').replace(/\D/g, '');

  const hit = SUPERVISOR_IDENTITIES.find((identity) =>
    (email && identity.emails.includes(email)) ||
    (phone.length >= 7 && identity.phones.includes(phone)) ||
    (name.length >= 4 && identity.designations.includes(name))
  );

  return hit?.id;
}

/**
 * Maps each project team / research paper group to its designated industry expert based on semester & section.
 */
export function getIndustryExpertForTeam(semester: number, section: string): {
  id: string;
  name: string;
  email: string;
  phone: string;
} | undefined {
  const s = (section || '').toUpperCase().trim();
  const sem = Number(semester) || 5;

  if (sem === 4) {
    if (s === 'A' || s === 'D') {
      return {
        id: 'industry-girish',
        name: 'Mr. Girish',
        email: 'girish.industry@dsatm.edu.in',
        phone: '9986765626'
      };
    }
    if (s === 'B' || s === 'E') {
      return {
        id: 'industry-raghu',
        name: 'Mr. Raghu',
        email: 'raghu.industry@dsatm.edu.in',
        phone: '8123573747'
      };
    }
    if (s === 'C' || s === 'F') {
      return {
        id: 'industry-rajashekhar',
        name: 'Mr. Raja Shekhar',
        email: 'rajashekhar.industry@dsatm.edu.in',
        phone: '9964222260'
      };
    }
  } else if (sem === 5) {
    if (s === 'A' || s === 'D') {
      return {
        id: 'industry-manasa',
        name: 'Ms. Manasa S',
        email: 'manasa.industry@dsatm.edu.in',
        phone: '9108932557'
      };
    }
    if (s === 'B' || s === 'E') {
      return {
        id: 'industry-rajashekhar',
        name: 'Mr. Raja Shekhar',
        email: 'rajashekhar.industry@dsatm.edu.in',
        phone: '9964222260'
      };
    }
    if (s === 'C' || s === 'F') {
      return {
        id: 'industry-harshitha',
        name: 'Ms. Harshitha R',
        email: 'harshitha.industry@dsatm.edu.in',
        phone: '9611172433'
      };
    }
  }

  return undefined;
}
