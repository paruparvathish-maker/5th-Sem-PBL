'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  UserCheck,
  Save,
  Send,
  Lock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { EvaluationCriterion } from '@/lib/types/pbl';

type EvaluationScope = 'team' | 'individual';

type StudentScore = {
  studentId: string;
  studentName: string;
  studentUsn: string;
  marksObtained: number;
  comments: string;
};

// Single 5-mark criterion used for ALL evaluations currently
const BASE_CRITERIA: EvaluationCriterion[] = [
  { criterion: 'Problem Statement & Description', maxMarks: 5, marksObtained: 5, comments: '' },
];

function FacultyEvaluationsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectedTeamId = searchParams.get('teamId');

  if (!user) return null;

  // Load assigned teams and deadlines from store
  const [assignedTeams, setAssignedTeams] = useState(store.getTeamsByGuideId(user.id));
  const [allDeadlines, setAllDeadlines] = useState(store.getAllDeadlines().filter((d) => d.id === 'dl-project-stmt'));
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    store.syncFromSupabase().then(() => {
      setAssignedTeams([...store.getTeamsByGuideId(user.id)]);
      setAllDeadlines(store.getAllDeadlines().filter((d) => d.id === 'dl-project-stmt'));
      setIsSyncing(false);
    });
  }, [user.id]);

  const [selectedTeamId, setSelectedTeamId] = useState(preselectedTeamId || assignedTeams[0]?.id || '');
  const [selectedDeadlineId, setSelectedDeadlineId] = useState(allDeadlines[0]?.id || '');
  const scope: EvaluationScope = 'individual';

  // Criteria scores (rubric - for team level)
  const [criteriaScores, setCriteriaScores] = useState<EvaluationCriterion[]>(
    BASE_CRITERIA.map((c) => ({ ...c }))
  );

  // Individual student scores (for individual scope)
  const [studentScores, setStudentScores] = useState<StudentScore[]>([]);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Derived values
  const selectedTeam = useMemo(
    () => assignedTeams.find((t) => t.id === selectedTeamId),
    [assignedTeams, selectedTeamId]
  );

  const selectedDeadline = useMemo(
    () => allDeadlines.find((d) => d.id === selectedDeadlineId),
    [allDeadlines, selectedDeadlineId]
  );

  // Reset student scores when team or scope changes
  useEffect(() => {
    if (selectedTeam?.members) {
      setStudentScores(
        selectedTeam.members.map((m) => ({
          studentId: m.id,
          studentName: m.name,
          studentUsn: m.usn || '',
          marksObtained: 5,
          comments: '',
        }))
      );
    } else {
      setStudentScores([]);
    }
  }, [selectedTeamId, selectedTeam]);

  // Reset criteria when deadline changes
  useEffect(() => {
    setCriteriaScores(BASE_CRITERIA.map((c) => ({ ...c })));
    setOverallFeedback('');
    setPublished(false);
    setMessage(null);
  }, [selectedDeadlineId]);

  // --- Score Updates ---
  const updateCriterionMarks = (idx: number, val: number) => {
    setCriteriaScores((prev) =>
      prev.map((c, i) =>
        i === idx
          ? { ...c, marksObtained: Math.max(0, Math.min(c.maxMarks, val)) }
          : c
      )
    );
  };

  const updateCriterionComment = (idx: number, text: string) => {
    setCriteriaScores((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, comments: text } : c))
    );
  };

  const updateStudentMarks = (studentId: string, marks: number) => {
    setStudentScores((prev) =>
      prev.map((s) =>
        s.studentId === studentId
          ? { ...s, marksObtained: Math.max(0, Math.min(5, marks)) }
          : s
      )
    );
  };

  const updateStudentComment = (studentId: string, comments: string) => {
    setStudentScores((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, comments } : s))
    );
  };

  // --- Total Scores --- Always per-student: max 5
  // totalMarks is shown as a per-student score (not sum of all students)
  const avgMarks = studentScores.length > 0
    ? Math.round(studentScores.reduce((sum, s) => sum + s.marksObtained, 0) / studentScores.length)
    : 5;
  const totalMarks = 5;   // max per student is always 5
  const maxTotalMarks = 5;

  // --- Validation ---
  const validate = () => {
    if (!selectedTeamId) {
      setMessage({ type: 'error', text: 'Please select an assigned team.' });
      return false;
    }
    if (!selectedDeadlineId) {
      setMessage({ type: 'error', text: 'Please select a review milestone.' });
      return false;
    }
    if (scope === 'individual' && studentScores.length === 0) {
      setMessage({ type: 'error', text: 'No students found in the selected team.' });
      return false;
    }
    return true;
  };

  // --- Save / Publish ---
  const handleSave = (isPublished: boolean) => {
    if (!validate()) return;
    setSaving(true);
    setMessage(null);

    try {
      // Save one evaluation per student for the 0th review
      studentScores.forEach((s) => {
        store.saveEvaluation({
          deadlineId: selectedDeadlineId,
          deadlineTitle: selectedDeadline?.title,
          teamId: selectedTeamId,
          teamNumber: selectedTeam?.teamNumber,
          evaluatorId: user.id,
          evaluatorName: user.name,
          evaluationType: 'individual',
          studentId: s.studentId,
          studentName: s.studentName,
          studentUsn: s.studentUsn,
          criteriaScores: [
            {
              criterion: 'Problem Statement & Description',
              maxMarks: 5,
              marksObtained: s.marksObtained,
              comments: s.comments,
            },
          ],
          totalMarks: s.marksObtained,
          maxTotalMarks: 5,
          facultyComments: overallFeedback,
          isPublished,
        });
      });

      setPublished(isPublished);
      setMessage({
        type: 'success',
        text: isPublished
          ? `Marks published successfully to Group ${selectedTeam?.teamNumber}!`
          : `Draft saved for Group ${selectedTeam?.teamNumber}.`,
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to save evaluation. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Team &amp; Individual Evaluation Interface
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Grade assigned teams on Problem Statement &amp; Description (5 marks).
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
            <Lock className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-700">Assigned Team Evaluation Only</span>
          </div>
        </div>

        {/* ── Team / Deadline Selection ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Team */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Select Assigned Team
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => {
                  setSelectedTeamId(e.target.value);
                  setMessage(null);
                }}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {assignedTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    Sec {t.section} • Group {t.teamNumber} — {t.projectTitle}
                  </option>
                ))}
              </select>
            </div>

            {/* Deadline / Review */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Select Review Milestone
              </label>
              <select
                value={selectedDeadlineId}
                onChange={(e) => {
                  setSelectedDeadlineId(e.target.value);
                  setMessage(null);
                }}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {allDeadlines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* ── Evaluation Card ── */}
        {selectedTeamId && selectedDeadlineId && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Card Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider font-bold text-indigo-300">
                  {selectedDeadline?.title}
                </p>
                <h2 className="text-xl font-bold mt-1">
                  Rubric Scoring — Group {selectedTeam?.teamNumber}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Individual Student Evaluation (5 marks max each)
                </p>
              </div>
              <div className="text-center bg-indigo-600/30 border border-indigo-500/30 rounded-xl px-6 py-3">
                <span className="block text-xs text-indigo-200 uppercase font-bold mb-1">Max Per Student</span>
                <span className="text-3xl font-black">5</span>
                <span className="text-sm text-indigo-300"> marks</span>
              </div>
            </div>

            {/* ── INDIVIDUAL STUDENT ── */}
            <div className="p-6 space-y-4">
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-indigo-900">Problem Statement &amp; Description</p>
                    <p className="text-xs text-indigo-700 mt-1">Each student is graded individually out of 5 marks.</p>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Individual Student Marks
                </h3>

                {studentScores.map((s, i) => (
                  <div key={s.studentId} className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">

                      {/* Student info */}
                      <div className="lg:col-span-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                          {s.studentName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{s.studentName}</p>
                          <p className="text-xs font-mono text-slate-500">{s.studentUsn}</p>
                        </div>
                      </div>

                      {/* Max marks */}
                      <div className="lg:col-span-2">
                        <p className="text-xs font-semibold text-slate-500">Max Marks</p>
                        <p className="text-sm font-bold text-slate-800 mt-1">5</p>
                      </div>

                      {/* Marks awarded */}
                      <div className="lg:col-span-2">
                        <label className="text-xs font-semibold text-slate-500">Marks Awarded</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="number"
                            min={0}
                            max={5}
                            step={1}
                            value={s.marksObtained}
                            onChange={(e) => updateStudentMarks(s.studentId, Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-slate-500 font-bold">/ 5</span>
                        </div>
                      </div>

                      {/* Comment */}
                      <div className="lg:col-span-4">
                        <label className="text-xs font-semibold text-slate-500">Comment</label>
                        <input
                          type="text"
                          value={s.comments}
                          onChange={(e) => updateStudentComment(s.studentId, e.target.value)}
                          placeholder="Optional comment..."
                          className="w-full mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            {/* ── Overall Feedback ── */}
            <div className="border-t border-slate-200 p-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Overall Faculty Summary Feedback
              </label>
              <textarea
                rows={3}
                value={overallFeedback}
                onChange={(e) => setOverallFeedback(e.target.value)}
                placeholder="Provide constructive feedback, recommendations for next review..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* ── Message ── */}
            {message && (
              <div className="px-6 pb-4">
                <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {message.type === 'success'
                    ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                    : <AlertCircle className="w-4 h-4 shrink-0" />
                  }
                  {message.text}
                </div>
              </div>
            )}

            {/* ── Actions ── */}
            <div className="border-t border-slate-200 bg-slate-50 p-6 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving || published}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving || published}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold shadow-lg shadow-amber-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send className="w-4 h-4" />
                {published ? 'Published ✓' : 'Publish Marks to Students'}
              </button>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default function FacultyEvaluationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-500">Loading evaluation interface...</div>}>
      <FacultyEvaluationsContent />
    </Suspense>
  );
}
