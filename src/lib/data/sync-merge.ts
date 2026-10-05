import { UserProfile, Team, Submission, Evaluation, GuideMeeting } from '../types/pbl';

export interface LocalState {
  profiles: UserProfile[];
  teams: Team[];
  evaluations: Evaluation[];
  submissions: Submission[];
  guideMeetings: GuideMeeting[];
}

export interface CloudTables {
  profiles?: any[] | null;
  teams?: any[] | null;
  evaluations?: any[] | null;
  submissions?: any[] | null;
  guideMeetings?: any[] | null;
}

const DEFAULT_TITLE = 'To Be Decided (TBD)';

function isMeaningful(value?: string | null): boolean {
  return !!value && value.trim() !== '';
}

function isMeaningfulTitle(title?: string | null): boolean {
  return isMeaningful(title) && title!.trim() !== DEFAULT_TITLE;
}

/**
 * Fold cloud rows into the local state.
 *
 * Rules that keep the portal consistent:
 * - Teams are matched by (section, team number), not by id, so a team keeps the
 *   local id that its submissions/evaluations already reference even when the
 *   database generated a different id.
 * - A locally stored, meaningful project title/description is never overwritten
 *   by a stale/default cloud value, so a student's fresh submission is not
 *   discarded when the faculty page re-syncs.
 * - Submissions, evaluations and guide meetings are merged by id (union) rather
 *   than replaced, so records that have not reached the cloud yet survive.
 * - Team members are always preserved from the local state.
 */
export function applyCloudSnapshot(local: LocalState, cloud: CloudTables): LocalState {
  const profiles = [...local.profiles];
  const teams = [...local.teams];
  const submissions = [...local.submissions];
  const evaluations = [...local.evaluations];
  const guideMeetings = [...local.guideMeetings];

  // --- Profiles: union by id, but fall back to email/USN so an existing
  // account keeps its id (and therefore its live session). ---
  (cloud.profiles ?? []).forEach((p: any) => {
    let target = profiles.find(x => x.id === p.id);
    if (!target && p.email) {
      target = profiles.find(x => x.email?.toLowerCase() === String(p.email).toLowerCase());
    }
    if (!target && p.usn) {
      target = profiles.find(x => x.usn?.toUpperCase() === String(p.usn).toUpperCase());
    }

    const incoming: UserProfile = {
      id: target ? target.id : p.id,
      email: p.email ?? target?.email ?? '',
      name: p.name ?? target?.name ?? '',
      usn: p.usn || target?.usn,
      role: (p.role ?? target?.role ?? 'student') as UserProfile['role'],
      section: p.section || target?.section,
      phone: p.phone || target?.phone,
      staffCode: target?.staffCode,
      password: p.password || target?.password,
      isFirstLogin: p.is_first_login !== undefined ? p.is_first_login : (target?.isFirstLogin ?? true),
      createdAt: p.created_at || target?.createdAt || new Date().toISOString(),
    };

    if (target) {
      Object.assign(target, incoming);
    } else {
      profiles.push(incoming);
    }
  });

  // --- Teams: match on (section, team_number). ---
  const cloudTeamIdToLocalId = new Map<string, string>();

  (cloud.teams ?? []).forEach((t: any) => {
    const teamNumber = t.team_number ?? t.teamNumber;
    const section = t.section;
    if (!teamNumber || !section) return;

    const guideId = t.guide_id ?? t.guideId ?? '';
    const guideProfile = profiles.find(p => p.id === guideId);
    let team = teams.find(x => x.teamNumber === teamNumber && x.section === section);

    if (team) {
      // Keep the local id so existing submissions/evaluations still resolve.
      cloudTeamIdToLocalId.set(t.id, team.id);
      // Local meaningful values win; cloud fills in only what is still default/empty.
      if (!isMeaningfulTitle(team.projectTitle) && isMeaningfulTitle(t.project_title)) {
        team.projectTitle = t.project_title;
      }
      if (!isMeaningful(team.projectDescription) && isMeaningful(t.project_description)) {
        team.projectDescription = t.project_description;
      }
      if (guideId) team.guideId = guideId;
      team.guideName = t.guide_name || guideProfile?.name || team.guideName;
      team.guideEmail = t.guide_email || guideProfile?.email || team.guideEmail;
    } else {
      const newId = t.id || `team-${section}-${teamNumber}`;
      cloudTeamIdToLocalId.set(t.id, newId);
      teams.push({
        id: newId,
        teamNumber,
        section,
        projectTitle: t.project_title || DEFAULT_TITLE,
        projectDescription: t.project_description || '',
        guideId,
        guideName: t.guide_name || guideProfile?.name,
        guideEmail: t.guide_email || guideProfile?.email,
        members: [],
        createdAt: t.created_at || new Date().toISOString(),
      });
    }
  });

  // --- Submissions: union by id, remapping the team reference. ---
  const submissionIds = new Set(submissions.map(s => s.id));
  (cloud.submissions ?? []).forEach((s: any) => {
    if (!s?.id || submissionIds.has(s.id)) return;
    submissionIds.add(s.id);
    submissions.push({
      id: s.id,
      deadlineId: s.deadline_id,
      deadlineTitle: s.deadline_title,
      teamId: cloudTeamIdToLocalId.get(s.team_id) || s.team_id,
      teamNumber: s.team_number,
      projectTitle: s.project_title,
      submittedBy: s.submitted_by,
      studentName: s.student_name,
      fileName: s.file_name,
      filePath: s.file_path,
      fileType: s.file_type,
      fileSize: s.file_size,
      submissionTime: s.submission_time,
      version: s.version ?? 1,
      status: s.status || 'submitted',
      aiSummary: s.ai_summary,
      aiFeedback: s.ai_feedback,
    } as Submission);
  });

  // --- Evaluations: union by id, remapping the team reference. ---
  const evaluationIds = new Set(evaluations.map(e => e.id));
  (cloud.evaluations ?? []).forEach((e: any) => {
    if (!e?.id || evaluationIds.has(e.id)) return;
    evaluationIds.add(e.id);
    evaluations.push({
      id: e.id,
      deadlineId: e.deadline_id,
      deadlineTitle: e.deadline_title,
      teamId: cloudTeamIdToLocalId.get(e.team_id) || e.team_id,
      teamNumber: e.team_number,
      evaluatorId: e.evaluator_id,
      evaluatorName: e.evaluator_name,
      evaluationType: e.evaluation_type,
      studentId: e.student_id || undefined,
      studentName: e.student_name || undefined,
      studentUsn: e.student_usn || undefined,
      criteriaScores: e.criteria_scores,
      totalMarks: e.total_marks,
      maxTotalMarks: e.max_total_marks,
      facultyComments: e.faculty_comments || '',
      isPublished: e.is_published,
      evaluatedAt: e.evaluated_at,
    } as Evaluation);
  });

  // --- Guide meetings: union by id, remapping the team reference. ---
  const meetingIds = new Set(guideMeetings.map(m => m.id));
  (cloud.guideMeetings ?? []).forEach((m: any) => {
    if (!m?.id || meetingIds.has(m.id)) return;
    meetingIds.add(m.id);
    guideMeetings.push({
      id: m.id,
      title: m.title,
      facultyId: m.faculty_id,
      facultyName: m.faculty_name,
      teamId: cloudTeamIdToLocalId.get(m.team_id) || m.team_id,
      teamNumber: m.team_number,
      projectTitle: m.project_title,
      meetingDate: m.meeting_date,
      location: m.location,
      agenda: m.agenda,
      status: m.status,
      facultyNotes: m.faculty_notes,
      createdAt: m.created_at,
    } as GuideMeeting);
  });

  return { profiles, teams, submissions, evaluations, guideMeetings };
}
