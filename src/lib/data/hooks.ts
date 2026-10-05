import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { UserProfile, Team, Deadline, Submission, Evaluation, GuideMeeting } from '../types/pbl';

export function useProfiles() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => {
      if (data) setProfiles(data as any);
      setLoading(false);
    });
  }, []);

  return { profiles, loading };
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('teams').select(`
      *,
      guide:profiles!guide_id(name, email),
      members:team_members(profiles(*))
    `).then(({ data }) => {
      // Map data to the format your app expects
      if (data) {
        const mappedTeams = data.map((t: any) => ({
          id: t.id,
          teamNumber: t.team_number,
          section: t.section,
          projectTitle: t.project_title,
          projectDescription: t.project_description,
          guideId: t.guide_id,
          guideName: t.guide?.name,
          guideEmail: t.guide?.email,
          members: t.members?.map((m: any) => m.profiles) || [],
          createdAt: t.created_at
        }));
        setTeams(mappedTeams as any);
      }
      setLoading(false);
    });
  }, []);

  return { teams, loading };
}

// Add more hooks for Deadlines, Submissions, Evaluations as needed...
