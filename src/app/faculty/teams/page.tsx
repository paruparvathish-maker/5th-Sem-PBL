'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import { ResearchPaperStatus } from '@/lib/types/pbl';
import Link from 'next/link';
import {
  Users, Search, Filter, ShieldCheck, Award,
  FileText, Upload, CheckCircle2, Clock, Lock, AlertCircle,
  GraduationCap, BookOpen, FileCheck, ExternalLink, Check, Sparkles
} from 'lucide-react';

export default function FacultyTeamsPage() {
  const { user } = useAuth();
  if (!user) return null;

  const [activeTab, setActiveTab] = useState<4 | 5>(5);
  const [assignedTeams, setAssignedTeams] = useState(store.getTeamsByGuideId(user.id));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [isSyncing, setIsSyncing] = useState(true);

  React.useEffect(() => {
    store.syncFromSupabase().then(() => {
      setAssignedTeams([...store.getTeamsByGuideId(user.id)]);
      setIsSyncing(false);
    });
  }, [user.id]);

  // 5th Sem Edit State
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 4th Sem Paper Status State
  const [uploadingTeamId, setUploadingTeamId] = useState<string | null>(null);
  const [selectedPaperStatus, setSelectedPaperStatus] = useState<ResearchPaperStatus>('submitted');
  const [proofFileName, setProofFileName] = useState<string>('');

  const handleEditClick = (team: any) => {
    setEditingTeamId(team.id);
    setEditTitle(team.projectTitle === 'To Be Decided (TBD)' ? '' : team.projectTitle);
    setEditDesc(team.projectDescription || '');
  };

  const handleSaveEdit = async (teamId: string) => {
    if (!editTitle.trim() || !editDesc.trim()) {
      alert('Please fill out both the title and description.');
      return;
    }
    setIsSaving(true);
    store.updateTeamProjectDetails(teamId, editTitle, editDesc);
    await store.syncFromSupabase();
    setIsSaving(false);
    setEditingTeamId(null);
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
  };

  const handleSavePaperStatus = async (teamId: string) => {
    setIsSaving(true);
    const mockPath = proofFileName ? `/storage/proofs/${proofFileName}` : undefined;
    store.updateResearchPaperStatus(teamId, selectedPaperStatus, proofFileName || undefined, mockPath);
    await store.syncFromSupabase();
    setAssignedTeams([...store.getTeamsByGuideId(user.id)]);
    setIsSaving(false);
    setUploadingTeamId(null);
    setProofFileName('');
  };

  const currentTabTeams = assignedTeams.filter(t => (t.semester || 5) === activeTab);

  const filteredTeams = currentTabTeams.filter(t => {
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

  const getStatusBadge = (status?: ResearchPaperStatus) => {
    switch (status) {
      case 'published':
        return <span className="px-3 py-1 rounded-xl bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200">Published</span>;
      case 'accepted':
        return <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">Accepted</span>;
      case 'presented':
        return <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">Presented</span>;
      case 'rejected':
        return <span className="px-3 py-1 rounded-xl bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200">Rejected</span>;
      case 'submitted':
      default:
        return <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">Submitted</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Faculty Mentorship Portal</h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage 4th Semester Research Paper status & proof, or monitor 5th Semester PBL project titles and marks.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-bold">
            <ShieldCheck className="h-4 w-4" />
            <span>{currentTabTeams.length} {activeTab}th Sem Teams Assigned</span>
          </div>
        </div>

        {/* Semester Selection Icons / Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab(4)}
            className={`p-5 rounded-2xl border transition-all flex items-center gap-4 text-left ${
              activeTab === 4
                ? 'bg-gradient-to-r from-indigo-900 to-indigo-800 border-indigo-700 text-white shadow-lg ring-2 ring-indigo-500/20'
                : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50'
            }`}
          >
            <div className={`p-3 rounded-xl ${activeTab === 4 ? 'bg-indigo-700/50 text-amber-400' : 'bg-indigo-100 text-indigo-700'}`}>
              <BookOpen className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black">4th Semester</span>
                {activeTab === 4 && <span className="text-[10px] uppercase font-bold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">Active</span>}
              </div>
              <p className={`text-xs mt-0.5 ${activeTab === 4 ? 'text-indigo-200' : 'text-slate-500'}`}>
                Research Paper Status (Submitted / Accepted / Presented / Published / Rejected) & Proof Upload
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab(5)}
            className={`p-5 rounded-2xl border transition-all flex items-center gap-4 text-left ${
              activeTab === 5
                ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 text-white shadow-lg ring-2 ring-slate-500/20'
                : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50/50'
            }`}
          >
            <div className={`p-3 rounded-xl ${activeTab === 5 ? 'bg-slate-700/50 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black">5th Semester</span>
                {activeTab === 5 && <span className="text-[10px] uppercase font-bold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">Active</span>}
              </div>
              <p className={`text-xs mt-0.5 ${activeTab === 5 ? 'text-slate-300' : 'text-slate-500'}`}>
                PBL Teams, Project Titles, Problem Statements & Marks Evaluation
              </p>
            </div>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}th Sem by Group #, USN, Student Name...`}
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

        {/* 4th SEMESTER TEAMS VIEW */}
        {activeTab === 4 && (
          <div className="space-y-6">
            {filteredTeams.length === 0 && (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700">No 4th Semester teams found.</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search or section filter.</p>
              </div>
            )}

            {filteredTeams.map(t => {
              const currentStatus: ResearchPaperStatus = t.researchPaperStatus || 'submitted';

              return (
                <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-indigo-300 transition-all">
                  
                  {/* Header */}
                  <div className="bg-gradient-to-r from-indigo-950 to-indigo-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                          Sec {t.section} • Group {t.teamNumber}
                        </span>
                        <span className="text-[10px] font-bold bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded">4th Sem Research Paper</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-white mt-1">
                        Research Paper Team #{t.teamNumber}
                      </h3>
                      <p className="text-xs text-indigo-300 mt-0.5">
                        Guide: {t.guideName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {getStatusBadge(t.researchPaperStatus)}
                      <button
                        onClick={() => {
                          setUploadingTeamId(t.id);
                          setSelectedPaperStatus(t.researchPaperStatus || 'submitted');
                          setProofFileName(t.researchPaperProofName || '');
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Update Status & Proof</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left & Middle: Status & Proof Details */}
                    <div className="lg:col-span-2 space-y-4">
                      
                      {uploadingTeamId === t.id ? (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-4">
                          <h4 className="text-sm font-extrabold text-indigo-950 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" /> Update Research Paper Status & Proof Document
                          </h4>

                          <div>
                            <label className="block text-xs font-bold text-indigo-900 mb-1.5">Paper Status</label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {(['submitted', 'accepted', 'presented', 'published', 'rejected'] as ResearchPaperStatus[]).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => setSelectedPaperStatus(st)}
                                  className={`py-2 px-2 text-xs font-bold capitalize rounded-xl border transition-all ${
                                    selectedPaperStatus === st
                                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-100/50'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-indigo-900 mb-1">
                              Faculty Proof Document (Certificate / Acceptance Email / Paper PDF)
                            </label>
                            <input
                              type="file"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setProofFileName(e.target.files[0].name);
                                }
                              }}
                              className="w-full text-xs text-slate-600 bg-white p-2 rounded-xl border border-indigo-200 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                            />
                            {proofFileName && (
                              <p className="text-[11px] text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                                <FileCheck className="w-3.5 h-3.5" /> Selected: {proofFileName}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-200">
                            <button
                              onClick={() => setUploadingTeamId(null)}
                              disabled={isSaving}
                              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSavePaperStatus(t.id)}
                              disabled={isSaving}
                              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 shadow-sm disabled:opacity-50 flex items-center gap-1"
                            >
                              {isSaving ? 'Saving...' : 'Save & Publish Status'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Paper Status</span>
                            {getStatusBadge(t.researchPaperStatus)}
                          </div>
                          
                          <div className="pt-2 border-t border-slate-200">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Proof Document</span>
                            {t.researchPaperProofName ? (
                              <div className="mt-2 bg-white border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileCheck className="h-5 w-5 text-emerald-600" />
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{t.researchPaperProofName}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      Updated {t.researchPaperUpdatedAt ? new Date(t.researchPaperUpdatedAt).toLocaleDateString() : 'recently'}
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={t.researchPaperProofPath || '#'}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                                >
                                  View Proof <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic mt-1">
                                No proof document uploaded by faculty yet.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Right: Team Members */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">4th Sem Team Members ({t.members?.length || 0})</h4>
                      <div className="space-y-2">
                        {t.members?.map(m => (
                          <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                                {m.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800">{m.name}</p>
                                <p className="text-[10px] font-mono text-slate-500">{m.usn}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5th SEMESTER TEAMS VIEW */}
        {activeTab === 5 && (
          <div className="space-y-6">
            {filteredTeams.length === 0 && (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700">No 5th Semester teams found.</p>
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
                        
                        {!editingTeamId && (
                          <button
                            onClick={() => handleEditClick(t)}
                            className="ml-auto flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      {editingTeamId === t.id ? (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-indigo-900 mb-1">Project Title</label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full p-2 bg-white border border-indigo-200 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter project title..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-indigo-900 mb-1">Description</label>
                            <textarea
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              className="w-full p-2 bg-white border border-indigo-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-none"
                              placeholder="Enter project description..."
                            />
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(t.id)}
                              disabled={isSaving}
                              className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 shadow-sm disabled:opacity-50"
                            >
                              {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      ) : hasProjectDetails ? (
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
        )}

      </div>
    </DashboardLayout>
  );
}
