from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    usn: Optional[str] = None
    role: str # 'student' | 'faculty' | 'admin'
    section: Optional[str] = None
    phone: Optional[str] = None
    staffCode: Optional[str] = None
    password: Optional[str] = None
    isFirstLogin: bool = True
    createdAt: Optional[str] = None

class Team(BaseModel):
    id: str
    teamNumber: str
    section: str
    semester: int = 5
    projectTitle: str
    projectDescription: str
    guideId: str
    guideName: Optional[str] = None
    guideEmail: Optional[str] = None
    members: Optional[List[UserProfile]] = []
    createdAt: Optional[str] = None
    researchPaperStatus: Optional[str] = None
    researchPaperProofPath: Optional[str] = None
    researchPaperProofName: Optional[str] = None
    researchPaperUpdatedAt: Optional[str] = None

class Deadline(BaseModel):
    id: str
    title: str
    description: str
    deadlineType: str # 'meeting' | 'review' | 'submission'
    dueDate: str
    applicableSections: Optional[List[str]] = None
    totalMarks: Optional[int] = None
    maxFileSizeMB: Optional[int] = None
    isLocked: Optional[bool] = False

class Submission(BaseModel):
    id: str
    deadlineId: str
    teamId: str
    studentId: str
    studentName: str
    fileName: str
    filePath: str
    fileSize: int
    submissionTime: str
    version: int = 1
    comments: Optional[str] = None

class Evaluation(BaseModel):
    id: str
    submissionId: Optional[str] = None
    teamId: str
    studentId: Optional[str] = None
    evaluatorId: str
    evaluatorRole: str
    marks: float
    totalMarks: float
    rubricScores: Optional[Dict[str, float]] = None
    feedback: str
    evaluationTime: str
    isPublished: bool = True

class GuideMeeting(BaseModel):
    id: str
    teamId: str
    guideId: str
    meetingDate: str
    attendance: List[str] = []
    discussionPoints: str
    tasksAssigned: str
    nextMeetingDate: Optional[str] = None
    verifiedByGuide: bool = True

class LoginRequest(BaseModel):
    identifier: str
    password: Optional[str] = None

class UpdateTeamRequest(BaseModel):
    projectTitle: Optional[str] = None
    projectDescription: Optional[str] = None
    guideId: Optional[str] = None
    guideName: Optional[str] = None
    guideEmail: Optional[str] = None

class DatabaseSyncPayload(BaseModel):
    profiles: Optional[List[Dict[str, Any]]] = None
    teams: Optional[List[Dict[str, Any]]] = None
    deadlines: Optional[List[Dict[str, Any]]] = None
    submissions: Optional[List[Dict[str, Any]]] = None
    evaluations: Optional[List[Dict[str, Any]]] = None
    guideMeetings: Optional[List[Dict[str, Any]]] = None
    notifications: Optional[List[Dict[str, Any]]] = None
    auditLogs: Optional[List[Dict[str, Any]]] = None

