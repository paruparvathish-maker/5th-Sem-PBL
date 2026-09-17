-- PBL AI Management Portal Database Schema and RLS Policies
-- Enables Vector Search (pgvector) for AI RAG

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- -------------------------------------------------------------
-- 1. Profiles Table (Extends Supabase Auth users)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  usn TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
  section TEXT CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F')),
  phone TEXT,
  is_first_login BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 2. Teams Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_number TEXT NOT NULL, -- e.g. 'A1', 'B3'
  section TEXT NOT NULL CHECK (section IN ('A', 'B', 'C', 'D', 'E', 'F')),
  project_title TEXT NOT NULL DEFAULT 'To Be Decided (TBD)',
  project_description TEXT DEFAULT '',
  guide_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_team_section UNIQUE (team_number, section)
);

-- -------------------------------------------------------------
-- 3. Team Members Table (Junction)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 4. Deadlines Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  deadline_type TEXT NOT NULL CHECK (deadline_type IN ('meeting', 'review', 'submission')),
  due_date TIMESTAMPTZ NOT NULL,
  applicable_sections TEXT[], -- NULL means all sections
  submission_required BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('upcoming', 'open', 'deadline_passed', 'evaluated')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 5. Submission Reopens Table (Admin override per team)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submission_reopens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deadline_id UUID NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  reopened_until TIMESTAMPTZ NOT NULL,
  reopened_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_deadline_team_reopen UNIQUE (deadline_id, team_id)
);

-- -------------------------------------------------------------
-- 6. Submissions Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deadline_id UUID NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  submission_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'late', 'reopened_submission')),
  ai_summary TEXT,
  ai_feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 7. Document Chunks Table (for RAG with pgvector)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- -------------------------------------------------------------
-- 8. Evaluations Table (Marks & Criteria)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deadline_id UUID NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES profiles(id),
  evaluation_type TEXT NOT NULL CHECK (evaluation_type IN ('team', 'individual')),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL if team-level
  criteria_scores JSONB NOT NULL, -- Array of { criterion: string, max_marks: number, marks_obtained: number, comments: string }
  total_marks NUMERIC(5,2) NOT NULL,
  max_total_marks NUMERIC(5,2) NOT NULL,
  faculty_comments TEXT DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 9. Guide Meetings Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS guide_meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  faculty_id UUID NOT NULL REFERENCES profiles(id),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  meeting_date TIMESTAMPTZ NOT NULL,
  location TEXT DEFAULT 'Seminar Hall / Online',
  agenda TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  faculty_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 10. Notifications Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 11. Audit Logs Table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- SERVER-SIDE DEADLINE ENFORCEMENT TRIGGER FUNCTION
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_submission_deadline()
RETURNS TRIGGER AS $$
DECLARE
  target_deadline RECORD;
  is_reopened BOOLEAN := FALSE;
BEGIN
  -- Fetch deadline details
  SELECT * INTO target_deadline FROM deadlines WHERE id = NEW.deadline_id;
  
  IF target_deadline IS NULL THEN
    RAISE EXCEPTION 'Target deadline does not exist.';
  END IF;

  -- Check if Admin explicitly reopened submission for this team
  SELECT EXISTS (
    SELECT 1 FROM submission_reopens 
    WHERE deadline_id = NEW.deadline_id 
      AND team_id = NEW.team_id 
      AND reopened_until >= NOW()
  ) INTO is_reopened;

  -- Enforce server-side rejection if past deadline and not reopened
  IF NOW() > target_deadline.due_date AND NOT is_reopened THEN
    RAISE EXCEPTION 'Submission rejected: Deadline passed at % and submission is locked.', target_deadline.due_date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_submission_deadline_trigger
BEFORE INSERT OR UPDATE ON submissions
FOR EACH ROW EXECUTE FUNCTION check_submission_deadline();

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_reopens ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Profiles Policies
CREATE POLICY "Profiles read own or faculty/admin" ON profiles
  FOR SELECT USING (
    id = auth.uid() 
    OR current_user_role() = 'admin'
    OR (current_user_role() = 'faculty' AND id IN (
      SELECT tm.student_id FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE t.guide_id = auth.uid()
    ))
  );

CREATE POLICY "Admin manages profiles" ON profiles
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "Users update own profile password status" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Teams Policies
CREATE POLICY "Student read own team" ON teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM team_members WHERE student_id = auth.uid())
    OR (current_user_role() = 'faculty' AND guide_id = auth.uid())
    OR current_user_role() = 'admin'
  );

CREATE POLICY "Admin manages teams" ON teams
  FOR ALL USING (current_user_role() = 'admin');

-- Team Members Policies
CREATE POLICY "Read team members" ON team_members
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE student_id = auth.uid())
    OR (current_user_role() = 'faculty' AND team_id IN (SELECT id FROM teams WHERE guide_id = auth.uid()))
    OR current_user_role() = 'admin'
  );

CREATE POLICY "Admin manages team members" ON team_members
  FOR ALL USING (current_user_role() = 'admin');

-- Deadlines Policies
CREATE POLICY "Read applicable deadlines" ON deadlines
  FOR SELECT USING (
    current_user_role() = 'admin'
    OR current_user_role() = 'faculty'
    OR (
      applicable_sections IS NULL 
      OR (SELECT section FROM profiles WHERE id = auth.uid()) = ANY(applicable_sections)
    )
  );

CREATE POLICY "Admin manages deadlines" ON deadlines
  FOR ALL USING (current_user_role() = 'admin');

-- Submissions Policies
CREATE POLICY "Student manage own team submission" ON submissions
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE student_id = auth.uid())
    OR (current_user_role() = 'faculty' AND team_id IN (SELECT id FROM teams WHERE guide_id = auth.uid()))
    OR current_user_role() = 'admin'
  );

CREATE POLICY "Student insert own team submission" ON submissions
  FOR INSERT WITH CHECK (
    team_id IN (SELECT team_id FROM team_members WHERE student_id = auth.uid())
    AND submitted_by = auth.uid()
  );

CREATE POLICY "Admin manages submissions" ON submissions
  FOR ALL USING (current_user_role() = 'admin');

-- Vector Chunks RLS
CREATE POLICY "RAG chunks isolated by team authorization" ON document_chunks
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE student_id = auth.uid())
    OR (current_user_role() = 'faculty' AND team_id IN (SELECT id FROM teams WHERE guide_id = auth.uid()))
    OR current_user_role() = 'admin'
  );

-- Evaluations Policies
CREATE POLICY "Student read own published marks" ON evaluations
  FOR SELECT USING (
    is_published = true AND (
      student_id = auth.uid()
      OR (evaluation_type = 'team' AND team_id IN (SELECT team_id FROM team_members WHERE student_id = auth.uid()))
    )
    OR (current_user_role() = 'faculty' AND team_id IN (SELECT id FROM teams WHERE guide_id = auth.uid()))
    OR current_user_role() = 'admin'
  );

CREATE POLICY "Faculty manages assigned team evaluations" ON evaluations
  FOR ALL USING (
    (current_user_role() = 'faculty' AND team_id IN (SELECT id FROM teams WHERE guide_id = auth.uid()))
    OR current_user_role() = 'admin'
  );

-- Guide Meetings Policies
CREATE POLICY "Read guide meetings" ON guide_meetings
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE student_id = auth.uid())
    OR (current_user_role() = 'faculty' AND faculty_id = auth.uid())
    OR current_user_role() = 'admin'
  );

CREATE POLICY "Faculty and Admin manage guide meetings" ON guide_meetings
  FOR ALL USING (
    (current_user_role() = 'faculty' AND faculty_id = auth.uid())
    OR current_user_role() = 'admin'
  );

-- Notifications Policies
CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Audit Logs Policies
CREATE POLICY "Admin reads audit logs" ON audit_logs
  FOR SELECT USING (current_user_role() = 'admin');

CREATE POLICY "All authenticated users insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
