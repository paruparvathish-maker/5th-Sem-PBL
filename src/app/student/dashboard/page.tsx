'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import Link from 'next/link';
import { 
  Users, Calendar, UploadCloud, Award, Clock, ArrowUpRight, 
  CheckCircle2, AlertTriangle, ShieldCheck, UserCheck, Bot 
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const team = store.getTeamByStudentId(user.id);
  const deadlines = store.getDeadlinesForStudent(user.section);
  const upcomingDeadlines = deadlines.filter(d => d.status === 'open' || d.status === 'upcoming');
  const meetings = team ? store.getMeetingsForTeam(team.id) : [];
  const submissions = team ? store.getSubmissionsForTeam(team.id) : [];
  const publishedEvaluations = team ? store.getPublishedEvaluationsForStudent(user.id, team.id) : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold mb-3 border border-indigo-500/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Authenticated Student • Section {user.section}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user.name}
              </h1>
              <p className="text-sm text-indigo-200 mt-1">
                USN: <span className="font-mono font-bold text-white">{user.usn}</span> • Team: <span className="font-bold text-white">{team?.teamNumber || 'Unassigned'}</span>
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/student/submissions"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Upload Submission</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Team</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">Group {team?.teamNumber || 'N/A'}</h3>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[160px]">{team?.projectTitle}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Guide</p>
              <h3 className="text-sm font-bold text-slate-800 mt-1 truncate max-w-[160px]">{team?.guideName || 'Pending'}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[160px]">{team?.guideEmail}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Deadlines</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{upcomingDeadlines.length} Active</h3>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">Next due soon</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Submissions</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1">{submissions.length} Uploaded</h3>
              <p className="text-xs text-indigo-600 font-medium mt-0.5">Latest v{submissions[0]?.version || 1}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Award className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Content Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Columns: Deadlines & Submissions */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800 text-base">Upcoming Activity Deadlines</h3>
                </div>
                <Link href="/student/deadlines" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1">
                  <span>View All</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {upcomingDeadlines.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No active deadlines at present.</p>
                ) : (
                  upcomingDeadlines.map(d => (
                    <div key={d.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                            {d.deadlineType}
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm">{d.title}</h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{d.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-700 block">
                          {new Date(d.dueDate).toLocaleDateString()}
                        </span>
                        <span className="text-[11px] text-amber-600 font-semibold">
                          {new Date(d.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Published Marks Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-amber-600" />
                  <h3 className="font-bold text-slate-800 text-base">Published Evaluation Marks</h3>
                </div>
                <Link href="/student/marks" className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center space-x-1">
                  <span>Full Scorecard</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {publishedEvaluations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No review marks published by your faculty guide yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {publishedEvaluations.map(ev => (
                    <div key={ev.id} className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{ev.deadlineTitle || 'Review Evaluation'}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Evaluated by {ev.evaluatorName}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-amber-600">{ev.totalMarks}</span>
                          <span className="text-xs text-slate-400 font-medium"> / {ev.maxTotalMarks}</span>
                        </div>
                      </div>
                      {ev.facultyComments && (
                        <p className="text-xs text-slate-600 mt-2 pt-2 border-t border-amber-500/10 italic">
                          "{ev.facultyComments}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Teammates & Guide Meetings */}
          <div className="space-y-6">
            
            {/* My Teammates */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center space-x-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <span>Team Members (Group {team?.teamNumber})</span>
              </h3>

              <div className="space-y-3">
                {team?.members?.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{m.name}</p>
                        <p className="text-[11px] font-mono text-slate-500">{m.usn}</p>
                      </div>
                    </div>
                    {m.id === user.id && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">You</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Guide Meetings */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <span>Guide Meetings</span>
              </h3>

              {meetings.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No scheduled guide meetings.</p>
              ) : (
                <div className="space-y-3">
                  {meetings.map(m => (
                    <div key={m.id} className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20">
                      <h4 className="font-bold text-slate-800 text-xs">{m.title}</h4>
                      <p className="text-[11px] text-purple-700 mt-1 font-semibold">
                        📅 {new Date(m.meetingDate).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">📍 {m.location}</p>
                      {m.agenda && (
                        <p className="text-[11px] text-slate-500 mt-1 pt-1 border-t border-purple-500/10">
                          {m.agenda}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
