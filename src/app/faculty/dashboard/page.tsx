'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import Link from 'next/link';
import { 
  Users, UploadCloud, Award, Calendar, Clock, 
  ArrowUpRight, ShieldCheck, CheckCircle2, FileText, UserCheck 
} from 'lucide-react';

export default function FacultyDashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  // Strict isolation: Faculty sees ONLY their assigned teams across all sections
  const assignedTeams = store.getTeamsByGuideId(user.id);
  const meetings = store.getMeetingsForFaculty(user.id);
  const allSubmissions = store.getAllSubmissions().filter(s => 
    assignedTeams.some(t => t.id === s.teamId)
  );

  const pendingEvaluationsCount = assignedTeams.length - store.getAllEvaluations().filter(e => 
    assignedTeams.some(t => t.id === e.teamId) && e.isPublished
  ).length;

  // Sections summary
  const sectionsList = Array.from(new Set(assignedTeams.map(t => t.section))).sort();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-semibold mb-3 border border-amber-500/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Faculty Guide Portal • Assigned Sections: {sectionsList.join(', ') || 'None'}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Welcome, {user.name}
              </h1>
              <p className="text-xs text-amber-200 mt-1">
                Institutional Email: <span className="font-semibold text-white">{user.email}</span>
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/faculty/evaluations"
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center space-x-2"
              >
                <Award className="h-4 w-4" />
                <span>Evaluate Teams</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Teams</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{assignedTeams.length} Groups</h3>
              <p className="text-xs text-slate-500 mt-0.5">Across Sec {sectionsList.join(', ')}</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Submissions Received</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{allSubmissions.length} Files</h3>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">Ready for review</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <UploadCloud className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Evaluations</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{Math.max(0, pendingEvaluationsCount)} Teams</h3>
              <p className="text-xs text-amber-600 font-semibold mt-0.5">Marks unpublished</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Award className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Guide Meetings</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{meetings.length} Scheduled</h3>
              <p className="text-xs text-purple-600 font-medium mt-0.5">Upcoming sessions</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Assigned Teams Table Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Your Assigned Teams Overview</h3>
              <p className="text-xs text-slate-500">You are restricted to evaluating only your assigned teams.</p>
            </div>
            <Link href="/faculty/teams" className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center space-x-1">
              <span>Manage Teams</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                  <th className="py-3 px-4 rounded-l-lg">Section</th>
                  <th className="py-3 px-4">Group #</th>
                  <th className="py-3 px-4">Project Title</th>
                  <th className="py-3 px-4">Teammates</th>
                  <th className="py-3 px-4 rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignedTeams.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">Sec {t.section}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-600">Group {t.teamNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">{t.projectTitle}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {t.members?.map(m => m.name.split(' ')[0]).join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/faculty/evaluations?teamId=${t.id}`}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-sm transition inline-block"
                      >
                        Grade Team
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
