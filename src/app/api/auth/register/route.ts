import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { saveCloudCredentials } from '@/lib/data/cloud-sync';
import { UserProfile } from '@/lib/types/pbl';
import { normalizeName } from '@/lib/data/seed-dataset';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, password, confirmPassword } = body;

    if (!role || !password) {
      return NextResponse.json({ error: 'Role and password are required.' }, { status: 400 });
    }

    const cleanPass = String(password).trim();
    if (cleanPass.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    if (confirmPassword && cleanPass !== String(confirmPassword).trim()) {
      return NextResponse.json({ error: 'Passwords do not match. Please verify.' }, { status: 400 });
    }

    const allProfiles = store.getAllProfiles();

    // ==========================================
    // 1. STUDENT REGISTRATION
    // ==========================================
    if (role === 'student') {
      const { usn, email, name, section } = body;
      if (!usn) {
        return NextResponse.json({ error: 'USN is required for student registration.' }, { status: 400 });
      }
      if (!email) {
        return NextResponse.json({ error: 'Email ID is required for student registration.' }, { status: 400 });
      }

      const cleanUsn = String(usn).trim().toUpperCase();
      const cleanEmail = String(email).trim().toLowerCase();

      let student = allProfiles.find(p => p.usn?.toUpperCase() === cleanUsn);

      if (student) {
        // Link to existing student seeded in university dataset
        student.email = cleanEmail;
        student.password = cleanPass;
        student.isFirstLogin = false;
        student.passwordUpdatedAt = new Date().toISOString();
        if (name && (!student.name || student.name === student.usn)) {
          student.name = String(name).trim();
        }
      } else {
        // Create new student
        const newStud: UserProfile = {
          id: `stud-${cleanUsn}`,
          usn: cleanUsn,
          name: name ? String(name).trim() : cleanUsn,
          email: cleanEmail,
          role: 'student',
          section: section || 'A',
          password: cleanPass,
          isFirstLogin: false,
          createdAt: new Date().toISOString(),
          passwordUpdatedAt: new Date().toISOString()
        };
        allProfiles.push(newStud);
        student = newStud;
      }

      // Persist credentials to serverless Cloud KV
      const aliases = [student.id, student.usn, student.email].filter(Boolean) as string[];
      await saveCloudCredentials(student.id, {
        password: cleanPass,
        isFirstLogin: false,
        passwordUpdatedAt: student.passwordUpdatedAt
      }, aliases);

      // Uplink to backend store
      store.syncToSupabase().catch(console.error);

      return NextResponse.json({
        success: true,
        user: student,
        message: `Student account successfully created! You can now log in using your USN (${cleanUsn}) as username.`
      }, { status: 201 });
    }

    // ==========================================
    // 2. FACULTY REGISTRATION
    // ==========================================
    if (role === 'faculty') {
      const { employeeId, email, name, phone } = body;
      if (!employeeId) {
        return NextResponse.json({ error: 'Employee ID / Staff Code is required for faculty registration.' }, { status: 400 });
      }
      if (!email) {
        return NextResponse.json({ error: 'Institutional Email ID is required for faculty registration.' }, { status: 400 });
      }
      if (!name) {
        return NextResponse.json({ error: 'Full Name is required for faculty registration.' }, { status: 400 });
      }

      const cleanEmpId = String(employeeId).trim().toUpperCase();
      const cleanEmail = String(email).trim().toLowerCase();
      const cleanName = String(name).trim();
      const cleanPhone = phone ? String(phone).trim() : '';
      const normInputName = normalizeName(cleanName);

      // Check if faculty profile exists in the dataset
      let faculty = allProfiles.find(p => {
        if (p.role !== 'faculty') return false;
        const matchEmail = p.email && p.email.toLowerCase() === cleanEmail;
        const matchEmp = p.staffCode && p.staffCode.toUpperCase() === cleanEmpId;
        const matchName = p.name && normalizeName(p.name) === normInputName;
        return Boolean(matchEmail || matchEmp || matchName);
      });

      if (faculty) {
        // Link to existing faculty guide profile
        faculty.staffCode = cleanEmpId;
        faculty.email = cleanEmail;
        faculty.name = cleanName;
        if (cleanPhone) faculty.phone = cleanPhone;
        faculty.password = cleanPass;
        faculty.isFirstLogin = false;
        faculty.passwordUpdatedAt = new Date().toISOString();
      } else {
        // Create new faculty profile
        const newFac: UserProfile = {
          id: `fac-${Date.now()}`,
          staffCode: cleanEmpId,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone || '9988776655',
          role: 'faculty',
          password: cleanPass,
          isFirstLogin: false,
          createdAt: new Date().toISOString(),
          passwordUpdatedAt: new Date().toISOString()
        };
        allProfiles.push(newFac);
        faculty = newFac;
      }

      // Persist credentials to serverless Cloud KV
      const aliases = [faculty.id, faculty.email, faculty.staffCode, faculty.phone, cleanEmpId].filter(Boolean) as string[];
      await saveCloudCredentials(faculty.id, {
        password: cleanPass,
        isFirstLogin: false,
        passwordUpdatedAt: faculty.passwordUpdatedAt
      }, aliases);

      // Uplink to backend store
      store.syncToSupabase().catch(console.error);

      return NextResponse.json({
        success: true,
        user: faculty,
        message: `Faculty account successfully created! You can now log in using either your Employee ID (${cleanEmpId}) or Email (${cleanEmail}) as username.`
      }, { status: 201 });
    }

    // ==========================================
    // 3. INDUSTRY EXPERT REGISTRATION
    // ==========================================
    if (role === 'industry') {
      const { email, name, phone, organization } = body;
      if (!email) {
        return NextResponse.json({ error: 'Email ID is required for industry person registration.' }, { status: 400 });
      }
      if (!name) {
        return NextResponse.json({ error: 'Full Name is required for industry person registration.' }, { status: 400 });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const cleanName = String(name).trim();
      const cleanPhone = phone ? String(phone).trim() : '';

      let industryUser = allProfiles.find(p => p.email && p.email.toLowerCase() === cleanEmail);

      if (industryUser) {
        industryUser.name = cleanName;
        if (cleanPhone) industryUser.phone = cleanPhone;
        industryUser.password = cleanPass;
        industryUser.isFirstLogin = false;
        industryUser.passwordUpdatedAt = new Date().toISOString();
      } else {
        const idSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const newInd: UserProfile = {
          id: `industry-${idSlug || Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          role: 'admin', // Industry persons hold executive reviewer role
          password: cleanPass,
          isFirstLogin: false,
          createdAt: new Date().toISOString(),
          passwordUpdatedAt: new Date().toISOString()
        };
        allProfiles.push(newInd);
        industryUser = newInd;
      }

      const aliases = [industryUser.id, industryUser.email, industryUser.phone].filter(Boolean) as string[];
      await saveCloudCredentials(industryUser.id, {
        password: cleanPass,
        isFirstLogin: false,
        passwordUpdatedAt: industryUser.passwordUpdatedAt
      }, aliases);

      store.syncToSupabase().catch(console.error);

      return NextResponse.json({
        success: true,
        user: industryUser,
        message: `Industry evaluator account created successfully! You can now log in using your Email (${cleanEmail}) as username.`
      }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid role specified for registration.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Account registration failed.' }, { status: 500 });
  }
}

