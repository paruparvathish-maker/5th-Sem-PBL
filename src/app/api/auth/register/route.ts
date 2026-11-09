import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { saveCloudCredentials } from '@/lib/data/cloud-sync';
import { UserProfile } from '@/lib/types/pbl';
import { normalizeName, getGuideEmail } from '@/lib/data/seed-dataset';
import { createAndSaveActivationToken } from '@/lib/data/otp-store';
import { sendActivationEmail } from '@/lib/utils/mailer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const origin = url.origin || 'https://5th-sem-pbl.vercel.app';
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
        return NextResponse.json({ error: 'College Email ID is required for student registration.' }, { status: 400 });
      }

      const cleanUsn = String(usn).trim().toUpperCase();
      const cleanEmail = String(email).trim().toLowerCase();

      let student = allProfiles.find(p => p.usn?.toUpperCase() === cleanUsn);

      if (student) {
        // Link to existing student seeded in university dataset
        student.email = cleanEmail;
        student.password = cleanPass;
        student.isFirstLogin = false;
        student.isActivated = false;
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
          isActivated: false,
          createdAt: new Date().toISOString(),
          passwordUpdatedAt: new Date().toISOString()
        };
        allProfiles.push(newStud);
        student = newStud;
      }

      // Generate secure activation token and dispatch email
      const activationToken = await createAndSaveActivationToken(cleanEmail);
      student.activationToken = activationToken;
      const activationLink = `${origin}/activate?token=${activationToken}&email=${encodeURIComponent(cleanEmail)}`;

      await sendActivationEmail({
        to: cleanEmail,
        userName: student.name || cleanUsn,
        activationLink
      }).catch(e => console.warn('[Register] Activation mail error:', e));

      // Auto-link student to their assigned team in the dataset
      const allTeams = store.getAllTeams();
      const studentTeam = allTeams.find(t => t.members?.some(m => m.usn?.toUpperCase() === cleanUsn));
      if (studentTeam && studentTeam.members && student.name) {
        const mem = studentTeam.members.find(m => m.usn?.toUpperCase() === cleanUsn);
        if (mem && (!mem.name || mem.name === cleanUsn)) {
          mem.name = student.name;
          store.save(true);
        }
      }

      // Persist credentials to serverless Cloud KV
      const aliases = [student.id, student.usn, student.email].filter(Boolean) as string[];
      await saveCloudCredentials(student.id, {
        password: cleanPass,
        isFirstLogin: false,
        isActivated: false,
        activationToken,
        passwordUpdatedAt: student.passwordUpdatedAt
      }, aliases);

      // Uplink to backend store
      store.syncToSupabase().catch(console.error);

      return NextResponse.json({
        success: true,
        user: student,
        message: `Account created successfully! An activation link has been sent to your college email (${cleanEmail}). Please check your inbox (or spam) and click the link to activate your account.`
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
        faculty.isActivated = false;
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
          isActivated: false,
          createdAt: new Date().toISOString(),
          passwordUpdatedAt: new Date().toISOString()
        };
        allProfiles.push(newFac);
        faculty = newFac;
      }

      // Generate activation link and dispatch email
      const activationToken = await createAndSaveActivationToken(cleanEmail);
      faculty.activationToken = activationToken;
      const activationLink = `${origin}/activate?token=${activationToken}&email=${encodeURIComponent(cleanEmail)}`;

      await sendActivationEmail({
        to: cleanEmail,
        userName: faculty.name,
        activationLink
      }).catch(e => console.warn('[Register] Faculty activation mail error:', e));

      // Auto-map all 4th and 5th sem teams assigned to this faculty guide
      const allTeams = store.getAllTeams();
      let mappedTeamCount = 0;
      allTeams.forEach(t => {
        const teamGuideNorm = t.guideName ? normalizeName(t.guideName) : '';
        const emailMatches = (t.guideEmail && t.guideEmail.toLowerCase() === cleanEmail) ||
                             (t.guideName && getGuideEmail(t.guideName).toLowerCase() === cleanEmail);
        const nameMatches = teamGuideNorm && (
          teamGuideNorm === normInputName ||
          teamGuideNorm.includes(normInputName) ||
          normInputName.includes(teamGuideNorm)
        );

        if (emailMatches || nameMatches) {
          t.guideId = faculty.id;
          t.guideEmail = cleanEmail;
          mappedTeamCount++;
        }
      });
      if (mappedTeamCount > 0) {
        store.save(true);
      }

      // Persist credentials to serverless Cloud KV
      const aliases = [faculty.id, faculty.email, faculty.staffCode, faculty.phone, cleanEmpId].filter(Boolean) as string[];
      await saveCloudCredentials(faculty.id, {
        password: cleanPass,
        isFirstLogin: false,
        isActivated: false,
        activationToken,
        passwordUpdatedAt: faculty.passwordUpdatedAt
      }, aliases);

      // Uplink to backend store
      store.syncToSupabase().catch(console.error);

      return NextResponse.json({
        success: true,
        user: faculty,
        message: `Faculty account created successfully! An activation link has been sent to your institutional email (${cleanEmail}). Please click the link to activate your account.`
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
      const lowerName = cleanName.toLowerCase();

      // Check with exact names from the database to map industry experts
      let matchedAdminId = '';
      if (lowerName.includes('girish')) matchedAdminId = 'industry-girish';
      else if (lowerName.includes('raghu')) matchedAdminId = 'industry-raghu';
      else if (lowerName.includes('raja') || lowerName.includes('shekhar')) matchedAdminId = 'industry-rajashekhar';
      else if (lowerName.includes('manasa')) matchedAdminId = 'industry-manasa';
      else if (lowerName.includes('harshitha')) matchedAdminId = 'industry-harshitha';

      let industryUser = allProfiles.find(p => 
        (matchedAdminId && p.id === matchedAdminId) ||
        (p.email && p.email.toLowerCase() === cleanEmail) ||
        (cleanPhone && p.phone && p.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, ''))
      );

      if (industryUser) {
        industryUser.name = cleanName;
        industryUser.email = cleanEmail;
        if (cleanPhone) industryUser.phone = cleanPhone;
        industryUser.password = cleanPass;
        industryUser.isFirstLogin = false;
        industryUser.isActivated = false;
        industryUser.passwordUpdatedAt = new Date().toISOString();
      } else {
        const idSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const newInd: UserProfile = {
          id: matchedAdminId || `industry-${idSlug || Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          role: 'admin',
          password: cleanPass,
          isFirstLogin: false,
          isActivated: false,
          createdAt: new Date().toISOString(),
          passwordUpdatedAt: new Date().toISOString()
        };
        allProfiles.push(newInd);
        industryUser = newInd;
      }

      // Synchronize assigned teams for this industry expert
      const allTeams = store.getAllTeams();
      allTeams.forEach(t => {
        if (t.industryExpertId === industryUser.id) {
          t.industryExpertEmail = cleanEmail;
          t.industryExpertName = cleanName;
        }
      });
      store.save(true);

      const activationToken = await createAndSaveActivationToken(cleanEmail);
      industryUser.activationToken = activationToken;
      const activationLink = `${origin}/activate?token=${activationToken}&email=${encodeURIComponent(cleanEmail)}`;

      await sendActivationEmail({
        to: cleanEmail,
        userName: industryUser.name,
        activationLink
      }).catch(e => console.warn('[Register] Industry activation mail error:', e));

      const aliases = [industryUser.id, industryUser.email, industryUser.phone].filter(Boolean) as string[];
      await saveCloudCredentials(industryUser.id, {
        password: cleanPass,
        isFirstLogin: false,
        isActivated: false,
        activationToken,
        passwordUpdatedAt: industryUser.passwordUpdatedAt
      }, aliases);

      store.syncToSupabase().catch(console.error);

      return NextResponse.json({
        success: true,
        user: industryUser,
        message: `Account created successfully! An activation link has been sent to your email (${cleanEmail}). Please click the link to activate your account.`
      }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid role specified for registration.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Account registration failed.' }, { status: 500 });
  }
}

