'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import { GraduationCap, BookOpen, Search, Plus, Edit, Users, CheckCircle2, UploadCloud, Download, ExternalLink, FileCheck } from 'lucide-react';
import { Team, SectionCode, ResearchPaperStatus } from '@/lib/types/pbl';

export default function AdminTeamsPage() {
  const { user } = useAuth();
  if (!user) return null;

  const [activeTab, setActiveTab] = useState<4 | 5>(4);
  const [teams, setTeams] = useState<Team[]>(store.getAllTeams());
  const facultyList = store.getFaculty();
  const [isSyncing, setIsSyncing] = useState(true);

  React.useEffect(() => {
    store.syncFromSupabase().then(() => {
      setTeams([...store.getAllTeams()]);
      setIsSyncing(false);
    });
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [message, setMessage] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [teamNumber, setTeamNumber] = useState('');
  const [section, setSection] = useState<SectionCode>('A');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [guideId, setGuideId] = useState(facultyList[0]?.id || '');

  const refreshData = () => {
    setTeams([...store.getAllTeams()]);
  };

  const currentTabTeams = teams.filter(t => (t.semester || 5) === activeTab);

  const filteredTeams = currentTabTeams.filter(t => {
    const matchesSearch = 
      t.teamNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.guideName && t.guideName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSection = selectedSection === 'ALL' || t.section === selectedSection;

    return matchesSearch && matchesSection;
  });

  const handleOpenAddModal = () => {
    setEditingTeam(null);
    setTeamNumber('A18');
    setSection('A');
    setProjectTitle('');
    setProjectDescription('');
    setGuideId(facultyList[0]?.id || '');
    setShowModal(true);
  };

  const handleOpenEditModal = (t: Team) => {
    setEditingTeam(t);
    setTeamNumber(t.teamNumber);
    setSection(t.section);
    setProjectTitle(t.projectTitle);
    setProjectDescription(t.projectDescription);
    setGuideId(t.guideId);
    setShowModal(true);
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const guideObj = facultyList.find(f => f.id === guideId);

    if (editingTeam) {
      store.updateTeam(editingTeam.id, {
        teamNumber,
        section,
        projectTitle,
        projectDescription,
        guideId,
        guideName: guideObj?.name,
        guideEmail: guideObj?.email
      });
      setMessage(`Updated team details for Group ${teamNumber}.`);
    } else {
      store.createTeam({
        teamNumber,
        section,
        semester: activeTab,
        projectTitle,
        projectDescription,
        guideId,
        guideName: guideObj?.name,
        guideEmail: guideObj?.email,
        members: []
      });
      setMessage(`Created new ${activeTab}th Sem Group ${teamNumber} in Section ${section}.`);
    }

    setShowModal(false);
    refreshData();
  };

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

  const exportToCSV = () => {
    const headers = ['Semester', 'Section', 'Group Number', 'Project Title / Paper', 'Research Paper Status', 'Guide Name'];
    const rows = filteredTeams.map(t => [
      t.semester || 5,
      t.section,
      t.teamNumber,
      `"${t.projectTitle.replace(/"/g, '""')}"`,
      t.researchPaperStatus || 'N/A',
      `"${(t.guideName || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `PBL_${activeTab}th_Sem_Teams_${selectedSection}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">PBL & Research Paper Control Center</h1>
            <p className="text-sm text-slate-600 mt-1">
              Separate 4th Semester Research Papers and 5th Semester PBL Project progress with assigned guides.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-lg shadow-slate-800/30 flex items-center space-x-2 w-fit transition"
            >
              <Download className="h-4 w-4" />
              <span>Export as Excel</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2 w-fit transition"
            >
              <Plus className="h-4 w-4" />
              <span>Create New {activeTab}th Sem Team</span>
            </button>
          </div>
        </div>

        {/* Semester Selection Tabs */}
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
                <span className="text-base font-black">4th Semester Research Papers</span>
                {activeTab === 4 && <span className="text-[10px] uppercase font-bold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">Active</span>}
              </div>
              <p className={`text-xs mt-0.5 ${activeTab === 4 ? 'text-indigo-200' : 'text-slate-500'}`}>
                Monitor status (Submitted/Accepted/Presented/Published/Rejected) & proof uploads
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
                <span className="text-base font-black">5th Semester PBL Projects</span>
                {activeTab === 5 && <span className="text-[10px] uppercase font-bold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">Active</span>}
              </div>
              <p className={`text-xs mt-0.5 ${activeTab === 5 ? 'text-slate-300' : 'text-slate-500'}`}>
                Monitor project titles, problem statements, guide meeting docs, and marks
              </p>
            </div>
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}th Sem by Group #, Guide Name, or Project Title...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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

        {/* Teams List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTeams.map(t => {
            const submissions = store.getSubmissionsForTeam(t.id);
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-emerald-300 transition flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-black text-xs uppercase">
                      Sec {t.section} • Group {t.teamNumber}
                    </span>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Guide: {t.guideName || 'Unassigned'}
                    </span>
                  </div>

                  {activeTab === 4 ? (
                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900">Research Paper Status:</span>
                        {getStatusBadge(t.researchPaperStatus)}
                      </div>
                      {t.researchPaperProofName ? (
                        <div className="flex items-center justify-between text-xs text-emerald-700 pt-1 border-t border-indigo-100">
                          <span className="flex items-center gap-1 font-bold">
                            <FileCheck className="w-3.5 h-3.5" /> Proof: {t.researchPaperProofName}
                          </span>
                          <a href={t.researchPaperProofPath || '#'} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-bold">View</a>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">No faculty proof document uploaded yet.</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">{t.projectTitle}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{t.projectDescription}</p>
                    </>
                  )}

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Roster ({t.members?.length || 0} Members)</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {t.members?.map(m => (
                        <div key={m.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="font-bold text-slate-800">{m.name}</span>
                          <span className="font-mono text-slate-500 text-[11px]">{m.usn}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {activeTab === 5 && (
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
                            <a href={sub.filePath} target="_blank" rel="noreferrer" className="text-emerald-600 font-bold text-[11px] hover:underline flex items-center space-x-1">
                              <UploadCloud className="h-3 w-3" />
                              <span>View</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => handleOpenEditModal(t)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs border border-indigo-200 flex items-center space-x-1"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit Team Configuration</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingTeam ? `Edit Group ${editingTeam.teamNumber}` : `Create New ${activeTab}th Sem Team`}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold">✕</button>
              </div>

              <form onSubmit={handleSaveTeam} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Group Number</label>
                    <input
                      type="text"
                      required
                      value={teamNumber}
                      onChange={(e) => setTeamNumber(e.target.value)}
                      placeholder="e.g. A1, B3"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Section</label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value as SectionCode)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                      <option value="E">Section E</option>
                      <option value="F">Section F</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Project Title / Topic</label>
                  <input
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. Smart Autonomous Garbage Sorting System"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Faculty Guide</label>
                  <select
                    value={guideId}
                    onChange={(e) => setGuideId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {facultyList.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
                  >
                    Save Team Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
