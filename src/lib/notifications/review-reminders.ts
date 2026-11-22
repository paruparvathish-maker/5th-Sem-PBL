import { store } from '@/lib/data/store';
import { fetchCloudCredentials, fetchCloudSubmissions } from '@/lib/data/cloud-sync';
import { sendPblNotificationEmail } from '@/lib/utils/mailer';
import { Deadline, Submission, Team, UserProfile } from '@/lib/types/pbl';

const REVIEW_1_PATTERN = /1st\s*review|first\s*review|review\s*[-#]?\s*1\b/i;
const REVIEW_2_PATTERN = /2nd\s*review|second\s*review|review\s*[-#]?\s*2\b/i;

export interface ReviewInfo {
  deadline: Deadline;
  reviewNumber: 1 | 2;
  maxMarks: number;
}

const DEFAULT_REVIEW_1: Deadline = {
  id: 'dl-review-1',
  title: '1st Review Report',
  description: 'Submission of the first review report of the PBL project.',
  deadlineType: 'submission',
  dueDate: '2026-11-30T17:00:00.000Z',
  applicableSections: ['A', 'B', 'C', 'D', 'E', 'F'],
  submissionRequired: true,
  status: 'open',
  createdBy: 'system',
  createdAt: '2026-11-01T00:00:00.000Z',
};

/** Finds the requested deadline, falling back to the 1st Review milestone. */
export function resolveReviewDeadline(deadlineId?: string, titleHint?: string): ReviewInfo {
  const all = store.getAllDeadlines();
  const candidates = [
    deadlineId ? all.find((d) => d.id === deadlineId) : undefined,
    titleHint ? all.find((d) => d.title.toLowerCase().includes(titleHint.toLowerCase())) : undefined,
    all.find((d) => REVIEW_1_PATTERN.test(d.title)),
    all.find((d) => REVIEW_2_PATTERN.test(d.title)),
  ];
  const deadline = candidates.find(Boolean) || DEFAULT_REVIEW_1;
  const reviewNumber: 1 | 2 = REVIEW_2_PATTERN.test(deadline.title) || deadline.id === 'dl-review-2' ? 2 : 1;
  return { deadline, reviewNumber, maxMarks: reviewNumber === 2 ? 10 : 5 };
}

/**
 * Registered accounts only. Seeded profiles carry a synthesized college email,
 * so they are excluded until the student actually signs up (which writes a
 * passwordUpdatedAt through the registration flow).
 */
async function loadRegisteredAccounts(): Promise<Map<string, { email: string; name: string }>> {
  const registered = new Map<string, { email: string; name: string }>();
  const put = (key: string | undefined, email: string | undefined, name?: string) => {
    if (!key || !email || !email.includes('@')) return;
    registered.set(key.toUpperCase(), { email: email.toLowerCase(), name: name || key });
  };

  try {
    const creds = await fetchCloudCredentials();
    Object.values(creds || {}).forEach((record: any) => {
      if (!record || !record.email) return;
      const signedUp = Boolean(record.password) || Boolean(record.passwordUpdatedAt) || record.isActivated === true;
      if (!signedUp) return;
      put(record.usn, record.email, record.name);
      put(record.email, record.email, record.name);
    });
  } catch {
    // Fall through to store profiles below.
  }

  store.getAllProfiles().forEach((p: UserProfile) => {
    if (p.role !== 'student' || !p.email) return;
    if (!p.passwordUpdatedAt && p.isActivated !== true && p.isFirstLogin !== false) return;
    put(p.usn, p.email, p.name);
  });

  return registered;
}

function isRegisteredStudent(
  registered: Map<string, { email: string; name: string }>,
  member: { id?: string; usn?: string; email?: string; name?: string }
) {
  const byUsn = member.usn ? registered.get(member.usn.toUpperCase()) : undefined;
  const byEmail = member.email ? registered.get(member.email.toUpperCase()) : undefined;
  return byUsn || byEmail;
}

function teamHasSubmission(team: Team, submissions: Submission[]): boolean {
  const stripPrefix = (value: string) => (value || '').toUpperCase().replace(/^[A-Z]/, '');
  return submissions.some((s) => {
    if (!s) return false;
    if (s.teamId === team.id) return true;
    // A submission naming another team is that team's document, never this one.
    if (s.teamId && s.teamId !== team.id) return false;
    return Boolean(
      s.teamNumber &&
        s.section &&
        stripPrefix(s.teamNumber) === stripPrefix(team.teamNumber) &&
        s.section.toUpperCase() === team.section.toUpperCase()
    );
  });
}

export interface ReminderPreview {
  review: ReviewInfo;
  pendingTeams: { teamId: string; teamNumber: string; section: string; guideName?: string; guideEmail?: string; studentEmails: { email: string; name: string }[] }[];
  submittedTeams: { teamId: string; teamNumber: string; section: string; guideName?: string; guideEmail?: string }[];
}

export async function buildReviewPreview(deadlineId?: string, titleHint?: string): Promise<ReminderPreview> {
  const review = resolveReviewDeadline(deadlineId, titleHint);
  const [registered, cloudSubs] = await Promise.all([
    loadRegisteredAccounts(),
    fetchCloudSubmissions().catch(() => [] as any[]),
  ]);
  const allSubs: Submission[] = [...store.getAllSubmissions(), ...(cloudSubs as Submission[])];
  const applicable = (review.deadline.applicableSections || []).map((s) => s.toUpperCase());

  const pendingTeams: ReminderPreview['pendingTeams'] = [];
  const submittedTeams: ReminderPreview['submittedTeams'] = [];

  store
    .getAllTeams()
    .filter((t) => (t.semester || 5) === 5)
    .filter((t) => applicable.length === 0 || applicable.includes((t.section || '').toUpperCase()))
    .forEach((team) => {
      const base = {
        teamId: team.id,
        teamNumber: team.teamNumber,
        section: team.section,
        guideName: team.guideName,
        guideEmail: team.guideEmail,
      };
      if (teamHasSubmission(team, allSubs)) {
        submittedTeams.push(base);
        return;
      }
      const studentEmails = (team.members || [])
        .map((m) => isRegisteredStudent(registered, m))
        .filter(Boolean) as { email: string; name: string }[];
      pendingTeams.push({ ...base, studentEmails });
    });

  return { review, pendingTeams, submittedTeams };
}

function formatDueDate(deadline: Deadline): string {
  const due = new Date(deadline.dueDate);
  if (Number.isNaN(due.getTime())) return 'as per the portal schedule';
  return due.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

/** Runs sends with a small concurrency so a full cohort finishes inside one function call. */
async function runInBatches<T>(tasks: (() => Promise<T>)[], size = 6): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += size) {
    results.push(...(await Promise.all(tasks.slice(i, i + size).map((task) => task()))));
  }
  return results;
}

export interface NotifyResult {
  deadlineId: string;
  deadlineTitle: string;
  reviewNumber: 1 | 2;
  maxMarks: number;
  pendingTeams: number;
  submittedTeams: number;
  studentsNotified: number;
  studentsSkippedNoAccount: number;
  facultyNotified: number;
  failures: number;
  dryRun: boolean;
}

export async function notifyReviewSubmission(
  origin: string,
  options: { deadlineId?: string; titleHint?: string; includeStudents?: boolean; includeFaculty?: boolean; dryRun?: boolean }
): Promise<NotifyResult> {
  const includeStudents = options.includeStudents !== false;
  const includeFaculty = options.includeFaculty !== false;
  const dryRun = options.dryRun === true;
  const preview = await buildReviewPreview(options.deadlineId, options.titleHint);
  const { review, pendingTeams, submittedTeams } = preview;
  const portalUrl = `${origin}/student/submissions`;
  const facultyUrl = `${origin}/faculty/evaluations`;

  let studentsSkippedNoAccount = 0;
  let plannedStudents = 0;
  let plannedFaculty = 0;
  let failures = 0;

  const studentTasks: (() => Promise<{ success: boolean }>)[] = [];
  const notifiedEmails = new Set<string>();

  if (includeStudents) {
    for (const team of pendingTeams) {
      const allMembers = store.getAllTeams().find((t) => t.id === team.teamId)?.members || [];
      studentsSkippedNoAccount += Math.max(0, allMembers.length - team.studentEmails.length);

      for (const student of team.studentEmails) {
        if (notifiedEmails.has(student.email)) continue;
        notifiedEmails.add(student.email);
        plannedStudents++;
        if (dryRun) continue;
        studentTasks.push(() =>
          sendPblNotificationEmail({
            to: student.email,
            greetingName: student.name,
            subject: `Reminder: ${review.deadline.title} submission pending - Group ${team.teamNumber}`,
            heading: `Submission of ${review.deadline.title} is pending for your team`,
            intro: `Our records show that Group ${team.teamNumber} (Section ${team.section}) is yet to upload the ${review.deadline.title} on the DSATM Industrial PBL Portal. As a member of this group, you are requested to coordinate with your teammates and submit the report at the earliest.`,
            details: [
              { label: 'Milestone', value: review.deadline.title },
              { label: 'Group', value: `Section ${team.section} - Group ${team.teamNumber}` },
              { label: 'Submission deadline', value: formatDueDate(review.deadline) },
              { label: 'Marks for this review', value: `${review.maxMarks} marks per student` },
            ],
            paragraphs: [
              'The report must be uploaded as a single PDF through the portal. Only one submission is required per group; any member may upload on behalf of the team.',
              'If your group has already submitted the report, please disregard this message. Should you face any difficulty in uploading, contact your faculty guide before the deadline.',
            ],
            ctaLabel: 'Submit the report',
            ctaUrl: portalUrl,
            closing: 'We appreciate your prompt attention to this academic requirement.',
            footnote: 'This is an automated academic notification from the DSATM Industrial PBL Portal. Please do not reply to this message.',
          })
        );
      }
    }
  }

  const facultyTasks: (() => Promise<{ success: boolean }>)[] = [];
  if (includeFaculty) {
    interface GuideGroup {
      name: string;
      email: string;
      pending: ReminderPreview['pendingTeams'];
      submitted: ReminderPreview['submittedTeams'];
    }
    const guides = new Map<string, GuideGroup>();
    const addGuide = (team: ReminderPreview['pendingTeams'][number] | ReminderPreview['submittedTeams'][number], kind: 'pending' | 'submitted') => {
      const email = (team.guideEmail || '').toLowerCase();
      if (!email.includes('@')) return;
      if (!guides.has(email)) guides.set(email, { name: team.guideName || 'Faculty Guide', email, pending: [], submitted: [] });
      const entry = guides.get(email)!;
      if (kind === 'pending') entry.pending.push(team as ReminderPreview['pendingTeams'][number]);
      else entry.submitted.push(team as ReminderPreview['submittedTeams'][number]);
    };
    pendingTeams.forEach((t) => addGuide(t, 'pending'));
    submittedTeams.forEach((t) => addGuide(t, 'submitted'));

    for (const guide of Array.from(guides.values())) {
      plannedFaculty++;
      if (dryRun) continue;
      const lines = [
        ...guide.pending.map((t) => `Section ${t.section} - Group ${t.teamNumber}: report awaited`),
        ...guide.submitted.map((t) => `Section ${t.section} - Group ${t.teamNumber}: report received, ready for verification`),
      ];
      facultyTasks.push(() =>
        sendPblNotificationEmail({
          to: guide.email,
          greetingName: guide.name,
          subject: `${review.deadline.title}: verification and individual marks for your assigned teams`,
          heading: `Action required: verify ${review.deadline.title} and award individual marks`,
          intro: `You are requested to review the ${review.deadline.title} status of the project groups assigned to you, verify the submitted reports, and record individual marks for every student on the portal.`,
          details: [
            { label: 'Milestone', value: review.deadline.title },
            { label: 'Marks per student', value: `${review.maxMarks} marks (Review 1: 5 marks, Review 2: 10 marks)` },
            { label: 'Your groups', value: String(guide.pending.length + guide.submitted.length) },
          ],
          paragraphs: [
            `Group status:<br>${lines.map((l) => `&bull; ${l}`).join('<br>') || '&bull; No groups assigned'}`,
            'Please open the Evaluations page, select this milestone, verify each report, and enter marks for each student individually. Marks are recorded per student, not per group, and become visible to the student only after you publish the evaluation.',
            'For groups whose report is still awaited, kindly follow up with the team so that verification and evaluation are completed within the review window.',
          ],
          ctaLabel: 'Open Evaluations',
          ctaUrl: facultyUrl,
          closing: 'Your timely evaluation enables students to track their progress accurately.',
          footnote: 'This is an automated academic notification from the DSATM Industrial PBL Portal.',
        })
      );
    }
  }

  let studentsNotified = 0;
  let facultyNotified = 0;
  if (!dryRun) {
    const studentResults = await runInBatches(studentTasks, 6);
    studentResults.forEach((r) => {
      if (r.success) studentsNotified++;
      else failures++;
    });
    const facultyResults = await runInBatches(facultyTasks, 4);
    facultyResults.forEach((r) => {
      if (r.success) facultyNotified++;
      else failures++;
    });
  }

  return {
    deadlineId: review.deadline.id,
    deadlineTitle: review.deadline.title,
    reviewNumber: review.reviewNumber,
    maxMarks: review.maxMarks,
    pendingTeams: pendingTeams.length,
    submittedTeams: submittedTeams.length,
    studentsNotified: dryRun ? plannedStudents : studentsNotified,
    studentsSkippedNoAccount,
    facultyNotified: dryRun ? plannedFaculty : facultyNotified,
    failures,
    dryRun,
  };
}

export interface MeetingNotificationParams {
  teamId: string;
  title: string;
  meetingDate: string;
  location: string;
  agenda?: string;
  facultyName?: string;
}

/** Emails every registered member of a team about a scheduled guide meeting. */
export async function notifyTeamMeeting(
  origin: string,
  params: MeetingNotificationParams
): Promise<{ team: string; recipients: number; sent: number; skipped: number; failures: number }> {
  const team = store.getAllTeams().find((t) => t.id === params.teamId);
  if (!team) return { team: '', recipients: 0, sent: 0, skipped: 0, failures: 0 };

  const registered = await loadRegisteredAccounts();
  const recipients = (team.members || [])
    .map((m) => isRegisteredStudent(registered, m))
    .filter(Boolean) as { email: string; name: string }[];

  const unique = new Map<string, { email: string; name: string }>();
  recipients.forEach((r) => unique.set(r.email.toLowerCase(), r));

  const meetingWhen = new Date(params.meetingDate);
  const when = Number.isNaN(meetingWhen.getTime())
    ? params.meetingDate
    : meetingWhen.toLocaleString('en-IN', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      });

  const tasks = Array.from(unique.values()).map((student) => () =>
    sendPblNotificationEmail({
      to: student.email,
      greetingName: student.name,
      subject: `Guide meeting scheduled - ${params.title} (Group ${team.teamNumber})`,
      heading: 'Guide meeting scheduled for your project group',
      intro: `Your faculty guide has scheduled a project review meeting for Section ${team.section}, Group ${team.teamNumber}. Attendance of all group members is expected.`,
      details: [
        { label: 'Meeting', value: params.title },
        { label: 'Date and time', value: when },
        { label: 'Venue / Link', value: params.location || 'To be communicated' },
        { label: 'Faculty guide', value: params.facultyName || team.guideName || 'Faculty Guide' },
        { label: 'Project', value: team.projectTitle || 'PBL Project' },
      ],
      paragraphs: [
        params.agenda
          ? `<strong>Agenda:</strong> ${params.agenda}`
          : 'Please come prepared with your current progress, documents and pending questions for the discussion.',
        'Kindly carry the latest version of your project report and be present five minutes before the scheduled time. If you are unable to attend for a valid reason, inform your faculty guide in advance.',
      ],
      ctaLabel: 'View meetings',
      ctaUrl: `${origin}/student/dashboard`,
      closing: 'We look forward to a productive review session.',
      footnote: 'This is an automated academic notification from the DSATM Industrial PBL Portal.',
    })
  );

  const results = await runInBatches(tasks, 5);
  const sent = results.filter((r) => r.success).length;

  return {
    team: team.teamNumber,
    recipients: (team.members || []).length,
    sent,
    skipped: (team.members || []).length - unique.size,
    failures: results.length - sent,
  };
}

/** Sends the pending-review reminder to a student who has just registered. */
export async function notifyNewlyRegisteredStudent(
  profile: { email?: string; name?: string; usn?: string },
  origin: string
): Promise<{ notified: boolean; reason?: string }> {
  if (!profile.email) return { notified: false, reason: 'No registered email address.' };
  const preview = await buildReviewPreview();
  const team = preview.pendingTeams.find((t) =>
    t.studentEmails.some((s) => s.email.toLowerCase() === profile.email!.toLowerCase())
  );
  if (!team) {
    return { notified: false, reason: 'Your group has already submitted this report or has no pending milestone.' };
  }
  const result = await sendPblNotificationEmail({
    to: profile.email,
    greetingName: profile.name || profile.usn || 'Student',
    subject: `Welcome to the DSATM PBL Portal - ${preview.review.deadline.title} submission pending`,
    heading: 'Your registration is complete; one academic action is pending',
    intro: `Your account has been created successfully and your group (Section ${team.section}, Group ${team.teamNumber}) is yet to submit the ${preview.review.deadline.title}. Please upload the report through the portal once your account is activated.`,
    details: [
      { label: 'Milestone', value: preview.review.deadline.title },
      { label: 'Group', value: `Section ${team.section} - Group ${team.teamNumber}` },
      { label: 'Submission deadline', value: formatDueDate(preview.review.deadline) },
      { label: 'Marks for this review', value: `${preview.review.maxMarks} marks per student` },
    ],
    paragraphs: [
      'One submission is sufficient for the entire group; any member may upload the report on behalf of the team.',
      'Marks are awarded individually by your faculty guide after verification, so please ensure your profile details are correct.',
    ],
    ctaLabel: 'Open the portal',
    ctaUrl: `${origin}/student/submissions`,
    closing: 'We wish you and your team a productive project semester.',
    footnote: 'This is an automated academic notification from the DSATM Industrial PBL Portal.',
  });
  return { notified: result.success, reason: result.error };
}
