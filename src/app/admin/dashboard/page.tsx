'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import Link from 'next/link';
import {
  Users, BookOpen, GraduationCap, UploadCloud,
  Award, Calendar, FileSpreadsheet, History, ShieldAlert, ArrowUpRight
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const students = store.getStudents();
  const faculty = store.getFaculty();
  const teams = store.getAllTeams();
  const submissions = store.getAllSubmissions();
  const deadlines = store.getAllDeadlines();
  const auditLogs = store.getAuditLogs();

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-200 text-xs font-bold mb-3 border border-rose-500/30">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>System Administration • Full System Access</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                PBL Portal Control Center
              </h1>
              <p className="text-xs text-rose-200 mt-1">
                Dayananda Sagar Academy of Technology & Management — CSE Department
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/admin/import"
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center space-x-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Import Excel Dataset</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Stats Cards Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{students.length}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Enrolled across Sec A-F</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Faculty Guides</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{faculty.length}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Assigned to project groups</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Project Teams</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{teams.length} Groups</h3>
              <p className="text-xs text-emerald-600 font-bold mt-0.5">Sections A, B, C, D, E, F</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Submissions</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{submissions.length}</h3>
              <p className="text-xs text-purple-600 font-bold mt-0.5">Uploaded deliverables</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <UploadCloud className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Quick Management Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/students"
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Student Management</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Create, edit, reset passwords, change sections, and assign student team memberships.
            </p>
          </Link>

          <Link
            href="/admin/faculty"
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <BookOpen className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-amber-600 transition" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Faculty Allocation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Manage faculty credentials, guide allocations, and monitor workload across sections.
            </p>
          </Link>

          <Link
            href="/admin/teams"
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <GraduationCap className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base">Team Configuration</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Create teams, assign guides, change project titles, and re-allocate members.
            </p>
          </Link>
        </div>

        {/* Audit Logs Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <History className="h-5 w-5 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-base">Recent Audit Log Events</h3>
            </div>
            <Link href="/admin/audit-logs" className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center space-x-1">
              <span>View Full Audit Log</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.slice(0, 5).map(log => (
              <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{log.action}</span>
                  <span className="text-slate-500 ml-2">by {log.userName} ({log.userRole})</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
