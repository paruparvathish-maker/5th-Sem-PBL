import { NextResponse } from 'next/server';
import { store } from '@/lib/data/store';
import { saveCloudCredentials } from '@/lib/data/cloud-sync';
import { UserProfile } from '@/lib/types/pbl';
import { normalizeName, getGuideEmail } from '@/lib/data/seed-dataset';
import { createAndSaveActivationToken } from '@/lib/data/otp-store';
import { sendActivationEmail, getAppOrigin } from '@/lib/utils/mailer';
import { persistProfileToDisk } from '@/lib/data/user-resolver';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const origin = getAppOrigin(request);
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

      let cleanUsn = usn ? String(usn).trim().toUpperCase() : '';
      let cleanEmail = email ? String(email).trim().toLowerCase() : '';

      // Auto-extract USN from DSATM email (e.g. 1dt24cs010@dsatm.edu.in -> 1DT24CS010)
      if (cleanEmail && !cleanUsn && cleanEmail.includes('@dsatm.edu.in')) {
        const prefix = cleanEmail.split('@')[0].toUpperCase();
        if (prefix.startsWith('1DT')) {
          cleanUsn = prefix;
        }
      }

      // Auto-populate DSATM email from USN
      if (cleanUsn && !cleanEmail) {
        cleanEmail = `${cleanUsn.toLowerCase()}@dsatm.edu.in`;
      }

      if (!cleanUsn) {
        return NextResponse.json({ error: 'USN or official DSATM college email is required.' }, { status: 400 });
      }

      // Strictly allow ONLY @dsatm.edu.in student emails!
      if (!cleanEmail.endsWith('@dsatm.edu.in')) {
        return NextResponse.json({
          error: 'Registration restricted: Only official DSATM student email IDs (e.g. 1dt24cs***@dsatm.edu.in or 1dt25cs***@dsatm.edu.in) are allowed. Other personal email domains are not permitted.'
        }, { status: 400 });
      }

      const emailPrefix = cleanEmail.split('@')[0].toUpperCase();
      if (emailPrefix !== cleanUsn) {
        return NextResponse.json({
          error: `Your student email (${cleanEmail}) does not match your USN (${cleanUsn}). Expected: ${cleanUsn.toLowerCase()}@dsatm.edu.in.`
        }, { status: 400 });
      }

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

      // Persist profile to disk (server-side persistence)
      persistProfileToDisk(student);
      store.save(true);

      // Generate secure activation token and dispatch email
      const activationToken = await createAndSaveActivationToken(cleanEmail);
      student.activationToken = activationToken;
      const activationLink = `${origin}/activate?token=${activationToken}&email=${encodeURIComponent(cleanEmail)}`;

      const mailResult = await sendActivationEmail({
        to: cleanEmail,
        userName: student.name || cleanUsn,
        activationLink
      });

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
      const aliases = [student.id, student.usn, student.email, cleanUsn, cleanEmail].filter(Boolean) as string[];
      await saveCloudCredentials(student.id, {
        password: cleanPass,
        isFirstLogin: false,
        isActivated: false,
        activationToken,
        passwordUpdatedAt: student.passwordUpdatedAt,
        email: cleanEmail,
        name: student.name,
        usn: cleanUsn,
        role: 'student'
      }, aliases);

      // Uplink to backend store
      store.syncToSupabase().catch(console.error);

      if (!mailResult.success) {
        return NextResponse.json({
          success: true,
          user: student,
          warning: mailResult.error,
          message: `Account created successfully! However, the activation email could not be delivered to ${cleanEmail} (${mailResult.error}). You can use "Resend Activation Link" on the Login screen, or ask your administrator to verify your email.`
        }, { status: 201 });
      }

      return NextResponse.json({
        success: true,
        user: student,
        message: `Account created successfully! An activation link has been sent to your college email (${cleanEmail}). Please check your inbox (and spam folder) and click the link to activate your account.`
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
        faculty.staffCode = cleanEmpId;
        faculty.email = cleanEmail;
        faculty.name = cleanName;
        if (cleanPhone) faculty.phone = cleanPhone;
        faculty.password = cleanPass;
        faculty.isFirstLogin = false;
        faculty.isActivated = false;
        faculty.passwordUpdatedAt = new Date().toISOString();
      } else {
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

      // Persist profile to disk (server-side persistence)
      persistProfileToDisk(faculty);
      store.save(true);

      // Generate activation link and dispatch email
      const activationToken = await createAndSaveActivationToken(cleanEmail);
      faculty.activationToken = activationToken;
      const activationLink = `${origin}/activate?token=${activationToken}&email=${encodeURIComponent(cleanEmail)}`;

      const mailResult = await sendActivationEmail({
        to: cleanEmail,
        userName: faculty.name,
        activationLink
      });

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
      const aliases = [faculty.id, faculty.email, faculty.staffCode, faculty.phone, cleanEmpId, cleanEmail].filter(Boolean) as string[];
      await saveCloudCredentials(faculty.id, {
        password: cleanPass,
        isFirstLogin: false,
        isActivated: false,
        activationToken,
        passwordUpdatedAt: faculty.passwordUpdatedAt,
        email: cleanEmail,
        name: faculty.name,
        role: 'faculty'
      }, aliases);

      // Uplink to backend store
      store.syncToSupabase().catch(console.error);

      if (!mailResult.success) {
        return NextResponse.json({
          success: true,
          user: faculty,
          warning: mailResult.error,
          message: `Faculty account created! However, the activation email could not be delivered to ${cleanEmail} (${mailResult.error}). Please use "Resend Activation Link" on the login page or check your spam folder.`
        }, { status: 201 });
      }

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

      // Persist profile to disk (server-side persistence)
      persistProfileToDisk(industryUser);

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

      const mailResult = await sendActivationEmail({
        to: cleanEmail,
        userName: industryUser.name,
        activationLink
      });

      const aliases = [industryUser.id, industryUser.email, industryUser.phone, cleanEmail].filter(Boolean) as string[];
      await saveCloudCredentials(industryUser.id, {
        password: cleanPass,
        isFirstLogin: false,
        isActivated: false,
        activationToken,
        passwordUpdatedAt: industryUser.passwordUpdatedAt,
        email: cleanEmail,
        name: industryUser.name,
        role: 'admin'
      }, aliases);

      store.syncToSupabase().catch(console.error);

      if (!mailResult.success) {
        return NextResponse.json({
          success: true,
          user: industryUser,
          warning: mailResult.error,
          message: `Industry account created! However, the activation email could not be delivered to ${cleanEmail} (${mailResult.error}). Please use "Resend Activation Link" on the login page or check your spam folder.`
        }, { status: 201 });
      }

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
