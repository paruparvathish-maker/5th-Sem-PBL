import json
import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Body, status
from fastapi.middleware.cors import CORSMiddleware
from models import (
    UserProfile, Team, Deadline, Submission, Evaluation, GuideMeeting,
    LoginRequest, UpdateTeamRequest, DatabaseSyncPayload
)

app = FastAPI(
    title="PBL Portal REST API (FastAPI Backend)",
    description="High-performance backend API powering the Project-Based Learning Portal for DSATM CSE.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = os.path.join(os.path.dirname(__file__), "data.json")

# In-memory storage loaded from data.json
DB: Dict[str, Any] = {
    "profiles": [],
    "teams": [],
    "deadlines": [],
    "submissions": [],
    "evaluations": [],
    "guideMeetings": [],
    "notifications": [],
    "auditLogs": []
}

def load_data():
    global DB
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                DB = json.load(f)
                print(f"[FastAPI] Loaded DB from {DATA_FILE}: {len(DB.get('teams', []))} teams, {len(DB.get('profiles', []))} profiles.")
        except Exception as e:
            print(f"[FastAPI] Error loading {DATA_FILE}: {e}")

def save_data():
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(DB, f, indent=2)
    except Exception as e:
        print(f"[FastAPI] Error saving {DATA_FILE}: {e}")

@app.on_event("startup")
def startup_event():
    load_data()

# Root & Health Check
@app.get("/", tags=["General"])
def root():
    return {
        "status": "online",
        "service": "PBL Portal FastAPI Backend",
        "version": "1.0.0",
        "docs_url": "/docs",
        "teams_count": len(DB.get("teams", [])),
        "profiles_count": len(DB.get("profiles", []))
    }

@app.get("/api/health", tags=["General"])
def health_check():
    return {"status": "ok", "db_synced": True}

# ----------------- Auth -----------------
@app.post("/api/auth/login", tags=["Authentication"])
def login(req: LoginRequest):
    identifier = req.identifier.strip().lower()
    profiles = DB.get("profiles", [])

    user = None
    for p in profiles:
        email = (p.get("email") or "").lower()
        usn = (p.get("usn") or "").lower()
        uid = (p.get("id") or "").lower()

        if identifier in (email, usn, uid):
            user = p
            break

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    expected_password = user.get("password") or user.get("usn") or user.get("phone") or "123456"
    if req.password and req.password != expected_password:
        raise HTTPException(status_code=401, detail="Invalid password")

    return {
        "success": True,
        "user": user,
        "requiresPasswordChange": user.get("isFirstLogin", False)
    }

# ----------------- Teams -----------------
@app.get("/api/teams", response_model=List[Team], tags=["Teams"])
def get_teams(
    semester: Optional[int] = 5,
    section: Optional[str] = None,
    guide_id: Optional[str] = None,
    student_id: Optional[str] = None,
    search: Optional[str] = None
):
    teams = DB.get("teams", [])
    result = []

    for t in teams:
        # Semester filter
        t_sem = t.get("semester", 5)
        if semester is not None and t_sem != semester:
            continue

        # Section filter
        if section and section.upper() != "ALL" and t.get("section", "").upper() != section.upper():
            continue

        # Guide filter
        if guide_id and t.get("guideId") != guide_id:
            continue

        # Student member filter
        if student_id:
            clean_stud = student_id.lower()
            members = t.get("members", [])
            has_student = any(
                (m.get("id", "").lower() == clean_stud or (m.get("usn") or "").lower() == clean_stud)
                for m in members
            )
            if not has_student:
                continue

        # Search filter
        if search:
            q = search.lower()
            matches = (
                q in t.get("teamNumber", "").lower()
                or q in t.get("projectTitle", "").lower()
                or q in (t.get("guideName") or "").lower()
                or any(
                    q in (m.get("name") or "").lower() or q in (m.get("usn") or "").lower()
                    for m in t.get("members", [])
                )
            )
            if not matches:
                continue

        result.append(t)

    return result

@app.get("/api/teams/{team_id}", response_model=Team, tags=["Teams"])
def get_team_by_id(team_id: str):
    teams = DB.get("teams", [])
    for t in teams:
        if t.get("id") == team_id or t.get("teamNumber") == team_id:
            return t
    raise HTTPException(status_code=404, detail="Team not found")

@app.put("/api/teams/{team_id}", response_model=Team, tags=["Teams"])
def update_team(team_id: str, req: UpdateTeamRequest):
    teams = DB.get("teams", [])
    for t in teams:
        if t.get("id") == team_id or t.get("teamNumber") == team_id:
            if req.projectTitle is not None:
                t["projectTitle"] = req.projectTitle
            if req.projectDescription is not None:
                t["projectDescription"] = req.projectDescription
            if req.guideId is not None:
                t["guideId"] = req.guideId
            if req.guideName is not None:
                t["guideName"] = req.guideName
            if req.guideEmail is not None:
                t["guideEmail"] = req.guideEmail

            save_data()
            return t

    raise HTTPException(status_code=404, detail="Team not found")

# ----------------- Students & Faculty -----------------
@app.get("/api/students", response_model=List[UserProfile], tags=["Students"])
def get_students(
    section: Optional[str] = None,
    search: Optional[str] = None
):
    profiles = DB.get("profiles", [])
    students = [p for p in profiles if p.get("role") == "student"]

    if section and section.upper() != "ALL":
        students = [s for s in students if s.get("section", "").upper() == section.upper()]

    if search:
        q = search.lower()
        students = [
            s for s in students
            if q in s.get("name", "").lower()
            or q in (s.get("usn") or "").lower()
            or q in s.get("email", "").lower()
        ]

    return students

@app.get("/api/faculty", tags=["Faculty"])
def get_faculty(search: Optional[str] = None):
    profiles = DB.get("profiles", [])
    teams = DB.get("teams", [])
    faculty = [p for p in profiles if p.get("role") == "faculty"]

    if search:
        q = search.lower()
        faculty = [
            f for f in faculty
            if q in f.get("name", "").lower()
            or q in f.get("email", "").lower()
        ]

    # Attach assigned 5th sem teams info
    result = []
    for f in faculty:
        fid = f.get("id")
        assigned_5th_sem = [t for t in teams if t.get("guideId") == fid and t.get("semester", 5) == 5]
        result.append({
            **f,
            "assignedTeamsCount": len(assigned_5th_sem),
            "assigned5thSemProjects": [
                {
                    "teamId": t.get("id"),
                    "teamNumber": t.get("teamNumber"),
                    "section": t.get("section"),
                    "projectTitle": t.get("projectTitle")
                }
                for t in assigned_5th_sem
            ]
        })

    return result

# ----------------- Deadlines -----------------
@app.get("/api/deadlines", response_model=List[Deadline], tags=["Deadlines"])
def get_deadlines(section: Optional[str] = None):
    deadlines = DB.get("deadlines", [])
    if section and section.upper() != "ALL":
        deadlines = [
            d for d in deadlines
            if not d.get("applicableSections") or section.upper() in d.get("applicableSections", [])
        ]
    return deadlines

# ----------------- Submissions -----------------
@app.get("/api/submissions", response_model=List[Submission], tags=["Submissions"])
def get_submissions(
    team_id: Optional[str] = None,
    deadline_id: Optional[str] = None
):
    subs = DB.get("submissions", [])
    if team_id:
        subs = [s for s in subs if s.get("teamId") == team_id]
    if deadline_id:
        subs = [s for s in subs if s.get("deadlineId") == deadline_id]
    return subs

@app.post("/api/submissions", response_model=Submission, status_code=status.HTTP_201_CREATED, tags=["Submissions"])
def create_submission(sub: Submission):
    subs = DB.setdefault("submissions", [])
    subs.append(sub.dict())
    save_data()
    return sub

# ----------------- Evaluations -----------------
@app.get("/api/evaluations", response_model=List[Evaluation], tags=["Evaluations"])
def get_evaluations(
    team_id: Optional[str] = None,
    student_id: Optional[str] = None
):
    evals = DB.get("evaluations", [])
    if team_id:
        evals = [e for e in evals if e.get("teamId") == team_id]
    if student_id:
        evals = [e for e in evals if e.get("studentId") == student_id]
    return evals

@app.post("/api/evaluations", response_model=Evaluation, status_code=status.HTTP_201_CREATED, tags=["Evaluations"])
def create_evaluation(eval_item: Evaluation):
    evals = DB.setdefault("evaluations", [])
    evals.append(eval_item.dict())
    save_data()
    return eval_item

# ----------------- Guide Meetings -----------------
@app.get("/api/meetings", response_model=List[GuideMeeting], tags=["Guide Meetings"])
def get_meetings(team_id: Optional[str] = None):
    meetings = DB.get("guideMeetings", [])
    if team_id:
        meetings = [m for m in meetings if m.get("teamId") == team_id]
    return meetings

@app.post("/api/meetings", response_model=GuideMeeting, status_code=status.HTTP_201_CREATED, tags=["Guide Meetings"])
def create_meeting(meeting: GuideMeeting):
    meetings = DB.setdefault("guideMeetings", [])
    meetings.append(meeting.dict())
    save_data()
    return meeting

# ----------------- Full Database Sync (Frontend Store Bridge) -----------------
@app.get("/api/db", tags=["Database Sync"])
def get_full_database():
    """Returns complete database payload compatible with the Next.js PBL store."""
    return DB

@app.post("/api/db", tags=["Database Sync"])
def sync_full_database(payload: DatabaseSyncPayload):
    """Receives full database state synced from the Next.js frontend."""
    global DB
    if payload.profiles is not None:
        DB["profiles"] = payload.profiles
    if payload.teams is not None:
        DB["teams"] = payload.teams
    if payload.deadlines is not None:
        DB["deadlines"] = payload.deadlines
    if payload.submissions is not None:
        DB["submissions"] = payload.submissions
    if payload.evaluations is not None:
        DB["evaluations"] = payload.evaluations
    if payload.guideMeetings is not None:
        DB["guideMeetings"] = payload.guideMeetings
    if payload.notifications is not None:
        DB["notifications"] = payload.notifications
    if payload.auditLogs is not None:
        DB["auditLogs"] = payload.auditLogs

    save_data()
    return {"success": True, "message": "Backend database updated successfully from frontend"}
