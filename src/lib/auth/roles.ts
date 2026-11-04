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
    id === 'admin-principal' ||
    id === 'admin-industry' ||
    id.startsWith('industry-') ||
    email === 'hod.cse@dsatm.edu.in' ||
    email === 'principal@dsatm.edu.in' ||
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
