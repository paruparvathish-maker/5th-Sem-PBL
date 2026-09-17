'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import { Award, CheckCircle2, ShieldCheck, FileSpreadsheet, Lock } from 'lucide-react';

export default function StudentMarksPage() {
  const { user } = useAuth();
  if (!user) return null;

  const team = store.getTeamByStudentId(user.id);
  const evaluations = team ? store.getPublishedEvaluationsForStudent(user.id, team.id) : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Published Review Marks & Scorecards</h1>
            <p className="text-sm text-slate-600 mt-1">
              Official published evaluation scores provided by your assigned faculty guide.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold">
            <ShieldCheck className="h-4 w-4" />
            <span>Strict Privacy: Restricted to your scores</span>
          </div>
        </div>

        {evaluations.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm max-w-lg mx-auto">
            <Award className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Published Marks Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your faculty guide has not published marks for your team's reviews yet. Check back after your review presentation.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {evaluations.map(ev => (
              <div key={ev.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                
                {/* Scorecard Header */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {ev.evaluationType === 'individual' ? 'Individual Student Evaluation' : 'Team Evaluation'}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1">{ev.deadlineTitle || 'Review Presentation'}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Evaluator: <strong className="text-white">{ev.evaluatorName}</strong> • Date: {new Date(ev.evaluatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="bg-indigo-600/30 border border-indigo-500/30 px-5 py-3 rounded-xl text-center">
                    <span className="text-xs text-indigo-200 font-semibold block uppercase">Total Score</span>
                    <span className="text-3xl font-black text-white">{ev.totalMarks}</span>
                    <span className="text-xs text-indigo-300"> / {ev.maxTotalMarks}</span>
                  </div>
                </div>

                {/* Criteria Table */}
                <div className="p-6">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
                    Evaluation Criteria Breakdown
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                          <th className="py-3 px-4 rounded-l-lg">Criterion</th>
                          <th className="py-3 px-4">Max Marks</th>
                          <th className="py-3 px-4">Marks Awarded</th>
                          <th className="py-3 px-4 rounded-r-lg">Faculty Comments</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ev.criteriaScores.map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-bold text-slate-800">{c.criterion}</td>
                            <td className="py-3 px-4 font-semibold text-slate-600">{c.maxMarks}</td>
                            <td className="py-3 px-4 font-bold text-indigo-600 text-sm">{c.marksObtained}</td>
                            <td className="py-3 px-4 text-slate-600 italic">{c.comments || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {ev.facultyComments && (
                    <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                      <strong className="text-amber-900 block mb-1">Overall Faculty Feedback:</strong>
                      <p className="text-slate-700 italic leading-relaxed">{ev.facultyComments}</p>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
