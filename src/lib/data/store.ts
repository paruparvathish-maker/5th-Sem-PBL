import {
  UserProfile, Team, Deadline, Submission, Evaluation, GuideMeeting, NotificationItem, AuditLogItem, SectionCode, ResearchPaperStatus
} from '../types/pbl';
import { RAW_PDF_SEED, getGuideEmail, getGuidePhone } from './seed-dataset';
import { RAW_4TH_SEM_SEED } from './seed-dataset-4th';
import { saveFileToIdb } from '../utils/idb-storage';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

class PBLStore {
  private profiles: UserProfile[] = [];
  private teams: Team[] = [];
  private deadlines: Deadline[] = [];
  private submissions: Submission[] = [];
  private evaluations: Evaluation[] = [];
  private guideMeetings: GuideMeeting[] = [];
  private notifications: NotificationItem[] = [];
  private auditLogs: AuditLogItem[] = [];
  private initialized = false;

  constructor() {
    this.initSeedData();
  }

  private initSeedData() {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('pbl_portal_store_v7');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          this.profiles = parsed.profiles || [];

          // Force update admin email if they have an old localStorage state
          const admin = this.profiles.find((p: UserProfile) => p.role === 'admin' && p.id === '180881');
          if (admin) {
            admin.email = 'paruparvathish@gmail.com';
            admin.password = '03May@2002@';
          }

          // Restore credentials backup
          try {
            const credsBackup = JSON.parse(localStorage.getItem('pbl_user_credentials_backup') || '{}');
            this.profiles.forEach(p => {
              const b = credsBackup[p.id] || (p.usn && credsBackup[p.usn]) || credsBackup[p.email];
              if (b && b.password) {
                p.password = b.password;
                p.isFirstLogin = false;
                p.passwordUpdatedAt = b.passwordUpdatedAt;
              }
            });
          } catch (e) { }

          this.teams = parsed.teams || [];

          // Synchronize 5th sem project titles from latest RAW_PDF_SEED
          RAW_PDF_SEED.forEach(seedTeam => {
            const existing = this.teams.find(t => (t.semester || 5) === 5 && t.teamNumber === seedTeam.teamNumber && t.section === seedTeam.section);
            if (existing) {
              if (!existing.projectTitle || existing.projectTitle === 'To Be Decided (TBD)' || existing.projectTitle.startsWith('4th Sem')) {
                existing.projectTitle = seedTeam.projectTitle;
                existing.projectDescription = seedTeam.projectDescription;
              }
            }
          });
          this.deadlines = (parsed.deadlines || []).filter((d: any) =>
            d.id !== 'dl-guide-meeting' &&
            !d.title.toLowerCase().includes('guide meeting') &&
            d.id !== 'dl-project-stmt' &&
            !d.title.toLowerCase().includes('problem statement')
          );
          if (!this.deadlines.some(d => d.id === 'dl-review-1' || d.title.toLowerCase().includes('1st review'))) {
            this.deadlines.push({
              id: 'dl-review-1',
              title: '1st Review Report',
              description: 'Upload your Phase 1 / 1st Review Report document (PDF or Word) for faculty guide review and evaluation.',
              deadlineType: 'submission',
              dueDate: '2026-11-25T17:00:00',
              applicableSections: ['A', 'B', 'C', 'D', 'E', 'F'],
              submissionRequired: true,
              status: 'open',
              createdBy: '180881',
              createdAt: new Date().toISOString()
            });
          }
          this.submissions = (parsed.submissions || []).filter((s: any) =>
            s.deadlineId !== 'dl-guide-meeting' &&
            s.deadlineId !== 'dl-project-stmt' &&
            !s.deadlineTitle?.toLowerCase().includes('problem statement')
          );
          this.evaluations = parsed.evaluations || [];
          this.guideMeetings = parsed.guideMeetings || [];
          this.notifications = parsed.notifications || [];
          this.auditLogs = parsed.auditLogs || [];
          this.initialized = true;
          return;
        } catch (e) {
          console.error("Error restoring PBL store:", e);
        }
      }
    }

    // Provision Main Admin & Executive Leadership Admins (HOD, Principal, Industry Person)
    const adminUser: UserProfile = {
      id: '180881',
      email: 'paruparvathish@gmail.com',
      name: 'Parvathisha P (Main Admin)',
      role: 'admin',
      password: '03May@2002@',
      isFirstLogin: false,
      createdAt: new Date().toISOString()
    };

    const hodAdmin: UserProfile = {
      id: 'admin-hod',
      email: 'hod.cse@dsatm.edu.in',
      name: 'Dr. C Nandini (HOD CSE)',
      role: 'admin',
      password: 'HOD@CSE#2026',
      isFirstLogin: false,
      createdAt: new Date().toISOString()
    };

    const principalAdmin: UserProfile = {
      id: 'admin-principal',
      email: 'principal@dsatm.edu.in',
      name: 'Dr. Principal Office',
      role: 'admin',
      password: 'DSATM@PRIN#984',
      isFirstLogin: false,
      createdAt: new Date().toISOString()
    };

    const industryAdmin: UserProfile = {
      id: 'admin-industry',
      email: 'industry.expert@dsatm.edu.in',
      name: 'Mr. Rajesh Kumar (Industry Partner)',
      role: 'admin',
      password: 'IND@EXPERT#451',
      isFirstLogin: false,
      createdAt: new Date().toISOString()
    };

    this.profiles.push(adminUser, hodAdmin, principalAdmin, industryAdmin);

    const facultyMap = new Map<string, UserProfile>();

    RAW_PDF_SEED.forEach((seedTeam, idx) => {
      // Provision Faculty Guide if not present
      const guideEmail = getGuideEmail(seedTeam.guideName);
      const guidePhone = getGuidePhone(seedTeam.guideName);
      if (!facultyMap.has(guideEmail)) {
        const facProfile: UserProfile = {
          id: `fac-${facultyMap.size + 1}`,
          email: guideEmail,
          name: seedTeam.guideName,
          role: 'faculty',
          phone: guidePhone,
          staffCode: `F${1000 + facultyMap.size + 1}`,
          isFirstLogin: true,
          createdAt: new Date().toISOString()
        };
        facultyMap.set(guideEmail, facProfile);
        this.profiles.push(facProfile);
      }
      const guideObj = facultyMap.get(guideEmail)!;

      // Create Team (Semester 5)
      const teamId = `team-5-${seedTeam.section}-${seedTeam.teamNumber}`;
      const teamMembersList: UserProfile[] = [];

      seedTeam.students.forEach((s, sIdx) => {
        const cleanUsn = s.usn.toUpperCase().trim();
        let studProfile = this.profiles.find(p => p.usn === cleanUsn);
        if (!studProfile) {
          let hash = 0;
          for (let i = 0; i < cleanUsn.length; i++) hash = (hash << 5) - hash + cleanUsn.charCodeAt(i);
          const studentPhone = `98450${Math.abs(hash).toString().padStart(5, '0').slice(-5)}`;

          studProfile = {
            id: `stud-${cleanUsn}`,
            email: `${cleanUsn.toLowerCase()}@student.dsatm.edu.in`,
            name: s.name,
            usn: cleanUsn,
            role: 'student',
            section: seedTeam.section,
            phone: studentPhone,
            isFirstLogin: true,
            createdAt: new Date().toISOString()
          };
          this.profiles.push(studProfile);
        }
        teamMembersList.push(studProfile);
      });

      const teamObj: Team = {
        id: teamId,
        teamNumber: seedTeam.teamNumber,
        section: seedTeam.section,
        semester: 5,
        projectTitle: seedTeam.projectTitle,
        projectDescription: seedTeam.projectDescription,
        guideId: guideObj.id,
        guideName: guideObj.name,
        guideEmail: guideObj.email,
        members: teamMembersList,
        createdAt: new Date().toISOString()
      };
      this.teams.push(teamObj);
    });

    // Seed 4th Semester Teams
    RAW_4TH_SEM_SEED.forEach((seedTeam) => {
      const guideEmail = getGuideEmail(seedTeam.guideName);
      const guidePhone = getGuidePhone(seedTeam.guideName);
      if (!facultyMap.has(guideEmail)) {
        const facProfile: UserProfile = {
          id: `fac-${facultyMap.size + 1}`,
          email: guideEmail,
          name: seedTeam.guideName,
          role: 'faculty',
          phone: guidePhone,
          staffCode: `F${1000 + facultyMap.size + 1}`,
          isFirstLogin: true,
          createdAt: new Date().toISOString()
        };
        facultyMap.set(guideEmail, facProfile);
        this.profiles.push(facProfile);
      }
      const guideObj = facultyMap.get(guideEmail)!;

      const teamId = `team-4-${seedTeam.section}-${seedTeam.teamNumber}`;
      const teamMembersList: UserProfile[] = [];

      seedTeam.students.forEach((s) => {
        const cleanUsn = s.usn.toUpperCase().trim();
        let studProfile = this.profiles.find(p => p.usn === cleanUsn);
        if (!studProfile) {
          studProfile = {
            id: `stud-${cleanUsn}`,
            email: `${cleanUsn.toLowerCase()}@student.dsatm.edu.in`,
            name: s.name,
            usn: cleanUsn,
            role: 'student',
            section: seedTeam.section,
            isFirstLogin: true,
            createdAt: new Date().toISOString()
          };
          this.profiles.push(studProfile);
        }
        teamMembersList.push(studProfile);
      });

      const teamObj: Team = {
        id: teamId,
        teamNumber: seedTeam.teamNumber,
        section: seedTeam.section,
        semester: 4,
        projectTitle: `4th Sem Research Paper (${seedTeam.teamNumber})`,
        projectDescription: `Research paper work under ${seedTeam.guideName}`,
        guideId: guideObj.id,
        guideName: guideObj.name,
        guideEmail: guideObj.email,
        members: teamMembersList,
        researchPaperStatus: 'submitted',
        createdAt: new Date().toISOString()
      };
      this.teams.push(teamObj);
    });

    // Seed Standard Deadlines
    const dReview1: Deadline = {
      id: 'dl-review-1',
      title: '1st Review Report',
      description: 'Upload your Phase 1 / 1st Review Report document (PDF or Word) for faculty guide review and evaluation.',
      deadlineType: 'submission',
      dueDate: '2026-11-25T17:00:00',
      applicableSections: ['A', 'B', 'C', 'D', 'E', 'F'],
      submissionRequired: true,
      status: 'open',
      createdBy: adminUser.id,
      createdAt: new Date().toISOString()
    };

    this.deadlines.push(dReview1);

    // Initial audit log
    this.auditLogs.push({
      id: 'audit-001',
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: 'admin',
      action: 'System Database Initialized',
      entityType: 'System',
      details: { totalProfiles: this.profiles.length, totalTeams: this.teams.length },
      createdAt: new Date().toISOString()
    });

    this.save(true);
    this.initialized = true;
  }

  private save(skipCloudSync: boolean = false) {
    if (typeof window !== 'undefined') {
      try {
        // Strip large base64 file data before persisting to localStorage
        // Large files are safely cached in IndexedDB via idb-storage.ts
        const lightweightSubmissions = this.submissions.map(s => {
          if (s.fileData && s.fileData.length > 50000) {
            const { fileData, ...rest } = s;
            return rest;
          }
          return s;
        });

        localStorage.setItem('pbl_portal_store_v7', JSON.stringify({
          profiles: this.profiles,
          teams: this.teams,
          deadlines: this.deadlines,
          submissions: lightweightSubmissions,
          evaluations: this.evaluations,
          guideMeetings: this.guideMeetings,
          notifications: this.notifications,
          auditLogs: this.auditLogs
        }));

        // Fire-and-forget sync to cloud
        if (!skipCloudSync) {
          this.syncToSupabase().catch(console.error);
        }
      } catch (e) {
        console.error("Save store error:", e);
      }
    }
  }

  public async syncFromSupabase() {
    try {
      const getFastApiUrl = () => {
        if (process.env.NEXT_PUBLIC_FASTAPI_URL) return process.env.NEXT_PUBLIC_FASTAPI_URL;
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          return 'https://backend-beta-kohl-9pcedk6q96.vercel.app';
        }
        return 'http://127.0.0.1:8000';
      };

      const fastApiUrl = getFastApiUrl();
      let res: Response | null = null;
      try {
        res = await fetch(`${fastApiUrl}/api/db`, { mode: 'cors' });
      } catch {
        // Fallback to internal /api/db proxy
      }
      if (!res || !res.ok) {
        res = await fetch('/api/db');
      }
      if (res && res.ok) {
        const data = await res.json();
        if (data.profiles && Array.isArray(data.profiles)) {
          let credsBackup: Record<string, any> = {};
          if (typeof window !== 'undefined') {
            try {
              credsBackup = JSON.parse(localStorage.getItem('pbl_user_credentials_backup') || '{}');
            } catch (e) { }
          }

          const incomingMap = new Map<string, UserProfile>(data.profiles.map((p: UserProfile) => [p.id, p]));
          this.profiles = this.profiles.map((localProf) => {
            const incoming = incomingMap.get(localProf.id);
            if (!incoming) return localProf;

            const backup = credsBackup[localProf.id] || (localProf.usn && credsBackup[localProf.usn]) || credsBackup[localProf.email];
            const localHasCustomPass = !!localProf.password && localProf.isFirstLogin === false;
            const backupHasCustomPass = backup && !!backup.password && backup.isFirstLogin === false;

            let finalPass = incoming.password;
            let finalIsFirstLogin = incoming.isFirstLogin;
            let finalUpdatedAt = incoming.passwordUpdatedAt;

            if (localHasCustomPass || backupHasCustomPass) {
              finalPass = localProf.password || backup?.password;
              finalIsFirstLogin = false;
              finalUpdatedAt = localProf.passwordUpdatedAt || backup?.passwordUpdatedAt || new Date().toISOString();
            }

            return {
              ...incoming,
              password: finalPass,
              isFirstLogin: finalIsFirstLogin !== undefined ? finalIsFirstLogin : localProf.isFirstLogin,
              phone: localProf.phone || incoming.phone,
              passwordUpdatedAt: finalUpdatedAt
            };
          });

          data.profiles.forEach((p: UserProfile) => {
            if (!this.profiles.some(local => local.id === p.id)) {
              this.profiles.push(p);
            }
          });
        }

        // Intelligent merge for teams: preserve newer local updates
        if (data.teams && Array.isArray(data.teams)) {
          const incomingMap = new Map<string, Team>(data.teams.map((t: Team) => [t.id, t]));
          this.teams = this.teams.map((localTeam) => {
            const incoming = incomingMap.get(localTeam.id);
            if (!incoming) return localTeam;

            const localTime = localTeam.researchPaperUpdatedAt ? new Date(localTeam.researchPaperUpdatedAt).getTime() : 0;
            const incomingTime = incoming.researchPaperUpdatedAt ? new Date(incoming.researchPaperUpdatedAt).getTime() : 0;

            if (localTime > incomingTime || (localTeam.researchPaperProofName && !incoming.researchPaperProofName)) {
              return {
                ...incoming,
                researchPaperStatus: localTeam.researchPaperStatus || incoming.researchPaperStatus,
                researchPaperProofName: localTeam.researchPaperProofName,
                researchPaperProofPath: localTeam.researchPaperProofPath,
                researchPaperUpdatedAt: localTeam.researchPaperUpdatedAt || incoming.researchPaperUpdatedAt,
              };
            }
            return incoming;
          });

          data.teams.forEach((t: Team) => {
            if (!this.teams.some(local => local.id === t.id)) {
              this.teams.push(t);
            }
          });
        }

        if (data.deadlines && Array.isArray(data.deadlines) && data.deadlines.length > 0) {
          const filteredIncoming = data.deadlines.filter((d: any) =>
            d.id !== 'dl-guide-meeting' &&
            !d.title?.toLowerCase().includes('guide meeting') &&
            d.id !== 'dl-project-stmt' &&
            !d.title?.toLowerCase().includes('problem statement')
          );
          if (filteredIncoming.length > 0) {
            this.deadlines = filteredIncoming;
          }
        }
        if (!this.deadlines.some(d => d.id === 'dl-review-1' || d.title.toLowerCase().includes('1st review'))) {
          this.deadlines.push({
            id: 'dl-review-1',
            title: '1st Review Report',
            description: 'Upload your Phase 1 / 1st Review Report document (PDF or Word) for faculty guide review and evaluation.',
            deadlineType: 'submission',
            dueDate: '2026-11-25T17:00:00',
            applicableSections: ['A', 'B', 'C', 'D', 'E', 'F'],
            submissionRequired: true,
            status: 'open',
            createdBy: '180881',
            createdAt: new Date().toISOString()
          });
        }

        // Intelligent non-destructive merge for submissions: NEVER let remote empty arrays wipe out local submissions
        if (data.submissions && Array.isArray(data.submissions) && data.submissions.length > 0) {
          const incomingSubMap = new Map<string, Submission>(
            data.submissions
              .filter((s: any) => s.deadlineId !== 'dl-guide-meeting' && s.deadlineId !== 'dl-project-stmt')
              .map((s: Submission) => [s.id, s])
          );

          this.submissions = this.submissions.map(localSub => {
            const incoming = incomingSubMap.get(localSub.id);
            if (!incoming) return localSub;
            return {
              ...incoming,
              fileData: localSub.fileData || incoming.fileData,
              isLocked: localSub.isLocked !== undefined ? localSub.isLocked : incoming.isLocked,
            };
          });

          data.submissions.forEach((s: Submission) => {
            if (s.deadlineId !== 'dl-guide-meeting' && s.deadlineId !== 'dl-project-stmt') {
              if (!this.submissions.some(local => local.id === s.id)) {
                this.submissions.push(s);
              }
            }
          });
        }

        // Intelligent non-destructive merge for evaluations
        if (data.evaluations && Array.isArray(data.evaluations) && data.evaluations.length > 0) {
          const incomingEvalMap = new Map<string, Evaluation>(data.evaluations.map((e: Evaluation) => [e.id, e]));
          this.evaluations = this.evaluations.map(localEval => {
            const incoming = incomingEvalMap.get(localEval.id);
            return incoming || localEval;
          });
          data.evaluations.forEach((e: Evaluation) => {
            if (!this.evaluations.some(local => local.id === e.id)) {
              this.evaluations.push(e);
            }
          });
        }

        // Intelligent non-destructive merge for guide meetings
        if (data.guideMeetings && Array.isArray(data.guideMeetings) && data.guideMeetings.length > 0) {
          const incomingMeetingMap = new Map<string, GuideMeeting>(data.guideMeetings.map((m: GuideMeeting) => [m.id, m]));
          this.guideMeetings = this.guideMeetings.map(localMeeting => {
            const incoming = incomingMeetingMap.get(localMeeting.id);
            return incoming || localMeeting;
          });
          data.guideMeetings.forEach((m: GuideMeeting) => {
            if (!this.guideMeetings.some(local => local.id === m.id)) {
              this.guideMeetings.push(m);
            }
          });
        }

        if (data.notifications && Array.isArray(data.notifications) && data.notifications.length > 0) {
          data.notifications.forEach((n: NotificationItem) => {
            if (!this.notifications.some(local => local.id === n.id)) {
              this.notifications.push(n);
            }
          });
        }

        if (data.auditLogs && Array.isArray(data.auditLogs) && data.auditLogs.length > 0) {
          data.auditLogs.forEach((a: AuditLogItem) => {
            if (!this.auditLogs.some(local => local.id === a.id)) {
              this.auditLogs.push(a);
            }
          });
        }

        if (typeof window !== 'undefined') {
          const lightweightSubmissions = this.submissions.map(s => {
            if (s.fileData && s.fileData.length > 50000) {
              const { fileData, ...rest } = s;
              return rest;
            }
            return s;
          });

          localStorage.setItem('pbl_portal_store_v7', JSON.stringify({
            profiles: this.profiles,
            teams: this.teams,
            deadlines: this.deadlines,
            submissions: lightweightSubmissions,
            evaluations: this.evaluations,
            guideMeetings: this.guideMeetings,
            notifications: this.notifications,
            auditLogs: this.auditLogs
          }));
        }
      }
    } catch (err) {
      console.error('Sync from backend API failed', err);
    }
  }

  public async syncToSupabase() {
    try {
      const lightweightSubmissions = this.submissions.map(s => {
        if (s.fileData && s.fileData.length > 100000) {
          const { fileData, ...rest } = s;
          return rest;
        }
        return s;
      });

      const payload = JSON.stringify({
        profiles: this.profiles,
        teams: this.teams,
        deadlines: this.deadlines,
        submissions: lightweightSubmissions,
        evaluations: this.evaluations,
        guideMeetings: this.guideMeetings,
        notifications: this.notifications,
        auditLogs: this.auditLogs
      });

      const getFastApiUrl = () => {
        if (process.env.NEXT_PUBLIC_FASTAPI_URL) return process.env.NEXT_PUBLIC_FASTAPI_URL;
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          return 'https://backend-beta-kohl-9pcedk6q96.vercel.app';
        }
        return 'http://127.0.0.1:8000';
      };

      const fastApiUrl = getFastApiUrl();
      try {
        await fetch(`${fastApiUrl}/api/db`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          mode: 'cors'
        });
      } catch {
        // Fallback to Next.js /api/db
      }

      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      }).catch(() => { });
    } catch (err) {
      console.error('Sync to backend API failed', err);
    }
  }



  // --- Auth & Users ---
  public findUserByUsernameOrEmail(identifier: string): UserProfile | undefined {
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = clean.replace(/\D/g, '');

    return this.profiles.find(p => {
      const email = p.email?.toLowerCase();
      const usn = p.usn?.toLowerCase();
      const uid = p.id?.toLowerCase();
      const staffCode = p.staffCode?.toLowerCase();
      const phone = p.phone?.toLowerCase();
      const phoneDigits = p.phone ? p.phone.replace(/\D/g, '') : '';

      return (
        email === clean ||
        usn === clean ||
        uid === clean ||
        staffCode === clean ||
        phone === clean ||
        (cleanDigits.length >= 7 && phoneDigits === cleanDigits)
      );
    });
  }

  public verifyPassword(userId: string, inputPassword: string): boolean {
    const user = this.profiles.find(p => p.id === userId);
    if (!user) return false;

    // Once a custom password has been created, ONLY the new password is valid!
    if (user.password && !user.isFirstLogin) {
      return user.password === inputPassword;
    }

    if (user.password && user.password === inputPassword) {
      return true;
    }

    // Default initial password during first-time login:
    const cleanPass = inputPassword.trim();
    const cleanDigits = cleanPass.replace(/\D/g, '');

    if (user.role === 'admin') {
      return cleanPass === '03May@2002@' || cleanPass === (user.password || '');
    } else if (user.role === 'student') {
      const matchUsn = user.usn && cleanPass.toLowerCase() === user.usn.toLowerCase();
      const matchPhone = user.phone && (cleanPass === user.phone || (cleanDigits.length >= 7 && user.phone.replace(/\D/g, '') === cleanDigits));
      if (cleanDigits.length === 10 && user.isFirstLogin && !user.password) {
        if (!user.phone) user.phone = cleanDigits;
        return true;
      }
      return !!(matchUsn || matchPhone);
    } else if (user.role === 'faculty') {
      const matchPhone = user.phone && (cleanPass === user.phone || (cleanDigits.length >= 7 && user.phone.replace(/\D/g, '') === cleanDigits));
      const matchStaff = user.staffCode && cleanPass.toLowerCase() === user.staffCode.toLowerCase();
      return !!(matchPhone || matchStaff);
    }
    return false;
  }

  public async updatePassword(userId: string, newPassword?: string): Promise<boolean> {
    const user = this.profiles.find(p =>
      p.id === userId ||
      p.email.toLowerCase() === userId.toLowerCase() ||
      (p.usn && p.usn.toLowerCase() === userId.toLowerCase())
    );
    if (user) {
      user.isFirstLogin = false;
      if (newPassword) {
        user.password = newPassword;
      }
      user.passwordUpdatedAt = new Date().toISOString();
      this.addAuditLog(user.id, user.name, user.role, 'Password Updated', 'UserProfile', user.id, { note: 'First-time credentials changed' });

      // Save locally to store
      this.save(true);

      // Save to permanent backup key in localStorage
      if (typeof window !== 'undefined') {
        try {
          const credsBackup = JSON.parse(localStorage.getItem('pbl_user_credentials_backup') || '{}');
          const backupRecord = { password: user.password, isFirstLogin: false, passwordUpdatedAt: user.passwordUpdatedAt };
          credsBackup[user.id] = backupRecord;
          if (user.usn) credsBackup[user.usn] = backupRecord;
          if (user.email) credsBackup[user.email] = backupRecord;
          if (user.phone) credsBackup[user.phone] = backupRecord;
          localStorage.setItem('pbl_user_credentials_backup', JSON.stringify(credsBackup));
        } catch (e) {
          console.error('Failed to write credentials backup:', e);
        }
      }

      // Sync across all cloud APIs
      await this.syncToSupabase();
      return true;
    }
    return false;
  }

  public getAllProfiles(): UserProfile[] { return this.profiles; }

  public getStudents(): UserProfile[] { return this.profiles.filter(p => p.role === 'student'); }

  public getFaculty(): UserProfile[] { return this.profiles.filter(p => p.role === 'faculty'); }

  public createProfile(profile: Omit<UserProfile, 'id' | 'createdAt'>): UserProfile {
    const newProf: UserProfile = {
      ...profile,
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    };
    this.profiles.push(newProf);
    this.save();
    return newProf;
  }

  public updateProfile(id: string, updates: Partial<UserProfile>): UserProfile | null {
    const idx = this.profiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.profiles[idx] = { ...this.profiles[idx], ...updates };
      this.save();
      return this.profiles[idx];
    }
    return null;
  }

  public deleteProfile(id: string): boolean {
    const idx = this.profiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.profiles.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // --- Teams ---
  public getAllTeams(): Team[] { return this.teams; }

  public getTeamByStudentId(studentId: string, semester: 4 | 5 = 5): Team | undefined {
    // Strictly prioritize 5th semester project by default, preventing accidental 4th sem mapping
    const semTeam = this.teams.find(t => (t.semester || 5) === semester && t.members?.some(m => m.id === studentId));
    if (semTeam) return semTeam;
    return this.teams.find(t => t.members?.some(m => m.id === studentId));
  }

  public getTeamsByGuideId(guideId: string, semester?: 4 | 5): Team[] {
    return this.teams.filter(t => t.guideId === guideId && (!semester || (t.semester || 5) === semester));
  }

  public createTeam(teamData: Omit<Team, 'id' | 'createdAt'>): Team {
    const newTeam: Team = {
      ...teamData,
      id: `team-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.teams.push(newTeam);
    this.save();
    return newTeam;
  }

  public updateTeam(id: string, updates: Partial<Team>): Team | null {
    const idx = this.teams.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.teams[idx] = { ...this.teams[idx], ...updates };
      this.save();
      return this.teams[idx];
    }
    return null;
  }

  public updateTeamProjectDetails(teamId: string, title: string, description: string): { success: boolean; error?: string } {
    const deadline = this.deadlines.find(d => d.id === 'dl-003');
    if (deadline && new Date() > new Date(deadline.dueDate)) {
      return { success: false, error: `Updates rejected: The deadline passed on ${new Date(deadline.dueDate).toLocaleString()}. Editing locked.` };
    }

    const teamToUpdate = this.teams.find(t => t.id === teamId);
    if (!teamToUpdate) return { success: false, error: 'Team not found' };

    const DEFAULT_TITLE = 'To Be Decided (TBD)';
    if (teamToUpdate.projectTitle !== DEFAULT_TITLE && teamToUpdate.projectTitle.trim() !== '') {
      return { success: false, error: 'Updates rejected: Project details have already been filled by a team member and are now locked.' };
    }

    const team = this.updateTeam(teamId, { projectTitle: title, projectDescription: description });
    if (!team) return { success: false, error: 'Team not found' };

    return { success: true };
  }

  public async updateResearchPaperStatus(
    teamId: string,
    status: ResearchPaperStatus,
    proofName?: string,
    proofPath?: string
  ): Promise<{ success: boolean; error?: string }> {
    const team = this.teams.find(t => t.id === teamId);
    if (!team) return { success: false, error: 'Team not found' };

    team.researchPaperStatus = status;
    if (proofName !== undefined) team.researchPaperProofName = proofName;
    if (proofPath !== undefined) team.researchPaperProofPath = proofPath;
    team.researchPaperUpdatedAt = new Date().toISOString();

    this.save(true);
    await this.syncToSupabase();
    return { success: true };
  }

  // --- Deadlines ---
  public getAllDeadlines(): Deadline[] { return this.deadlines; }

  public getDeadlineById(id: string): Deadline | undefined {
    return this.deadlines.find(d => d.id === id);
  }

  public getDeadlinesForStudent(section?: SectionCode): Deadline[] {
    const valid = this.deadlines.filter(d =>
      d.id !== 'dl-project-stmt' &&
      d.id !== 'dl-guide-meeting' &&
      !d.title.toLowerCase().includes('problem statement') &&
      !d.title.toLowerCase().includes('guide meeting')
    );
    if (!section) return valid;
    return valid.filter(d =>
      !d.applicableSections || d.applicableSections.length === 0 || d.applicableSections.includes(section)
    );
  }

  public createDeadline(deadlineData: Omit<Deadline, 'id' | 'createdAt'>): Deadline {
    const newDeadline: Deadline = {
      ...deadlineData,
      id: `dl-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.deadlines.push(newDeadline);
    this.save();
    return newDeadline;
  }

  public updateDeadline(id: string, updates: Partial<Deadline>): Deadline | null {
    const idx = this.deadlines.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.deadlines[idx] = { ...this.deadlines[idx], ...updates };
      this.save();
      return this.deadlines[idx];
    }
    return null;
  }

  public deleteDeadline(id: string): boolean {
    const idx = this.deadlines.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.deadlines.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // --- Submissions ---
  public getAllSubmissions(): Submission[] { return this.submissions; }

  public getSubmissionsForTeam(teamId: string): Submission[] {
    return this.submissions.filter(s => s.teamId === teamId);
  }

  public submitDocument(
    deadlineId: string,
    teamId: string,
    submittedBy: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    fileData?: string,
    remarks?: string
  ): { success: boolean; submission?: Submission; error?: string } {
    const deadline = this.deadlines.find(d => d.id === deadlineId);
    if (!deadline) {
      return { success: false, error: 'Deadline not found.' };
    }

    const now = new Date();
    const dueDate = new Date(deadline.dueDate);

    // Maximum file limit: 25MB
    if (fileSize > 25 * 1024 * 1024) {
      return { success: false, error: 'Upload rejected: File size exceeds the maximum limit of 25MB.' };
    }

    const team = this.teams.find(t => t.id === teamId);
    const student = this.profiles.find(p => p.id === submittedBy);
    const existingIdx = this.submissions.findIndex(s => s.deadlineId === deadlineId && s.teamId === teamId);

    const isLate = now > dueDate;
    const newSub: Submission = {
      id: existingIdx !== -1 ? this.submissions[existingIdx].id : `sub-${Date.now()}`,
      deadlineId,
      deadlineTitle: deadline.title,
      teamId,
      teamNumber: team?.teamNumber,
      section: team?.section,
      projectTitle: team?.projectTitle,
      submittedBy,
      studentName: student?.name,
      studentUsn: student?.usn,
      fileName,
      filePath: fileData || `/storage/submissions/${fileName}`,
      fileData: fileData || undefined,
      fileType,
      fileSize,
      submissionTime: now.toISOString(),
      version: existingIdx !== -1 ? (this.submissions[existingIdx].version || 1) + 1 : 1,
      status: isLate ? 'late' : 'submitted',
      isLocked: true,
      remarks: remarks || undefined,
      aiSummary: `AI Summary generated for ${fileName}: Phase 1 Review Report for ${team?.projectTitle || 'project'}. Architecture and methodology submitted for faculty review.`,
      aiFeedback: {
        missingSections: [],
        strengths: ['Clear architectural flow', 'Well structured objectives', 'Clear division of work'],
        potentialIssues: ['Keep verification benchmarks ready for Review 2'],
        suggestedImprovements: ['Prepare live demonstration setup for lab review'],
        facultyQuestions: ['What are the expected response metrics under peak load?']
      }
    };

    if (existingIdx !== -1) {
      this.submissions[existingIdx] = newSub;
    } else {
      this.submissions.push(newSub);
    }

    // Safely persist full document data into IndexedDB so it survives refreshes & downloads
    if (fileData && typeof window !== 'undefined') {
      try {
        saveFileToIdb(newSub.id, fileData).catch(err => {
          console.warn('[Store] Could not cache file to IndexedDB:', err);
        });
      } catch (err) { }
    }

    this.addAuditLog(
      submittedBy,
      student?.name || 'Student',
      'student',
      'Submitted & Locked Document',
      'Submission',
      newSub.id,
      { fileName, teamNumber: team?.teamNumber, deadlineTitle: deadline.title }
    );
    this.save();
    return { success: true, submission: newSub };
  }

  public updateSubmission(id: string, updates: Partial<Submission>): Submission | null {
    const idx = this.submissions.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.submissions[idx] = { ...this.submissions[idx], ...updates };
      this.save();
      return this.submissions[idx];
    }
    return null;
  }

  public deleteSubmission(id: string): boolean {
    const idx = this.submissions.findIndex(s => s.id === id);
    if (idx !== -1) {
      const removed = this.submissions.splice(idx, 1)[0];
      this.addAuditLog('admin', 'Admin', 'admin', 'Deleted Submission', 'Submission', id, {
        teamNumber: removed.teamNumber,
        fileName: removed.fileName
      });
      this.save();
      return true;
    }
    return false;
  }

  public unlockSubmission(submissionId: string): boolean {
    const sub = this.submissions.find(s => s.id === submissionId);
    if (sub) {
      sub.isLocked = false;
      sub.status = 'reopened_submission';
      this.save();
      return true;
    }
    return false;
  }

  // --- Evaluations & Marks ---
  public getAllEvaluations(): Evaluation[] { return this.evaluations; }

  public getPublishedEvaluationsForTeam(teamId: string): Evaluation[] {
    return this.evaluations.filter(e => e.teamId === teamId && e.isPublished);
  }

  public getPublishedEvaluationsForStudent(studentIdOrUsn: string, teamId?: string, studentUsn?: string): Evaluation[] {
    const cleanId = (studentIdOrUsn || '').trim().toLowerCase();
    const cleanUsn = (studentUsn || '').trim().toLowerCase();

    return this.evaluations.filter(e => {
      if (!e.isPublished) return false;
      const evalStudentId = (e.studentId || '').trim().toLowerCase();
      const evalStudentUsn = (e.studentUsn || '').trim().toLowerCase();

      // STRICT PRIVACY: Match only the specific student's own ID or USN.
      // NEVER match by teamId so a student never sees any teammate's marks.
      const isMatch = (
        (evalStudentId && (evalStudentId === cleanId || (cleanUsn && evalStudentId === cleanUsn))) ||
        (evalStudentUsn && (evalStudentUsn === cleanId || (cleanUsn && evalStudentUsn === cleanUsn)))
      );
      return isMatch;
    });
  }

  public saveEvaluation(evalData: Omit<Evaluation, 'id' | 'evaluatedAt'>): Evaluation {
    const existingIdx = this.evaluations.findIndex(e =>
      e.deadlineId === evalData.deadlineId &&
      e.teamId === evalData.teamId &&
      ((evalData.evaluationType === 'team') || (e.studentId === evalData.studentId))
    );

    const updatedObj: Evaluation = {
      ...evalData,
      id: existingIdx !== -1 ? this.evaluations[existingIdx].id : `eval-${Date.now()}`,
      evaluatedAt: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      this.evaluations[existingIdx] = updatedObj;
    } else {
      this.evaluations.push(updatedObj);
    }

    this.addAuditLog(evalData.evaluatorId, evalData.evaluatorName || 'Faculty', 'faculty', 'Saved Evaluation', 'Evaluation', updatedObj.id, { teamId: evalData.teamId, totalMarks: evalData.totalMarks });
    this.save();
    return updatedObj;
  }

  // --- Guide Meetings ---
  public getAllMeetings(): GuideMeeting[] { return this.guideMeetings; }

  public getMeetingsForTeam(teamId: string): GuideMeeting[] {
    return this.guideMeetings.filter(m => m.teamId === teamId);
  }

  public getMeetingsForFaculty(facultyId: string): GuideMeeting[] {
    return this.guideMeetings.filter(m => m.facultyId === facultyId);
  }

  public createMeeting(meetingData: Omit<GuideMeeting, 'id' | 'createdAt'>): GuideMeeting {
    const newMeeting: GuideMeeting = {
      ...meetingData,
      id: `m-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.guideMeetings.push(newMeeting);
    this.save();
    return newMeeting;
  }

  // --- Notifications ---
  public getNotificationsForUser(userId: string): NotificationItem[] {
    return this.notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public markNotificationRead(id: string) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.save();
    }
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLogItem[] {
    return this.auditLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addAuditLog(userId: string, userName: string, userRole: string, action: string, entityType: string, entityId?: string, details?: Record<string, any>) {
    const log: AuditLogItem = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      userName,
      userRole,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    this.save();
  }
}

export const store = new PBLStore();
