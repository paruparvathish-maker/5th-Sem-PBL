# PBL AI Management Portal

A full-stack, production-ready Project-Based Learning (PBL) Management Portal built for colleges using **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase PostgreSQL (with RLS)**, **pgvector**, and **OpenAI API**.

---

## 🌟 Key Features & Highlights

### 1. 🔐 Role-Based Authentication & Security
- **Student Initial Login**: Username = USN (e.g. `1DT24CS010`), Password = USN (`1DT24CS010`).
  - **Forced Password Change**: Required on first login. Initial USN password is permanently invalidated upon change.
- **Faculty Initial Login**: Username = Email (e.g. `parvathisha-cse@dsatm.edu.in`), Password = Mobile Number (e.g. `9550011981`).
  - Forced password change on first login.
- **Admin Login**: Secure administrator account credentials (`admin@pbl.edu.in`).
- **Data Isolation & RLS**: Database level Row Level Security (RLS) policies ensuring Students can only view their own team and published marks. Faculty can access only their assigned teams across Sections A-F.

### 2. 🛡️ Server-Side Deadline Enforcement
- Deadlines enforce cut-off timestamps server-side and database-side.
- If current time exceeds the due date, document upload UI is disabled and API requests are rejected.
- Re-opening submissions requires explicit Admin override for target teams.

### 3. 📊 Role-Based Dashboards & Interfaces
- **Student Portal**: View Team details, deadlines, uploaded submissions, published review marks (individual criteria breakdown), and scheduled guide meetings.
- **Faculty Portal**: Multi-section overview (Sections A-F), assigned team browser, submission inspector, configurable rubric evaluation interface (Team-level vs. Individual student grading), and guide meeting scheduler.
- **Admin Portal**: System metrics, Student CRUD, Faculty allocation, Team & Guide assignments, Deadline manager, Excel/Word Import engine with validation preview, and Audit Log viewer.

### 4. 📁 Excel / Word Import Engine
- Upload `.xlsx` spreadsheets with fields: USN, Student Name, Section (A-F), Team Number, Faculty Guide, Faculty Email, Project Title.
- **Pre-import Validation Pipeline**: Detects duplicate USNs (in file or database), missing required fields, invalid section codes, and missing guide references.
- Interactive error-highlight preview table before committing data.

### 5. 🤖 AI Features (RAG & Advisory Analysis)
- **RAG Document Q&A**: Asks questions over uploaded PDF/DOCX project files. Enforces team authorization metadata filtering (students cannot retrieve unauthorized teams' docs).
- **AI Submission Analysis**: Evaluates submitted documents for summary, missing sections, strengths, weaknesses, and suggested defense questions for faculty (Advisory only).
- **AI Project Assistant**: Generates problem statements, objectives, methodology phases, and tech stack ideas.

---

## 📁 Database Schema & Seed Data

SQL migrations are provided in `supabase/migrations/`:
- `01_schema_and_rls.sql`: Defines tables (`profiles`, `teams`, `deadlines`, `submissions`, `evaluations`, `guide_meetings`, `document_chunks` with `pgvector`, `audit_logs`), triggers, and RLS policies.
- `02_seed_data.sql`: Parsed dataset from the college PDF OCR containing Sections A, B, C, D, E, and F student rosters, project titles, and faculty guide allocations.

---

## 🚀 Local Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Provide your Supabase URL, Anon Key, and OpenAI API Key.

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Quick Testing Credentials

Use the **Quick Demo Credentials** autofill buttons on the login page:
- **Student**: USN `1DT24CS010` / Password `1DT24CS010` (Team A1)
- **Faculty Guide**: `mr.-gajendra-l-cse@dsatm.edu.in` / Password `9550095500` (Guide for Teams A1, D12, F9)
- **Admin**: `admin@pbl.edu.in` / Password `Admin@PBL2026!`
