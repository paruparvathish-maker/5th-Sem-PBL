export type UserRole = 'student' | 'faculty' | 'admin';

export type SectionCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  usn?: string;
  role: UserRole;
  section?: SectionCode;
  phone?: string;
  staffCode?: string;
  password?: string;
  isFirstLogin: boolean;
  createdAt: string;
}

export interface Team {
  id: string;
  teamNumber: string; // e.g. 'A1', 'B3'
  section: SectionCode;
  projectTitle: string;
  projectDescription: string;
  guideId: string;
  guideName?: string;
  guideEmail?: string;
  members?: UserProfile[];
  createdAt: string;
}

export type DeadlineType = 'meeting' | 'review' | 'submission';
export type DeadlineStatus = 'upcoming' | 'open' | 'submitted' | 'deadline_passed' | 'evaluated';

export interface Deadline {
  id: string;
  title: string;
  description: string;
  deadlineType: DeadlineType;
  dueDate: string; // ISO string
  applicableSections?: SectionCode[];
  submissionRequired: boolean;
  status: DeadlineStatus;
  createdBy: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  deadlineId: string;
  deadlineTitle?: string;
  teamId: string;
  teamNumber?: string;
  projectTitle?: string;
  submittedBy: string;
  studentName?: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  submissionTime: string;
  version: number;
  status: 'submitted' | 'late' | 'reopened_submission';
  aiSummary?: string;
  aiFeedback?: {
    missingSections?: string[];
    strengths?: string[];
    potentialIssues?: string[];
    suggestedImprovements?: string[];
    facultyQuestions?: string[];
  };
}

export interface EvaluationCriterion {
  criterion: string;
  maxMarks: number;
  marksObtained: number;
  comments?: string;
}

export interface Evaluation {
  id: string;
  deadlineId: string;
  deadlineTitle?: string;
  teamId: string;
  teamNumber?: string;
  evaluatorId: string;
  evaluatorName?: string;
  evaluationType: 'team' | 'individual';
  studentId?: string;
  studentName?: string;
  studentUsn?: string;
  criteriaScores: EvaluationCriterion[];
  totalMarks: number;
  maxTotalMarks: number;
  facultyComments: string;
  isPublished: boolean;
  evaluatedAt: string;
}

export interface GuideMeeting {
  id: string;
  title: string;
  facultyId: string;
  facultyName?: string;
  teamId: string;
  teamNumber?: string;
  projectTitle?: string;
  meetingDate: string;
  location: string;
  agenda: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  facultyNotes?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId: string;
  userName?: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface RAGChunk {
  id: string;
  submissionId: string;
  teamId: string;
  content: string;
  metadata: {
    fileName: string;
    section?: string;
    pageNumber?: number;
  };
  score?: number;
}
