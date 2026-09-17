'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import { useSearchParams } from 'next/navigation';
import { 
  Award, CheckCircle2, Save, Send, Users, User, 
  ShieldCheck, AlertCircle, ToggleLeft, ToggleRight 
} from 'lucide-react';
import { EvaluationCriterion } from '@/lib/types/pbl';

const DEFAULT_CRITERIA: EvaluationCriterion[] = [
  { criterion: 'Problem Statement & Description', maxMarks: 5, marksObtained: 5, comments: '' },
];

function FacultyEvaluationsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const preselectedTeamId = searchParams.get('teamId');

  if (!user) return null;

  const assignedTeams = store.getTeamsByGuideId(user.id);
  const deadlines = store.getAllDeadlines().filter(d => d.deadlineType === 'review' || d.deadlineType === 'submission');

  const [selectedTeamId, setSelectedTeamId] = useState(preselectedTeamId || assignedTeams[0]?.id || '');
  const [selectedDeadlineId, setSelectedDeadlineId] = useState(deadlines[0]?.id || '');
  const [evalType, setEvalType] = useState<'team' | 'individual'>('team');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const [criteria, setCriteria] = useState<EvaluationCriterion[]>(DEFAULT_CRITERIA);
  const [facultyComments, setFacultyComments] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeTeam = assignedTeams.find(t => t.id === selectedTeamId);
  const activeDeadline = deadlines.find(d => d.id === selectedDeadlineId);

  useEffect(() => {
    if (activeTeam && activeTeam.members && activeTeam.members.length > 0) {
      setSelectedStudentId(activeTeam.members[0].id);
    }
  }, [selectedTeamId, activeTeam]);

  useEffect(() => {
    setCriteria(DEFAULT_CRITERIA.map(c => ({ ...c })));
  }, [selectedDeadlineId]);

  const handleMarksChange = (idx: number, val: number) => {
    const updated = [...criteria];
    updated[idx].marksObtained = Math.min(updated[idx].maxMarks, Math.max(0, val));
    setCriteria(updated);
  };

  const handleCommentsChange = (idx: number, text: string) => {
    const updated = [...criteria];
    updated[idx].comments = text;
    setCriteria(updated);
  };

  const totalMarksObtained = criteria.reduce((sum, c) => sum + (Number(c.marksObtained) || 0), 0);
  const totalMaxMarks = criteria.reduce((sum, c) => sum + (Number(c.maxMarks) || 0), 0);

  const handleSaveEvaluation = (isPublished: boolean) => {
    if (!selectedTeamId || !selectedDeadlineId) {
      setMessage({ type: 'error', text: 'Please select both a team and a deadline review.' });
      return;
    }

    const studentObj = activeTeam?.members?.find(m => m.id === selectedStudentId);

    store.saveEvaluation({
      deadlineId: selectedDeadlineId,
      deadlineTitle: activeDeadline?.title,
      teamId: selectedTeamId,
      teamNumber: activeTeam?.teamNumber,
      evaluatorId: user.id,
      evaluatorName: user.name,
      evaluationType: evalType,
      studentId: evalType === 'individual' ? selectedStudentId : undefined,
      studentName: evalType === 'individual' ? studentObj?.name : undefined,
      studentUsn: evalType === 'individual' ? studentObj?.usn : undefined,
      criteriaScores: criteria,
      totalMarks: totalMarksObtained,
      maxTotalMarks: totalMaxMarks,
      facultyComments,
      isPublished
    });

    setMessage({
      type: 'success',
      text: `Evaluation ${isPublished ? 'PUBLISHED' : 'Saved as Draft'} successfully for Group ${activeTeam?.teamNumber}${evalType === 'individual' ? ` (${studentObj?.name})` : ''}!`
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Team & Individual Evaluation Interface</h1>
            <p className="text-sm text-slate-600 mt-1">
              Grade assigned teams using configurable rubric criteria. Support both team-level and individual student scores.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-bold">
            <ShieldCheck className="h-4 w-4" />
            <span>Assigned Team Evaluation Only</span>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 border ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* Selection Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Assigned Team
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => { setSelectedTeamId(e.target.value); setMessage(null); }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {assignedTeams.map(t => (
                <option key={t.id} value={t.id}>
                  Sec {t.section} • Group {t.teamNumber} ({t.projectTitle})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Review Milestone
            </label>
            <select
              value={selectedDeadlineId}
              onChange={(e) => { setSelectedDeadlineId(e.target.value); setMessage(null); }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {deadlines.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Evaluation Scope
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setEvalType('team')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
                  evalType === 'team' ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Team Level
              </button>
              <button
                type="button"
                onClick={() => setEvalType('individual')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
                  evalType === 'individual' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Individual Student
              </button>
            </div>
          </div>
        </div>

        {/* Individual Student Selector if applicable */}
        {evalType === 'individual' && activeTeam && (
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 flex items-center space-x-2">
              <User className="h-4 w-4 text-indigo-600" />
              <span>Select Student Member for Individual Evaluation:</span>
            </span>

            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="p-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-indigo-900 focus:outline-none"
            >
              {activeTeam.members?.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.usn})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Evaluation Rubric Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                Rubric Scoring Matrix — Group {activeTeam?.teamNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {evalType === 'individual' ? `Individual Evaluation for ${activeTeam?.members?.find(m=>m.id===selectedStudentId)?.name}` : 'Team Level Evaluation (Applies to all team members)'}
              </p>
            </div>

            <div className="text-right bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Total Score</span>
              <span className="text-2xl font-black text-amber-600">{totalMarksObtained}</span>
              <span className="text-xs text-slate-500"> / {totalMaxMarks}</span>
            </div>
          </div>

          <div className="space-y-4">
            {criteria.map((c, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="md:col-span-2">
                  <h4 className="font-bold text-slate-800 text-xs">{c.criterion}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Maximum Marks: {c.maxMarks}</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Marks Awarded</label>
                  <input
                    type="number"
                    min="0"
                    max={c.maxMarks}
                    step="0.5"
                    value={c.marksObtained}
                    onChange={(e) => handleMarksChange(idx, parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-indigo-600 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Criterion Comment</label>
                  <input
                    type="text"
                    placeholder="Optional feedback..."
                    value={c.comments || ''}
                    onChange={(e) => handleCommentsChange(idx, e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Overall Faculty Summary Feedback
            </label>
            <textarea
              rows={3}
              placeholder="Provide constructive feedback, recommendations for next review..."
              value={facultyComments}
              onChange={(e) => setFacultyComments(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleSaveEvaluation(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition"
            >
              <Save className="h-4 w-4" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveEvaluation(true)}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center space-x-1.5 transition"
            >
              <Send className="h-4 w-4" />
              <span>Publish Marks to Students</span>
            </button>
          </div>
        </div>

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
