'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import Link from 'next/link';
import { Users, Search, Filter, ShieldCheck, Award, UploadCloud } from 'lucide-react';
import { SectionCode } from '@/lib/types/pbl';

export default function FacultyTeamsPage() {
  const { user } = useAuth();
  if (!user) return null;

  const assignedTeams = store.getTeamsByGuideId(user.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');

  const filteredTeams = assignedTeams.filter(t => {
    const matchesSearch = 
      t.teamNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.members?.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || (m.usn && m.usn.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesSection = selectedSection === 'ALL' || t.section === selectedSection;

    return matchesSearch && matchesSection;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Assigned PBL Teams</h1>
            <p className="text-sm text-slate-600 mt-1">
              Teams assigned to you for project guidance across sections (A-F).
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-bold">
            <ShieldCheck className="h-4 w-4" />
            <span>Strict Access Control Enabled</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Group #, USN, Student Name, or Project Title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="ALL">All Sections (A-F)</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
              <option value="E">Section E</option>
              <option value="F">Section F</option>
            </select>
          </div>
        </div>

        {/* Teams List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTeams.map(t => {
            const submissions = store.getSubmissionsForTeam(t.id);
            const evalList = store.getPublishedEvaluationsForTeam(t.id);

            return (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-300 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-extrabold text-xs uppercase">
                      Sec {t.section} • Group {t.teamNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      evalList.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {evalList.length > 0 ? 'Evaluated' : 'Evaluation Pending'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">{t.projectTitle}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{t.projectDescription}</p>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Team Members</h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {t.members?.map(m => (
                        <div key={m.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="font-bold text-slate-800">{m.name}</span>
                          <span className="font-mono text-slate-500 text-[11px]">{m.usn}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Submissions ({submissions.length})</h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {submissions.length === 0 && (
                        <p className="text-xs text-slate-400 p-2 text-center">No submissions yet.</p>
                      )}
                      {submissions.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 truncate max-w-[150px]">{sub.fileName}</span>
                            <span className="text-[10px] text-slate-500">v{sub.version} • {new Date(sub.submissionTime).toLocaleDateString()}</span>
                          </div>
                          <a href={sub.filePath} target="_blank" rel="noreferrer" className="text-amber-600 font-bold text-[11px] hover:underline flex items-center space-x-1">
                            <UploadCloud className="h-3 w-3" />
                            <span>View</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    📂 {submissions.length} Deliverables Submitted
                  </span>

                  <Link
                    href={`/faculty/evaluations?teamId=${t.id}`}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-1"
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>Grade Team</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </DashboardLayout>
  );
}
