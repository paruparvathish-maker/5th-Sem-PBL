# PBL Portal — FastAPI Backend API

A high-performance REST API built with **FastAPI**, **Pydantic v2**, and **Uvicorn** to power the DSATM Project-Based Learning (PBL) Portal, fully mapped with all 5th Semester PBL projects, students, faculty guides, and administration.

---

## 🚀 Quick Start

### 1. Start the FastAPI Server

You can start the backend using any of the following methods:

**Option A (NPM script):**
```bash
npm run backend
# or
npm run api
```

**Option B (One-Click Windows Batch file):**
Double click `start-backend.bat` in the project root.

**Option C (Direct Python):**
```bash
python backend/run.py
```

The server will start at:
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Documentation**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## 🌐 Frontend & Backend Connection

- **CORS Configured**: Configured to accept requests from `http://localhost:3000`, `http://127.0.0.1:3000`, and all development ports.
- **Frontend Environment Variable**:
  ```env
  NEXT_PUBLIC_FASTAPI_URL=http://127.0.0.1:8000
  ```
- **Next.js Proxy / Rewrites**:
  Any request sent to `http://localhost:3000/fastapi/*` is automatically proxied to `http://127.0.0.1:8000/api/*`.
- **Frontend TypeScript Client**:
  Import and use `fastApiClient` directly in React components:
  ```ts
  import { fastApiClient } from '@/lib/api/fastapi-client';

  // Fetch 5th sem teams
  const teams = await fastApiClient.getTeams({ semester: 5, section: 'A' });

  // Update a team's project title
  await fastApiClient.updateTeam('team-5-A-A1', {
    projectTitle: 'VisionEdge: An Open Benchmark Suite for Mobile Vision Inference'
  });
  ```
- **Bidirectional Store Sync**:
  The store in `src/lib/data/store.ts` automatically synchronizes with `http://127.0.0.1:8000/api/db` on startup and whenever changes are saved.

---

## 📡 API Endpoints Reference

### 1. Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login with email, USN, or ID and password |

### 2. Teams (Semester 5 PBL & Semester 4 Papers)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/teams` | List teams (default `semester=5`, query by `section`, `guide_id`, `student_id`, `search`) |
| `GET` | `/api/teams/{team_id}` | Retrieve specific team details and members |
| `PUT` | `/api/teams/{team_id}` | Update project title, description, or guide |

### 3. Students & Faculty
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/students` | List student directory (filter by `section`, `search`) |
| `GET` | `/api/faculty` | List faculty with their 5th semester project allocations |

### 4. Deadlines, Submissions & Evaluations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/deadlines` | List active deadlines (filter by `section`) |
| `GET` | `/api/submissions` | List submissions (filter by `team_id`, `deadline_id`) |
| `POST` | `/api/submissions` | Upload/register a submission |
| `GET` | `/api/evaluations` | List evaluations |
| `POST` | `/api/evaluations` | Submit rubric marks and feedback |
| `GET` | `/api/meetings` | List guide meetings |
| `POST` | `/api/meetings` | Log guide meeting notes & attendance |

### 5. Full Database Sync
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/db` | Full store data dump for frontend sync |
| `POST` | `/api/db` | Sync entire database state from frontend |

