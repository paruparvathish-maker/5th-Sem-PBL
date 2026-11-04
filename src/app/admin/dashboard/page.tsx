'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import Link from 'next/link';
import { isExecutiveViewer, getIndustryPersonAccess } from '@/lib/auth/roles';
import {
  Users, BookOpen, GraduationCap, UploadCloud,
  Award, Calendar, FileSpreadsheet, History, ShieldAlert, ArrowUpRight
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const isExec = isExecutiveViewer(user);
  const industryAccess = getIndustryPersonAccess(user);

  const rawStudents = store.getStudents();
  const rawFaculty = store.getFaculty();
  const rawTeams = store.getAllTeams();
  const rawSubmissions = store.getAllSubmissions();
  const deadlines = store.getAllDeadlines();
  const auditLogs = store.getAuditLogs();

  const teams = industryAccess.isIndustry
    ? rawTeams.filter(t => industryAccess.allAllowedSections.includes(t.section) && industryAccess.allowedSemesters.includes(t.semester || 5))
    : rawTeams;

  const scopedTeamIds = new Set(teams.map(t => t.id));

  const students = industryAccess.isIndustry
    ? rawStudents.filter(s => s.section && industryAccess.allAllowedSections.includes(s.section))
    : rawStudents;

  const faculty = industryAccess.isIndustry
    ? Array.from(new Set(teams.map(t => t.guideId).filter(Boolean)))
    : rawFaculty;

  const submissions = industryAccess.isIndustry
    ? rawSubmissions.filter(s => scopedTeamIds.has(s.teamId))
    : rawSubmissions;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Welcome Header */}
        <div className={`text-white rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden ${
          industryAccess.isIndustry
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900'
            : isExec
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900'
            : 'bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold mb-3 border ${
                industryAccess.isIndustry
                  ? 'bg-indigo-500/20 text-amber-300 border-indigo-500/30'
                  : isExec
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-200 border border-rose-500/30'
              }`}>
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>
                  {industryAccess.isIndustry
                    ? `Industry Expert Supervision • Scope: ${Object.entries(industryAccess.allowedSectionsBySemester).map(([sem, secs]) => `${sem}th Sem (${secs.join(', ')})`).join(' | ')}`
                    : isExec
                    ? 'Executive Leadership Supervision • Read-Only Review Mode'
                    : 'System Administration • Full System Access'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {industryAccess.isIndustry
                  ? `${industryAccess.industryName} — Industry Portal`
                  : isExec
                  ? 'PBL & Research Supervision Portal'
                  : 'PBL Portal Control Center'}
              </h1>
              <p className={`text-xs mt-1 ${isExec ? 'text-indigo-200' : 'text-rose-200'}`}>
                Dayananda Sagar Academy of Technology &amp; Management — CSE Department
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {isExec ? (
                <Link
                  href="/admin/teams"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>View Assigned Projects</span>
                </Link>
              ) : (
                <Link
                  href="/admin/import"
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center space-x-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Import Excel Dataset</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Executive & Industry Personnel Credentials Quick Reference (Super Admin Only) */}
        {!isExec && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> Executive Leadership &amp; Industry Expert Credentials
              </h3>
              <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">Official Accounts</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-slate-800">HOD (Dr. C Nandini)</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Scope: <span className="font-bold text-slate-700">All Sem 4 &amp; 5</span></p>
                <p className="text-slate-500 text-[11px]">Email: <span className="font-mono text-slate-700">hod.cse@dsatm.edu.in</span></p>
                <p className="text-slate-500 text-[11px]">Pass: <span className="font-mono font-bold text-indigo-700">HOD@CSE#2026</span></p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-slate-800">Principal Office</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Scope: <span className="font-bold text-slate-700">All Sem 4 &amp; 5</span></p>
                <p className="text-slate-500 text-[11px]">Email: <span className="font-mono text-slate-700">principal@dsatm.edu.in</span></p>
                <p className="text-slate-500 text-[11px]">Pass: <span className="font-mono font-bold text-indigo-700">DSATM@PRIN#984</span></p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-slate-800">Mr. Girish (Industry)</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Scope: <span className="font-bold text-indigo-700">4th Sem (4A, 4D)</span></p>
                <p className="text-slate-500 text-[11px]">Email: <span className="font-mono text-slate-700">girish.industry@dsatm.edu.in</span></p>
                <p className="text-slate-500 text-[11px]">Pass: <span className="font-mono font-bold text-indigo-700">9986765626</span></p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-slate-800">Mr. Raghu (Industry)</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Scope: <span className="font-bold text-indigo-700">4th Sem (4B, 4E)</span></p>
                <p className="text-slate-500 text-[11px]">Email: <span className="font-mono text-slate-700">raghu.industry@dsatm.edu.in</span></p>
                <p className="text-slate-500 text-[11px]">Pass: <span className="font-mono font-bold text-indigo-700">8123573747</span></p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-slate-800">Mr. Raja Shekhar (Industry)</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Scope: <span className="font-bold text-indigo-700">4C, 4F &amp; 5B, 5E</span></p>
                <p className="text-slate-500 text-[11px]">Email: <span className="font-mono text-slate-700">rajashekhar.industry@dsatm.edu.in</span></p>
                <p className="text-slate-500 text-[11px]">Pass: <span className="font-mono font-bold text-indigo-700">9964222260</span></p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-slate-800">Ms. Manasa S (Industry)</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Scope: <span className="font-bold text-indigo-700">5th Sem (5A, 5D)</span></p>
                <p className="text-slate-500 text-[11px]">Email: <span className="font-mono text-slate-700">manasa.industry@dsatm.edu.in</span></p>
                <p className="text-slate-500 text-[11px]">Pass: <span className="font-mono font-bold text-indigo-700">9108932557</span></p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-slate-800">Ms. Harshitha R (Industry)</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Scope: <span className="font-bold text-indigo-700">5th Sem (5C, 5F)</span></p>
                <p className="text-slate-500 text-[11px]">Email: <span className="font-mono text-slate-700">harshitha.industry@dsatm.edu.in</span></p>
                <p className="text-slate-500 text-[11px]">Pass: <span className="font-mono font-bold text-indigo-700">9611172433</span></p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-amber-200">
                <p className="font-extrabold text-slate-800">Main Admin</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Scope: <span className="font-bold text-rose-700">Full Access</span></p>
                <p className="text-slate-500 text-[11px]">Email: <span className="font-mono text-slate-700">paruparvathish@gmail.com</span></p>
                <p className="text-slate-500 text-[11px]">Pass: <span className="font-mono font-bold text-rose-700">03May@2002@</span></p>
              </div>
            </div>
          </div>
        )}

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

        {/* Quick Management / Supervision Links */}
        {isExec ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/admin/teams"
              className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">5th Semester PBL Projects</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Supervise project registrations, titles, faculty guides, student team rosters, and submitted deliverables across all sections.
              </p>
            </Link>

            <Link
              href="/admin/teams"
              className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  <BookOpen className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-amber-600 transition" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">4th Semester Research Papers</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Audit faculty research paper proof document/image uploads, check submitted vs pending groups, and inspect publication proofs.
              </p>
            </Link>
          </div>
        ) : (
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
        )}

        {/* Audit Logs Summary (Super Admin Only) */}
        {!isExec && (
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
        )}

      </div>
    </DashboardLayout>
  );
}
