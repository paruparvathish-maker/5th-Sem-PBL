'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import { GraduationCap, Search, Plus, Edit, UserCheck, Users, CheckCircle2, ShieldCheck, UploadCloud } from 'lucide-react';
import { Team, SectionCode, UserProfile } from '@/lib/types/pbl';

export default function AdminTeamsPage() {
  const { user } = useAuth();
  if (!user) return null;

  const [teams, setTeams] = useState<Team[]>(store.getAllTeams());
  const facultyList = store.getFaculty();
  const students = store.getStudents();

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

  const filteredTeams = teams.filter(t => {
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
        projectTitle,
        projectDescription,
        guideId,
        guideName: guideObj?.name,
        guideEmail: guideObj?.email,
        members: []
      });
      setMessage(`Created new PBL Group ${teamNumber} in Section ${section}.`);
    }

    setShowModal(false);
    refreshData();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">PBL Team & Guide Assignment Center</h1>
            <p className="text-sm text-slate-600 mt-1">
              Configure project teams, assign faculty guides, update project descriptions, and manage student team rosters.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2 w-fit"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Team</span>
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
              placeholder="Search team by Group #, Guide Name, or Project Title..."
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

                <h3 className="font-extrabold text-slate-900 text-base leading-snug">{t.projectTitle}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{t.projectDescription}</p>

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
          )})}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingTeam ? `Edit Group ${editingTeam.teamNumber}` : 'Create New PBL Team'}
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Project Title</label>
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Project Description</label>
                  <textarea
                    rows={2}
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Brief architectural overview..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
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
