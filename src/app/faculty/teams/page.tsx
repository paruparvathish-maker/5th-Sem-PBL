'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import Link from 'next/link';
import {
  Users, Search, Filter, ShieldCheck, Award,
  FileText, Upload, CheckCircle2, Clock, Lock, AlertCircle
} from 'lucide-react';

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
      t.members?.some(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.usn && m.usn.toLowerCase().includes(searchTerm.toLowerCase()))
      );
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
              Monitor 0th Review submissions — project details and guide meeting documents from your teams.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-bold">
            <ShieldCheck className="h-4 w-4" />
            <span>{assignedTeams.length} Teams Assigned</span>
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
        <div className="space-y-6">
          {filteredTeams.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700">No teams found.</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search or section filter.</p>
            </div>
          )}

          {filteredTeams.map(t => {
            const submissions = store.getSubmissionsForTeam(t.id);
            const evalList = store.getPublishedEvaluationsForTeam(t.id);

            const projectStmtSub = submissions.find(s => s.deadlineId === 'dl-project-stmt');
            const guideDocSub = submissions.find(s => s.deadlineId === 'dl-guide-meeting');

            const hasProjectDetails = t.projectTitle && t.projectTitle !== 'To Be Decided (TBD)';
            const hasGuideDoc = !!guideDocSub;

            return (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-amber-300 transition-all">

                {/* Team Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Sec {t.section} • Group {t.teamNumber}
                    </span>
                    <h3 className="text-lg font-extrabold text-white mt-0.5">
                      {hasProjectDetails ? t.projectTitle : 'Project Title Not Yet Submitted'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Guide: {t.guideName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {evalList.length > 0 ? (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-600/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Evaluated
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-600/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                        <Clock className="w-3 h-3" /> Awaiting Evaluation
                      </span>
                    )}
                    <Link
                      href={`/faculty/evaluations?teamId=${t.id}`}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1"
                    >
                      <Award className="h-3.5 w-3.5" />
                      <span>Grade Students</span>
                    </Link>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Submission 1: Project Statement */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Project Statement & Description</h4>
                      {hasProjectDetails ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          <Lock className="w-2.5 h-2.5" /> Submitted & Locked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          <AlertCircle className="w-2.5 h-2.5" /> Pending
                        </span>
                      )}
                    </div>

                    {hasProjectDetails ? (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-bold text-indigo-900">Project Title:</p>
                        <p className="text-sm font-extrabold text-indigo-800">{t.projectTitle}</p>
                        {t.projectDescription && (
                          <>
                            <p className="text-xs font-bold text-indigo-900 mt-2">Description:</p>
                            <p className="text-xs text-indigo-700 leading-relaxed">{t.projectDescription}</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                        Team has not yet submitted their project title and description.
                      </div>
                    )}

                    {/* Submission 2: Guide Meeting Doc */}
                    <div className="flex items-center gap-2 mt-4">
                      <Upload className="h-4 w-4 text-emerald-600" />
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">1st Guide Meeting Document</h4>
                      {hasGuideDoc ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          <Lock className="w-2.5 h-2.5" /> Uploaded & Locked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          <AlertCircle className="w-2.5 h-2.5" /> Pending
                        </span>
                      )}
                    </div>

                    {hasGuideDoc ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-emerald-900">{guideDocSub!.fileName}</p>
                          <p className="text-[10px] text-emerald-700 mt-0.5">
                            Uploaded by {guideDocSub!.studentName} • {new Date(guideDocSub!.submissionTime).toLocaleDateString()}
                          </p>
                        </div>
                        <a
                          href={guideDocSub!.filePath}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 font-bold text-xs hover:underline"
                        >
                          View File
                        </a>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                        Team has not yet uploaded their 1st guide meeting document.
                      </div>
                    )}
                  </div>

                  {/* Team Members Sidebar */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team Members ({t.members?.length || 0})</h4>
                    <div className="space-y-2">
                      {t.members?.map(m => {
                        const studentEval = evalList.find(e => e.studentId === m.id);
                        return (
                          <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                                  {m.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{m.name}</p>
                                  <p className="text-[10px] font-mono text-slate-500">{m.usn}</p>
                                </div>
                              </div>
                              {studentEval ? (
                                <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                  {studentEval.totalMarks}/5
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                  —/5
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </DashboardLayout>
  );
}
