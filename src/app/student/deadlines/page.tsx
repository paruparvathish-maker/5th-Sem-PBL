'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import Link from 'next/link';
import { Calendar, Clock, UploadCloud, CheckCircle2, Lock, ArrowRight, FileCheck } from 'lucide-react';
import { Deadline, Submission } from '@/lib/types/pbl';

export default function StudentDeadlinesPage() {
  const { user } = useAuth();
  if (!user) return null;

  const team = store.getTeamByStudentId(user.id);
  const [deadlines, setDeadlines] = useState<Deadline[]>(store.getDeadlinesForStudent(user.section));
  const [submissions, setSubmissions] = useState<Submission[]>(team ? store.getSubmissionsForTeam(team.id) : []);

  useEffect(() => {
    store.syncFromSupabase().then(() => {
      setDeadlines(store.getDeadlinesForStudent(user.section));
      if (team) {
        setSubmissions(store.getSubmissionsForTeam(team.id));
      }
    });
  }, [user.section, team?.id]);

  const now = new Date();

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Project Activity Deadlines</h1>
            <p className="text-sm text-slate-600 mt-1">
              Configured submission cut-offs, review dates, and report milestones for Section {user.section}.
            </p>
          </div>
          <Link
            href="/student/submissions"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 w-fit"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Go to Submission Portal</span>
          </Link>
        </div>

        {/* Deadlines List */}
        <div className="space-y-4">
          {deadlines.map(d => {
            const due = new Date(d.dueDate);
            const isPassed = now > due;
            const hoursLeft = Math.max(0, Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60)));
            const teamSub = team ? submissions.find(s => s.deadlineId === d.id || (d.id === 'dl-review-1' && s.deadlineTitle?.toLowerCase().includes('1st review'))) : undefined;
            const isSubmitted = !!teamSub;

            return (
              <div
                key={d.id}
                className={`p-6 rounded-2xl border transition-all ${
                  isSubmitted
                    ? 'bg-emerald-50/40 border-emerald-200 shadow-sm'
                    : isPassed
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        d.deadlineType === 'submission' ? 'bg-indigo-100 text-indigo-700' :
                        d.deadlineType === 'review' ? 'bg-amber-100 text-amber-800' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {d.deadlineType}
                      </span>

                      {isSubmitted ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Submitted & Locked
                        </span>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          isPassed ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isPassed ? 'Deadline Passed' : 'Open for Submission'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{d.title}</h3>
                    <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{d.description}</p>
                  </div>

                  <div className="text-left md:text-right shrink-0 bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl border md:border-none border-slate-200">
                    <div className="flex items-center space-x-1.5 md:justify-end text-slate-800 font-bold text-sm">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      <span>{due.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 md:justify-end text-xs text-indigo-600 font-semibold mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Due at {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {!isPassed && !isSubmitted && (
                      <span className="inline-block mt-2 px-2.5 py-1 rounded bg-amber-500/10 text-amber-700 text-[11px] font-bold">
                        ⏳ {hoursLeft} hours remaining
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Applicable to: <strong className="text-slate-700">{d.applicableSections?.join(', ') || 'All Sections'}</strong>
                  </span>
                  {d.submissionRequired && (
                    isSubmitted ? (
                      <Link
                        href={`/student/submissions?deadlineId=${d.id}`}
                        className="font-bold flex items-center space-x-1.5 text-emerald-700 hover:text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm"
                      >
                        <FileCheck className="h-3.5 w-3.5" />
                        <span>View Submission ({teamSub.fileName})</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <Link
                        href={`/student/submissions?deadlineId=${d.id}`}
                        className={`font-bold flex items-center space-x-1 ${
                          isPassed ? 'text-slate-400 pointer-events-none' : 'text-indigo-600 hover:text-indigo-800'
                        }`}
                      >
                        <span>{isPassed ? 'Upload Closed' : 'Upload Document'}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </DashboardLayout>
  );
}