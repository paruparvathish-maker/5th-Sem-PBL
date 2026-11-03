import json
import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Body, status, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from models import (
    UserProfile, Team, Deadline, Submission, Evaluation, GuideMeeting,
    LoginRequest, ChangePasswordRequest, UpdateTeamRequest, UpdateResearchPaperRequest, DatabaseSyncPayload
)

app = FastAPI(
    title="PBL Portal REST API (FastAPI Backend)",
    description="High-performance backend API powering the Project-Based Learning Portal for DSATM CSE.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Next.js Frontend (local & deployed Vercel domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001"
    ],
    allow_origin_regex=r"https?://.*",
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

# Root: Interactive API Portal Dashboard or JSON
@app.get("/", tags=["General"])
def root(request: Request, format: Optional[str] = None):
    accept = request.headers.get("accept", "")
    if format == "json" or ("application/json" in accept and "text/html" not in accept):
        return {
            "status": "online",
            "service": "PBL Portal FastAPI Backend",
            "version": "1.0.0",
            "docs_url": "/docs",
            "teams_count": len(DB.get("teams", [])),
            "profiles_count": len(DB.get("profiles", []))
        }

    teams = DB.get("teams", [])
    sem5_count = len([t for t in teams if t.get("semester", 5) == 5])
    sem4_count = len([t for t in teams if t.get("semester") == 4])
    profiles = DB.get("profiles", [])
    students_count = len([p for p in profiles if p.get("role") == "student"])
    faculty_count = len([p for p in profiles if p.get("role") == "faculty"])

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DSATM PBL Portal — FastAPI Backend</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Plus Jakarta Sans', sans-serif; }}
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
  
  <div class="max-w-5xl mx-auto px-6 py-12 w-full space-y-10">
    <!-- Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-3">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>FastAPI Backend Online & Synced</span>
        </div>
        <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          DSATM PBL Portal Backend
        </h1>
        <p class="text-slate-400 text-sm mt-1">
          High-performance REST API powering 5th Semester Project-Based Learning & 4th Semester Research Papers.
        </p>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <a href="/docs" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2">
          <span>Explore Swagger API Docs</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
        </a>
        <a href="/redoc" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition">
          <span>ReDoc</span>
        </a>
      </div>
    </header>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">5th Sem Projects</span>
        <h2 class="text-3xl font-black text-white mt-2">{sem5_count}</h2>
        <p class="text-xs text-indigo-400 font-semibold mt-1">Sections 5A — 5F</p>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">4th Sem Papers</span>
        <h2 class="text-3xl font-black text-white mt-2">{sem4_count}</h2>
        <p class="text-xs text-amber-400 font-semibold mt-1">Isolated Tracking</p>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
        <h2 class="text-3xl font-black text-white mt-2">{students_count}</h2>
        <p class="text-xs text-emerald-400 font-semibold mt-1">Authenticated Enrollees</p>
      </div>

      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Faculty Guides</span>
        <h2 class="text-3xl font-black text-white mt-2">{faculty_count}</h2>
        <p class="text-xs text-purple-400 font-semibold mt-1">Project Mentors</p>
      </div>
    </div>

    <!-- Live Endpoints Explorer -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-extrabold text-white">Live REST API Endpoints</h2>
        <span class="text-xs text-slate-400 font-mono">Format: JSON</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <a href="/api/teams?semester=5" target="_blank" class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 transition flex items-center justify-between group">
          <div>
            <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] mr-2">GET</span>
            <span class="font-mono text-slate-300">/api/teams?semester=5</span>
            <p class="text-slate-500 text-[11px] mt-1">List 5th Semester PBL Projects & titles</p>
          </div>
          <span class="text-indigo-400 group-hover:translate-x-1 transition text-sm">→</span>
        </a>

        <a href="/api/faculty" target="_blank" class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 transition flex items-center justify-between group">
          <div>
            <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] mr-2">GET</span>
            <span class="font-mono text-slate-300">/api/faculty</span>
            <p class="text-slate-500 text-[11px] mt-1">List faculty mentors & 5th sem workloads</p>
          </div>
          <span class="text-indigo-400 group-hover:translate-x-1 transition text-sm">→</span>
        </a>

        <a href="/api/students?section=A" target="_blank" class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 transition flex items-center justify-between group">
          <div>
            <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] mr-2">GET</span>
            <span class="font-mono text-slate-300">/api/students?section=A</span>
            <p class="text-slate-500 text-[11px] mt-1">Query students by section or USN</p>
          </div>
          <span class="text-indigo-400 group-hover:translate-x-1 transition text-sm">→</span>
        </a>

        <a href="/api/deadlines" target="_blank" class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 transition flex items-center justify-between group">
          <div>
            <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] mr-2">GET</span>
            <span class="font-mono text-slate-300">/api/deadlines</span>
            <p class="text-slate-500 text-[11px] mt-1">Active project deadlines & milestone rubrics</p>
          </div>
          <span class="text-indigo-400 group-hover:translate-x-1 transition text-sm">→</span>
        </a>
      </div>
    </div>

    <!-- Frontend Link Guide -->
    <div class="bg-indigo-950/40 border border-indigo-800/50 rounded-2xl p-6 text-xs text-indigo-200 space-y-2">
      <div class="flex items-center gap-2 text-indigo-300 font-extrabold text-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span>Looking for the Student / Faculty / Admin Portal UI?</span>
      </div>
      <p class="leading-relaxed">
        This URL is the <strong>FastAPI Backend Service</strong>. The Next.js Frontend Portal runs in the project root.
        To deploy the frontend on Vercel, ensure the project root directory is set to <code class="bg-indigo-900/50 px-2 py-0.5 rounded font-mono text-white">.</code> (root) and configure <code class="bg-indigo-900/50 px-2 py-0.5 rounded font-mono text-white">NEXT_PUBLIC_FASTAPI_URL</code> to this URL.
      </p>
    </div>
  </div>

  <footer class="text-center py-6 border-t border-slate-900 text-slate-500 text-xs">
    Dayananda Sagar Academy of Technology and Management — Computer Science & Engineering
  </footer>
</body>
</html>"""
    return HTMLResponse(content=html_content)

@app.get("/api/health", tags=["General"])
def health_check():
    return {"status": "ok", "db_synced": True}

# ----------------- Auth -----------------
@app.post("/api/auth/login", tags=["Authentication"])
def login(req: LoginRequest):
    import re
    identifier = req.identifier.strip().lower()
    clean_digits = re.sub(r"\D", "", identifier)
    profiles = DB.get("profiles", [])

    user = None
    for p in profiles:
        email = (p.get("email") or "").lower()
        usn = (p.get("usn") or "").lower()
        uid = (p.get("id") or "").lower()
        phone = (p.get("phone") or "").lower()
        phone_digits = re.sub(r"\D", "", phone) if phone else ""
        staff_code = (p.get("staffCode") or "").lower()

        if identifier in (email, usn, uid, staff_code):
            user = p
            break
        if phone and (identifier == phone or (len(clean_digits) >= 7 and clean_digits == phone_digits)):
            user = p
            break

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    is_first_login = user.get("isFirstLogin", True)
    custom_password = user.get("password")

    # If user has already changed their password, only accept the custom password
    if custom_password and not is_first_login:
        if req.password != custom_password:
            raise HTTPException(status_code=401, detail="Invalid password. Please use your newly created password.")
    else:
        # First-time login: accept custom password if set, or initial credentials (phone, USN, admin pass)
        req_pass = req.password or ""
        req_digits = re.sub(r"\D", "", req_pass)
        user_phone = user.get("phone") or ""
        user_phone_digits = re.sub(r"\D", "", user_phone)

        is_valid = False
        if custom_password and req_pass == custom_password:
            is_valid = True
        elif user.get("role") == "admin" and req_pass == "03May@2002@":
            is_valid = True
        elif user.get("role") == "student" and (req_pass.lower() == (user.get("usn") or "").lower() or (user_phone and (req_pass == user_phone or req_digits == user_phone_digits))):
            is_valid = True
        elif user.get("role") == "faculty" and (req_pass == user_phone or (user_phone_digits and req_digits == user_phone_digits) or req_pass.lower() == (user.get("staffCode") or "").lower()):
            is_valid = True

        if not is_valid:
            raise HTTPException(status_code=401, detail="Invalid password.")

    return {
        "success": True,
        "user": user,
        "requiresPasswordChange": is_first_login
    }

@app.post("/api/auth/change-password", tags=["Authentication"])
def change_password(req: ChangePasswordRequest):
    import datetime
    profiles = DB.get("profiles", [])
    target_id = req.userId.strip().lower()

    for p in profiles:
        uid = (p.get("id") or "").lower()
        email = (p.get("email") or "").lower()
        usn = (p.get("usn") or "").lower()

        if target_id in (uid, email, usn):
            p["password"] = req.newPassword
            p["isFirstLogin"] = False
            p["passwordUpdatedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            save_data()
            return {"success": True, "message": "Password changed successfully", "user": p}

    raise HTTPException(status_code=404, detail="User not found")

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
            if req.researchPaperStatus is not None:
                t["researchPaperStatus"] = req.researchPaperStatus
            if req.researchPaperProofName is not None:
                t["researchPaperProofName"] = req.researchPaperProofName
            if req.researchPaperProofPath is not None:
                t["researchPaperProofPath"] = req.researchPaperProofPath
            if req.researchPaperUpdatedAt is not None:
                t["researchPaperUpdatedAt"] = req.researchPaperUpdatedAt

            save_data()
            return t

    raise HTTPException(status_code=404, detail="Team not found")

@app.put("/api/teams/{team_id}/research-paper", response_model=Team, tags=["Teams"])
def update_research_paper(team_id: str, req: UpdateResearchPaperRequest):
    import datetime
    teams = DB.get("teams", [])
    for t in teams:
        if t.get("id") == team_id or t.get("teamNumber") == team_id:
            t["researchPaperStatus"] = req.researchPaperStatus
            if req.researchPaperProofName is not None:
                t["researchPaperProofName"] = req.researchPaperProofName
            if req.researchPaperProofPath is not None:
                t["researchPaperProofPath"] = req.researchPaperProofPath
            t["researchPaperUpdatedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

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
