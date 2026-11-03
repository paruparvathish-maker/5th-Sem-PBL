import { Team, UserProfile, Deadline, Submission, Evaluation, GuideMeeting } from '../types/pbl';

const getFastApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_FASTAPI_URL) return process.env.NEXT_PUBLIC_FASTAPI_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://backend-beta-kohl-9pcedk6q96.vercel.app';
  }
  return 'http://127.0.0.1:8000';
};

const BASE_URL = getFastApiBaseUrl();

export class FastApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  public async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        cache: 'no-store'
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Auth
  public async login(identifier: string, password?: string) {
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Authentication failed');
    }
    return res.json();
  }

  // Teams
  public async getTeams(params?: {
    semester?: number;
    section?: string;
    guideId?: string;
    studentId?: string;
    search?: string;
  }): Promise<Team[]> {
    const query = new URLSearchParams();
    query.set('semester', String(params?.semester ?? 5));
    if (params?.section && params.section !== 'ALL') query.set('section', params.section);
    if (params?.guideId) query.set('guide_id', params.guideId);
    if (params?.studentId) query.set('student_id', params.studentId);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${this.baseUrl}/api/teams?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
  }

  public async getTeam(teamId: string): Promise<Team> {
    const res = await fetch(`${this.baseUrl}/api/teams/${encodeURIComponent(teamId)}`);
    if (!res.ok) throw new Error(`Failed to fetch team ${teamId}`);
    return res.json();
  }

  public async updateTeam(teamId: string, data: Partial<Team>): Promise<Team> {
    const res = await fetch(`${this.baseUrl}/api/teams/${encodeURIComponent(teamId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update team');
    return res.json();
  }

  // Students
  public async getStudents(params?: { section?: string; search?: string }): Promise<UserProfile[]> {
    const query = new URLSearchParams();
    if (params?.section && params.section !== 'ALL') query.set('section', params.section);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${this.baseUrl}/api/students?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
  }

  // Faculty
  public async getFaculty(search?: string): Promise<any[]> {
    const query = new URLSearchParams();
    if (search) query.set('search', search);

    const res = await fetch(`${this.baseUrl}/api/faculty?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch faculty');
    return res.json();
  }

  // Deadlines
  public async getDeadlines(section?: string): Promise<Deadline[]> {
    const query = new URLSearchParams();
    if (section && section !== 'ALL') query.set('section', section);

    const res = await fetch(`${this.baseUrl}/api/deadlines?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch deadlines');
    return res.json();
  }

  // Submissions
  public async getSubmissions(teamId?: string, deadlineId?: string): Promise<Submission[]> {
    const query = new URLSearchParams();
    if (teamId) query.set('team_id', teamId);
    if (deadlineId) query.set('deadline_id', deadlineId);

    const res = await fetch(`${this.baseUrl}/api/submissions?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch submissions');
    return res.json();
  }

  public async createSubmission(submission: Partial<Submission>): Promise<Submission> {
    const res = await fetch(`${this.baseUrl}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    if (!res.ok) throw new Error('Failed to create submission');
    return res.json();
  }

  // Evaluations
  public async getEvaluations(teamId?: string, studentId?: string): Promise<Evaluation[]> {
    const query = new URLSearchParams();
    if (teamId) query.set('team_id', teamId);
    if (studentId) query.set('student_id', studentId);

    const res = await fetch(`${this.baseUrl}/api/evaluations?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch evaluations');
    return res.json();
  }

  public async createEvaluation(evaluation: Partial<Evaluation>): Promise<Evaluation> {
    const res = await fetch(`${this.baseUrl}/api/evaluations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evaluation),
    });
    if (!res.ok) throw new Error('Failed to create evaluation');
    return res.json();
  }

  // Guide Meetings
  public async getMeetings(teamId?: string): Promise<GuideMeeting[]> {
    const query = new URLSearchParams();
    if (teamId) query.set('team_id', teamId);

    const res = await fetch(`${this.baseUrl}/api/meetings?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch meetings');
    return res.json();
  }

  // Full Database Sync Bridge
  public async getDatabase(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/db`);
    if (!res.ok) throw new Error('Failed to fetch backend database');
    return res.json();
  }

  public async syncDatabase(payload: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to sync to backend database');
    return res.json();
  }
}

export const fastApiClient = new FastApiClient();

