import {
  UserProfile, Team, Deadline, Submission, Evaluation, GuideMeeting, NotificationItem, AuditLogItem, SectionCode
} from '../types/pbl';
import { RAW_PDF_SEED, getGuideEmail, getGuidePhone } from './seed-dataset';

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
      const storedData = localStorage.getItem('pbl_portal_store_v4');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          this.profiles = parsed.profiles || [];

          // Force update admin email if they have an old localStorage state
          const admin = this.profiles.find((p: UserProfile) => p.role === 'admin' && p.id === '180881');
          if (admin) {
            admin.email = 'parvathisha-cse@dsatm.edu.in';
          }

          this.teams = parsed.teams || [];
          this.deadlines = parsed.deadlines || [];
          this.submissions = parsed.submissions || [];
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

    // Build initial seed dataset from PDF structure
    const facultyMap = new Map<string, UserProfile>();
    const adminUser: UserProfile = {
      id: '180881',
      email: 'parvathisha-cse@dsatm.edu.in',
      name: 'Parvathisha P',
      role: 'admin',
      isFirstLogin: false,
      createdAt: new Date().toISOString()
    };
    this.profiles.push(adminUser);

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

      // Create Team
      const teamId = `team-${seedTeam.section}-${seedTeam.teamNumber}`;
      const teamMembersList: UserProfile[] = [];

      seedTeam.students.forEach((s, sIdx) => {
        const cleanUsn = s.usn.toUpperCase().trim();
        const studProfile: UserProfile = {
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
        teamMembersList.push(studProfile);
      });

      const teamObj: Team = {
        id: teamId,
        teamNumber: seedTeam.teamNumber,
        section: seedTeam.section,
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

    // Seed Standard Deadlines
    const now = new Date();
    const futureDate1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const pastDate1 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const d1: Deadline = {
      id: 'dl-001',
      title: 'Synopsis & Problem Statement Submission',
      description: 'Upload PDF/DOCX containing Problem Statement, Literature Survey & Initial Architecture.',
      deadlineType: 'submission',
      dueDate: futureDate1,
      applicableSections: ['A', 'B', 'C', 'D', 'E', 'F'],
      submissionRequired: true,
      status: 'open',
      createdBy: adminUser.id,
      createdAt: new Date().toISOString()
    };

    const d2: Deadline = {
      id: 'dl-002',
      title: 'Review 1 Evaluation',
      description: 'First formal presentation review before assigned faculty guide.',
      deadlineType: 'review',
      dueDate: pastDate1,
      applicableSections: ['A', 'B', 'C', 'D', 'E', 'F'],
      submissionRequired: true,
      status: 'evaluated',
      createdBy: adminUser.id,
      createdAt: new Date().toISOString()
    };

    const d3: Deadline = {
      id: 'dl-003',
      title: 'Project Title, Description & 1st Guide Meeting Document',
      description: 'Finalize your project title and description on your team page, and upload your 1st guide meeting document.',
      deadlineType: 'submission',
      dueDate: '2026-09-22T17:00:00', // Sep 22, 2026 5:00 PM
      applicableSections: ['A', 'B', 'C', 'D', 'E', 'F'],
      submissionRequired: true,
      status: 'open',
      createdBy: adminUser.id,
      createdAt: new Date().toISOString()
    };

    this.deadlines.push(d1, d2, d3);

    // Seed Sample Submissions for Team A1
    const teamA1 = this.teams.find(t => t.teamNumber === 'A1');
    if (teamA1 && teamA1.members && teamA1.members.length > 0) {
      const student1 = teamA1.members[0];
      const sub1: Submission = {
        id: 'sub-001',
        deadlineId: d2.id,
        deadlineTitle: d2.title,
        teamId: teamA1.id,
        teamNumber: teamA1.teamNumber,
        projectTitle: teamA1.projectTitle,
        submittedBy: student1.id,
        studentName: student1.name,
        fileName: 'Group_A1_Synopsis_V1.pdf',
        filePath: '/storage/submissions/Group_A1_Synopsis_V1.pdf',
        fileType: 'application/pdf',
        fileSize: 2450000,
        submissionTime: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        version: 1,
        status: 'submitted',
        aiSummary: 'The document outlines the proposed project methodology, problem formulation, and hardware/software design architecture.',
        aiFeedback: {
          missingSections: ['Risk Analysis & Mitigation Plan'],
          strengths: ['Clear hardware block diagram', 'Well formulated objectives', 'Extensive literature survey of 8 IEEE papers'],
          potentialIssues: ['Accuracy might degrade under low lighting conditions in campus bins'],
          suggestedImprovements: ['Add ambient LED lighting to bin entrance', 'Detail budget estimation for ultrasonic sensors'],
          facultyQuestions: ['How does the model differentiate wet paper from organic food waste?']
        }
      };
      this.submissions.push(sub1);

      // Seed Evaluation for Team A1
      const eval1: Evaluation = {
        id: 'eval-001',
        deadlineId: d2.id,
        deadlineTitle: d2.title,
        teamId: teamA1.id,
        teamNumber: teamA1.teamNumber,
        evaluatorId: teamA1.guideId,
        evaluatorName: teamA1.guideName,
        evaluationType: 'team',
        criteriaScores: [
          { criterion: 'Problem Statement', maxMarks: 10, marksObtained: 9, comments: 'Well identified campus problem.' },
          { criterion: 'Literature Survey', maxMarks: 10, marksObtained: 8.5, comments: 'Good references cited.' },
          { criterion: 'Methodology & Design', maxMarks: 15, marksObtained: 13, comments: 'Feasible hardware architecture.' },
          { criterion: 'Implementation Progress', maxMarks: 25, marksObtained: 21, comments: 'Prototype frame built.' },
          { criterion: 'Results & Demo', maxMarks: 20, marksObtained: 17, comments: 'Initial classification accuracy 88%.' },
          { criterion: 'Presentation & Q/A', maxMarks: 10, marksObtained: 9, comments: 'Confident presentation.' },
          { criterion: 'Documentation', maxMarks: 10, marksObtained: 8, comments: 'Minor formatting fixes needed.' }
        ],
        totalMarks: 85.5,
        maxTotalMarks: 100,
        facultyComments: 'Strong initial prototype demonstration. Focus on sensor response latency before Review 2.',
        isPublished: true,
        evaluatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
      };
      this.evaluations.push(eval1);

      // Seed Guide Meeting for Team A1
      const meeting1: GuideMeeting = {
        id: 'm-001',
        title: 'Review 1 Progress & Circuit Diagram Check',
        facultyId: teamA1.guideId,
        facultyName: teamA1.guideName,
        teamId: teamA1.id,
        teamNumber: teamA1.teamNumber,
        projectTitle: teamA1.projectTitle,
        meetingDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'CSE Lab 4 / Room 204',
        agenda: 'Demonstrate live webcam waste detection and review Arduino pin layout.',
        status: 'scheduled',
        facultyNotes: 'Bring breadboard setup and power bank.',
        createdAt: new Date().toISOString()
      };
      this.guideMeetings.push(meeting1);
    }

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

    this.save();
    this.initialized = true;
  }

  private save() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pbl_portal_store_v4', JSON.stringify({
          profiles: this.profiles,
          teams: this.teams,
          deadlines: this.deadlines,
          submissions: this.submissions,
          evaluations: this.evaluations,
          guideMeetings: this.guideMeetings,
          notifications: this.notifications,
          auditLogs: this.auditLogs
        }));
      } catch (e) {
        console.error("Save store error:", e);
      }
    }
  }

  // --- Auth & Users ---
  public findUserByUsernameOrEmail(identifier: string): UserProfile | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.profiles.find(p =>
      p.email.toLowerCase() === clean ||
      (p.usn && p.usn.toLowerCase() === clean)
    );
  }

  public verifyPassword(userId: string, inputPassword: string): boolean {
    const user = this.profiles.find(p => p.id === userId);
    if (!user) return false;

    if (user.password) {
      return user.password === inputPassword;
    }

    if (user.role === 'admin') {
      return inputPassword === '03May@2002@';
    } else if (user.role === 'student') {
      return inputPassword === user.usn;
    } else if (user.role === 'faculty') {
      return inputPassword === user.phone;
    }
    return false;
  }

  public updatePassword(userId: string, newPassword?: string): boolean {
    const user = this.profiles.find(p => p.id === userId);
    if (user) {
      user.isFirstLogin = false;
      if (newPassword) {
        user.password = newPassword;
      }
      this.addAuditLog(userId, user.name, user.role, 'Password Updated', 'UserProfile', userId, { note: 'First-time credentials changed' });
      this.save();
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

  public getTeamByStudentId(studentId: string): Team | undefined {
    return this.teams.find(t => t.members?.some(m => m.id === studentId));
  }

  public getTeamsByGuideId(guideId: string): Team[] {
    return this.teams.filter(t => t.guideId === guideId);
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

  // --- Deadlines ---
  public getAllDeadlines(): Deadline[] { return this.deadlines; }

  public getDeadlinesForStudent(section?: SectionCode): Deadline[] {
    if (!section) return this.deadlines;
    return this.deadlines.filter(d =>
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
    fileSize: number
  ): { success: boolean; submission?: Submission; error?: string } {
    const deadline = this.deadlines.find(d => d.id === deadlineId);
    if (!deadline) {
      return { success: false, error: 'Deadline not found.' };
    }

    const now = new Date();
    const dueDate = new Date(deadline.dueDate);

    // Server-side Deadline Enforcement
    if (now > dueDate) {
      return {
        success: false,
        error: `Submission rejected: The deadline passed on ${dueDate.toLocaleString()}. Upload locked.`
      };
    }

    if (fileSize > 10 * 1024 * 1024) {
      return { success: false, error: 'Upload rejected: File size exceeds the maximum limit of 10MB.' };
    }

    const team = this.teams.find(t => t.id === teamId);
    const student = this.profiles.find(p => p.id === submittedBy);
    const existingCount = this.submissions.filter(s => s.deadlineId === deadlineId && s.teamId === teamId).length;

    if (existingCount > 0) {
      return { success: false, error: 'Upload rejected: A team member has already submitted a document for this deadline.' };
    }

    const newSub: Submission = {
      id: `sub-${Date.now()}`,
      deadlineId,
      deadlineTitle: deadline.title,
      teamId,
      teamNumber: team?.teamNumber,
      projectTitle: team?.projectTitle,
      submittedBy,
      studentName: student?.name,
      fileName,
      filePath: `/storage/submissions/${fileName}`,
      fileType,
      fileSize,
      submissionTime: now.toISOString(),
      version: existingCount + 1,
      status: 'submitted',
      aiSummary: `AI Summary generated for ${fileName}: Document outlines problem scope, implementation methodology, and experimental results for ${team?.projectTitle || 'project'}.`,
      aiFeedback: {
        missingSections: ['Hardware Bill of Materials'],
        strengths: ['Clear architectural flow', 'Well structured objectives'],
        potentialIssues: ['Need to detail test validation metrics'],
        suggestedImprovements: ['Include performance benchmark graph'],
        facultyQuestions: ['What is the expected latency under peak load?']
      }
    };

    this.submissions.push(newSub);
    this.addAuditLog(submittedBy, student?.name || 'Student', 'student', 'Submitted Document', 'Submission', newSub.id, { fileName });
    this.save();
    return { success: true, submission: newSub };
  }

  // --- Evaluations & Marks ---
  public getAllEvaluations(): Evaluation[] { return this.evaluations; }

  public getPublishedEvaluationsForTeam(teamId: string): Evaluation[] {
    return this.evaluations.filter(e => e.teamId === teamId && e.isPublished);
  }

  public getPublishedEvaluationsForStudent(studentId: string, teamId: string): Evaluation[] {
    return this.evaluations.filter(e =>
      e.isPublished && (
        (e.evaluationType === 'individual' && e.studentId === studentId) ||
        (e.evaluationType === 'team' && e.teamId === teamId)
      )
    );
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
