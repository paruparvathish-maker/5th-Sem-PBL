'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import {
  GraduationCap, BookOpen, Search, Plus, Edit, Users, CheckCircle2,
  RefreshCw, UploadCloud, Download, ExternalLink, FileCheck, Clock,
  FileX, AlertCircle, Sparkles, Filter, CheckCircle, ShieldAlert
} from 'lucide-react';
import { Team, SectionCode, ResearchPaperStatus } from '@/lib/types/pbl';
import { isExecutiveViewer, getIndustryPersonAccess, getIndustryExpertForTeam } from '@/lib/auth/roles';
import { downloadSubmissionFile, viewSubmissionFile, viewProofFile } from '@/lib/utils/download';

export default function AdminTeamsPage() {
  const { user } = useAuth();
  if (!user) return null;

  const isReadOnly = isExecutiveViewer(user);
  const industryAccess = getIndustryPersonAccess(user);

  const initialTab: 4 | 5 = (industryAccess.isIndustry && industryAccess.allowedSemesters.length === 1)
    ? (industryAccess.allowedSemesters[0] as 4 | 5)
    : (industryAccess.isIndustry && industryAccess.allowedSemesters.includes(4) && !industryAccess.allowedSemesters.includes(5))
      ? 4
      : 5;

  const [activeTab, setActiveTab] = useState<4 | 5>(initialTab);
  const [teams, setTeams] = useState<Team[]>(store.getAllTeams());
  const [facultyList, setFacultyList] = useState(store.getFaculty());
  const [isSyncing, setIsSyncing] = useState(true);

  React.useEffect(() => {
    store.syncFromSupabase().then(() => {
      setTeams([...store.getAllTeams()]);
      setFacultyList([...store.getFaculty()]);
      setIsSyncing(false);
    });
  }, []);

  // Open the semester that actually holds submitted research papers, so uploaded
  // proofs are visible on first load instead of hidden behind the other tab.
  React.useEffect(() => {
    if (isSyncing) return;
    const all = store.getAllTeams();
    const canView4 = !industryAccess.isIndustry || industryAccess.allowedSemesters.includes(4);
    const hasPapers4 = all.some(
      (t) => (t.semester || 5) === 4 && Boolean(t.researchPaperProofName || t.researchPaperProofPath)
    );
    const hasWork5 = all.some((t) => (t.semester || 5) === 5 && store.getSubmissionsForTeam(t.id).length > 0);
    if (canView4 && activeTab === 5 && hasPapers4 && !hasWork5) {
      setActiveTab(4);
    }
  }, [isSyncing, activeTab, industryAccess.isIndustry]);

  const handleTabChange = (tab: 4 | 5) => {
    if (industryAccess.isIndustry && !industryAccess.allowedSemesters.includes(tab)) return;
    setActiveTab(tab);
    setTeams([...store.getAllTeams()]);
    setFacultyList([...store.getFaculty()]);
    setSelectedSection('ALL');
    setProofFilter('ALL');
    setFacultyFilter('ALL');
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await store.syncFromSupabase();
    setTeams([...store.getAllTeams()]);
    setFacultyList([...store.getFaculty()]);
    setIsSyncing(false);
    setMessage('Synchronized with latest cloud updates.');
    setTimeout(() => setMessage(null), 3500);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [facultyFilter, setFacultyFilter] = useState<string>('ALL');
  const [proofFilter, setProofFilter] = useState<'ALL' | 'SUBMITTED' | 'PENDING'>('ALL');
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

  const allowedSectionsForActiveTab: string[] = industryAccess.isIndustry
    ? (industryAccess.allowedSectionsBySemester[activeTab] || [])
    : ['A', 'B', 'C', 'D', 'E', 'F'];

  const currentTabTeams = teams.filter(t => {
    if ((t.semester || 5) !== activeTab) return false;
    if (industryAccess.isIndustry && !allowedSectionsForActiveTab.includes(t.section)) return false;
    return true;
  });

  // 4th Sem summary metrics (scoped to assigned sections for industry experts)
  const sem4AllowedSections = industryAccess.isIndustry
    ? (industryAccess.allowedSectionsBySemester[4] || [])
    : ['A', 'B', 'C', 'D', 'E', 'F'];

  const isSem4Submitted = (t: Team) => Boolean(t.researchPaperProofName || t.researchPaperProofPath || (t.researchPaperStatus && t.researchPaperStatus !== 'submitted'));

  const sem4AllTeams = teams.filter(t => (t.semester || 5) === 4 && (!industryAccess.isIndustry || sem4AllowedSections.includes(t.section)));
  const sem4SubmittedCount = sem4AllTeams.filter(isSem4Submitted).length;
  const sem4PendingCount = sem4AllTeams.length - sem4SubmittedCount;

  const sem5AllowedSections = industryAccess.isIndustry
    ? (industryAccess.allowedSectionsBySemester[5] || [])
    : ['A', 'B', 'C', 'D', 'E', 'F'];

  const sem5AllTeams = teams.filter(t => (t.semester || 5) === 5 && (!industryAccess.isIndustry || sem5AllowedSections.includes(t.section)));
  const sem5SubmittedCount = sem5AllTeams.filter(t => store.getSubmissionsForTeam(t.id).length > 0).length;
  const sem5PendingCount = sem5AllTeams.length - sem5SubmittedCount;

  // Unique faculty guides in current semester view
  const uniqueGuides = Array.from(
    new Set(currentTabTeams.map(t => t.guideName).filter(Boolean))
  ).sort() as string[];

  // Filtered teams based on search, section, faculty, and proof / submission filter
  const filteredTeams = currentTabTeams.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      t.teamNumber.toLowerCase().includes(q) ||
      t.projectTitle.toLowerCase().includes(q) ||
      (t.guideName && t.guideName.toLowerCase().includes(q)) ||
      (t.researchPaperProofName && t.researchPaperProofName.toLowerCase().includes(q)) ||
      t.members?.some(m =>
        m.name.toLowerCase().includes(q) ||
        (m.usn && m.usn.toLowerCase().includes(q))
      );

    const matchesSection = selectedSection === 'ALL' || t.section === selectedSection;
    const matchesFaculty = facultyFilter === 'ALL' || t.guideName === facultyFilter;

    const has4thProof = isSem4Submitted(t);
    const has5thSubmission = store.getSubmissionsForTeam(t.id).length > 0;
    const isSubmitted = (t.semester || 5) === 4 ? has4thProof : has5thSubmission;

    const matchesProof =
      proofFilter === 'ALL' ||
      (proofFilter === 'SUBMITTED' && isSubmitted) ||
      (proofFilter === 'PENDING' && !isSubmitted);

    return matchesSearch && matchesSection && matchesFaculty && matchesProof;
  });

  const submittedFiltered = filteredTeams.filter(isSem4Submitted);
  const pendingFiltered = filteredTeams.filter(t => !isSem4Submitted(t));

  const submitted5thFiltered = filteredTeams.filter(t => store.getSubmissionsForTeam(t.id).length > 0);
  const pending5thFiltered = filteredTeams.filter(t => store.getSubmissionsForTeam(t.id).length === 0);

  const handleOpenAddModal = () => {
    if (isReadOnly) return;
    setEditingTeam(null);
    setTeamNumber('A18');
    setSection('A');
    setProjectTitle('');
    setProjectDescription('');
    setGuideId(facultyList[0]?.id || '');
    setShowModal(true);
  };

  const handleOpenEditModal = (t: Team) => {
    if (isReadOnly) return;
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
    if (isReadOnly) return;
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
    const headers = activeTab === 4
      ? ['Semester', 'Section', 'Group Number', 'Assigned Faculty Guide', 'Paper Status', 'Proof Document Uploaded', 'Proof File Name']
      : ['Semester', 'Section', 'Group Number', 'Project Title', 'Assigned Guide', 'Member Count'];

    const rows = filteredTeams.map(t => activeTab === 4 ? [
      4,
      t.section,
      t.teamNumber,
      `"${(t.guideName || 'Unassigned').replace(/"/g, '""')}"`,
      t.researchPaperStatus || 'submitted',
      Boolean(t.researchPaperProofName || t.researchPaperProofPath) ? 'YES' : 'NO',
      `"${(t.researchPaperProofName || 'None').replace(/"/g, '""')}"`
    ] : [
      5,
      t.section,
      t.teamNumber,
      `"${t.projectTitle.replace(/"/g, '""')}"`,
      `"${(t.guideName || 'Unassigned').replace(/"/g, '""')}"`,
      t.members?.length || 0
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

  // Helper renderer for a single team card
  const renderTeamCard = (t: Team, isProofSubmitted: boolean) => {
    const submissions = store.getSubmissionsForTeam(t.id);
    const hasSubmission = submissions.length > 0;
    const isSubmitted = (t.semester || 5) === 4 ? isProofSubmitted : hasSubmission;

    return (
      <div
        key={t.id}
        className={`bg-white rounded-2xl border p-6 shadow-sm space-y-4 transition flex flex-col justify-between ${
          isSubmitted
            ? 'border-emerald-200 hover:border-emerald-400 hover:shadow-md'
            : 'border-amber-200 hover:border-amber-400 hover:shadow-md'
        }`}
      >
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-black text-xs uppercase">
              Sec {t.section} • Group {t.teamNumber}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {(t.semester || 5) === 5 && (
                isSubmitted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Deliverable Submitted</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pending Submission</span>
                  </span>
                )
              )}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                activeTab === 4 && !isProofSubmitted
                  ? 'text-amber-800 bg-amber-50 border-amber-300'
                  : 'text-slate-700 bg-slate-50 border-slate-200'
              }`}>
                Guide: <span className="font-extrabold text-slate-900">{t.guideName || 'Unassigned'}</span>
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg border text-indigo-800 bg-indigo-50 border-indigo-200">
                Industry: <span className="font-extrabold text-indigo-950">{t.industryExpertName || getIndustryExpertForTeam(t.semester || 5, t.section)?.name || 'Industry Expert'}</span>
              </span>
            </div>
          </div>

          {/* 4th Sem Research Paper Details */}
          {activeTab === 4 ? (
            <div className={`p-4 rounded-xl border space-y-3 ${
              isProofSubmitted
                ? 'bg-emerald-50/40 border-emerald-200'
                : 'bg-amber-50/40 border-amber-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Paper Status:</span>
                {getStatusBadge(t.researchPaperStatus)}
              </div>

              {isProofSubmitted ? (
                <div className="pt-2 border-t border-emerald-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-emerald-800">
                    <span className="flex items-center gap-1.5 font-bold truncate max-w-[240px]">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{t.researchPaperProofName || 'Proof Document'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => viewProofFile(t.researchPaperProofPath, t.researchPaperProofName, t.id)}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm flex items-center gap-1 shrink-0 transition cursor-pointer"
                      title="Open proof document or image in new tab"
                    >
                      <span>View Proof</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  {t.researchPaperUpdatedAt && (
                    <p className="text-[10px] text-emerald-700 font-medium">
                      Uploaded on {new Date(t.researchPaperUpdatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs text-amber-800">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Proof Pending: Awaiting Faculty Upload</span>
                  </span>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                    Not Uploaded
                  </span>
                </div>
              )}
            </div>
          ) : (
            <>
              <h3 className="font-extrabold text-slate-900 text-base leading-snug">{t.projectTitle}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{t.projectDescription}</p>
            </>
          )}

          {/* Roster */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Team Roster ({t.members?.length || 0} Students)
            </h4>
            <div className="grid grid-cols-1 gap-1">
              {t.members?.map(m => (
                <div key={m.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-800">{m.name}</span>
                  <span className="font-mono text-slate-500 text-[11px]">{m.usn}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5th Sem Submissions */}
          {activeTab === 5 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Submissions ({submissions.length})</h4>
              <div className="grid grid-cols-1 gap-1.5">
                {submissions.length === 0 && (
                  <p className="text-xs text-slate-400 p-2 text-center">No submissions yet.</p>
                )}
                {submissions.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 gap-2">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-slate-800 truncate">{sub.fileName}</span>
                      <span className="text-[10px] text-slate-500">v{sub.version} • {new Date(sub.submissionTime).toLocaleDateString()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => viewSubmissionFile(sub)}
                      className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold text-[11px] flex items-center space-x-1 transition shrink-0 shadow-sm cursor-pointer"
                      title="Open submission document in new tab"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>View Document</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card Footer Actions - Admin only */}
        {!isReadOnly && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={() => handleOpenEditModal(t)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 flex items-center space-x-1 transition"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Team Details</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Top Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Industrial PBL & Research Paper Control Center</h1>
            <p className="text-sm text-slate-600 mt-1">
              Audit 4th Sem faculty proof submissions and supervise 5th Sem Industrial PBL project milestones.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 shadow-sm"
              title="Refresh and sync data from backend"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Data'}</span>
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-md flex items-center space-x-2 transition"
            >
              <Download className="h-4 w-4" />
              <span>Export Audit Excel</span>
            </button>
            {!isReadOnly && (
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center space-x-2 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Create Team</span>
              </button>
            )}
          </div>
        </div>

        {/* Executive / Industry Observer Mode Notice */}
        {industryAccess.isIndustry ? (
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white border border-indigo-700 flex items-start gap-3 shadow-md">
            <div className="p-2 rounded-lg bg-indigo-700/80 text-amber-300 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <p className="font-extrabold text-sm text-amber-300">
                Industry Expert Supervision Portal — {industryAccess.industryName}
              </p>
              <p className="text-indigo-100 mt-1 leading-relaxed">
                Logged in as designated Industry Expert. Assigned Supervision Scope: <span className="font-bold text-white underline">
                  {Object.entries(industryAccess.allowedSectionsBySemester).map(([sem, secs]) => `${sem}th Sem (Sections ${secs.join(', ')})`).join(' & ')}
                </span>.
                You have exclusive access to review submissions, project progress, and faculty verification documents for your assigned sections.
              </p>
            </div>
          </div>
        ) : isReadOnly ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 shadow-sm">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-extrabold text-amber-950">
                {(user.email === 'vp@dsatm.edu.in' || user.id === 'admin-hod')
                  ? `Vice Principal & HOD Supervisory Access (${user.name})`
                  : `Executive Observer Access (${user.name})`}
              </p>
              <p className="text-amber-800 mt-0.5 leading-relaxed">
                {(user.email === 'vp@dsatm.edu.in' || user.id === 'admin-hod')
                  ? 'Full institutional supervision access to check the status of 4th Semester Research Papers (proof uploads, review status) and 5th Semester Industrial PBL Projects across Sections A through F.'
                  : 'You have read-only supervision access to 4th Semester Research Papers and 5th Semester PBL Projects. Data modifications, deletions, and deadline configurations are strictly restricted to the Main Administrator account.'}
              </p>
            </div>
          </div>
        ) : null}

        {/* Semester Toggle Navigation */}
        {(!industryAccess.isIndustry || industryAccess.allowedSemesters.length > 1) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(!industryAccess.isIndustry || industryAccess.allowedSemesters.includes(4)) && (
              <button
                onClick={() => handleTabChange(4)}
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
                    {activeTab === 4 && <span className="text-[10px] uppercase font-bold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">Active View</span>}
                  </div>
                  <p className={`text-xs mt-0.5 ${activeTab === 4 ? 'text-indigo-200' : 'text-slate-500'}`}>
                    Audit document/image proof submissions & monitor pending faculty uploads ({sem4SubmittedCount} Uploaded / {sem4PendingCount} Pending)
                  </p>
                </div>
              </button>
            )}

            {(!industryAccess.isIndustry || industryAccess.allowedSemesters.includes(5)) && (
              <button
                onClick={() => handleTabChange(5)}
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
                    {activeTab === 5 && <span className="text-[10px] uppercase font-bold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">Active View</span>}
                  </div>
                  <p className={`text-xs mt-0.5 ${activeTab === 5 ? 'text-slate-300' : 'text-slate-500'}`}>
                    Supervise project titles, guide reviews, deliverables, and student evaluation marks
                  </p>
                </div>
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-900 text-amber-400">
                {activeTab === 4 ? <BookOpen className="h-6 w-6" /> : <GraduationCap className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {activeTab === 4 ? '4th Semester Research Papers' : '5th Semester PBL Projects'}
                </h3>
                <p className="text-xs text-slate-500">
                  Assigned Sections: <span className="font-bold text-slate-800">{allowedSectionsForActiveTab.map(s => `${activeTab}${s}`).join(', ')}</span>
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {currentTabTeams.length} Assigned Teams
            </span>
          </div>
        )}

        {/* 4th Sem Metric Filter Cards */}
        {activeTab === 4 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setProofFilter('ALL')}
              className={`p-5 rounded-2xl border text-left transition-all ${
                proofFilter === 'ALL'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400/30'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">All 4th Sem Groups</span>
                <BookOpen className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-black mt-2">{sem4AllTeams.length}</p>
              <p className="text-[11px] mt-1 opacity-80">All research paper teams across Sections A-F</p>
            </button>

            <button
              onClick={() => setProofFilter('SUBMITTED')}
              className={`p-5 rounded-2xl border text-left transition-all ${
                proofFilter === 'SUBMITTED'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/30'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">Proof Uploaded (Doc / Img)</span>
                <FileCheck className={`w-5 h-5 ${proofFilter === 'SUBMITTED' ? 'text-white' : 'text-emerald-600'}`} />
              </div>
              <p className="text-3xl font-black mt-2 text-emerald-600 sm:text-inherit">{sem4SubmittedCount}</p>
              <p className="text-[11px] mt-1 opacity-80">Faculty uploaded verification document / image</p>
            </button>

            <button
              onClick={() => setProofFilter('PENDING')}
              className={`p-5 rounded-2xl border text-left transition-all ${
                proofFilter === 'PENDING'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400/30'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">Proof Pending Upload</span>
                <Clock className={`w-5 h-5 ${proofFilter === 'PENDING' ? 'text-white' : 'text-amber-600'}`} />
              </div>
              <p className="text-3xl font-black mt-2 text-amber-600 sm:text-inherit">{sem4PendingCount}</p>
              <p className="text-[11px] mt-1 opacity-80">Faculties awaiting proof upload</p>
            </button>
          </div>
        )}

        {/* 5th Sem Metric Filter Cards */}
        {activeTab === 5 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setProofFilter('ALL')}
              className={`p-5 rounded-2xl border text-left transition-all ${
                proofFilter === 'ALL'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400/30'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">All 5th Sem Groups</span>
                <GraduationCap className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-black mt-2">{sem5AllTeams.length}</p>
              <p className="text-[11px] mt-1 opacity-80">All Industrial PBL teams across Sections A-F</p>
            </button>

            <button
              onClick={() => setProofFilter('SUBMITTED')}
              className={`p-5 rounded-2xl border text-left transition-all ${
                proofFilter === 'SUBMITTED'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/30'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">Deliverables Submitted</span>
                <FileCheck className={`w-5 h-5 ${proofFilter === 'SUBMITTED' ? 'text-white' : 'text-emerald-600'}`} />
              </div>
              <p className="text-3xl font-black mt-2 text-emerald-600 sm:text-inherit">{sem5SubmittedCount}</p>
              <p className="text-[11px] mt-1 opacity-80">Teams uploaded Phase 1 Review Deliverables</p>
            </button>

            <button
              onClick={() => setProofFilter('PENDING')}
              className={`p-5 rounded-2xl border text-left transition-all ${
                proofFilter === 'PENDING'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400/30'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">Pending Submission</span>
                <Clock className={`w-5 h-5 ${proofFilter === 'PENDING' ? 'text-white' : 'text-amber-600'}`} />
              </div>
              <p className="text-3xl font-black mt-2 text-amber-600 sm:text-inherit">{sem5PendingCount}</p>
              <p className="text-[11px] mt-1 opacity-80">Teams awaiting deliverable upload</p>
            </button>
          </div>
        )}

        {message && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={
                  activeTab === 4
                    ? "Search by Group #, Faculty Guide Name, Student Name, or Proof File..."
                    : "Search 5th Sem by Group #, Guide Name, or Project Title..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Section Filter */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">
                {industryAccess.isIndustry
                  ? `All Assigned Sections (${allowedSectionsForActiveTab.map(s => `${activeTab}${s}`).join(', ')})`
                  : 'All Sections (A-F)'}
              </option>
              {allowedSectionsForActiveTab.map(secCode => (
                <option key={secCode} value={secCode}>
                  Section {secCode}
                </option>
              ))}
            </select>

            {/* Individual Faculty Guide Filter */}
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none max-w-xs"
            >
              <option value="ALL">All Faculty Guides ({uniqueGuides.length})</option>
              {uniqueGuides.map(guide => (
                <option key={guide} value={guide}>{guide}</option>
              ))}
            </select>
          </div>

          {/* Submission / Proof Status Buttons Filter */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 mr-1 uppercase">Filter Submission:</span>
              <button
                onClick={() => setProofFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  proofFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({activeTab === 4 ? sem4AllTeams.length : sem5AllTeams.length})
              </button>
              <button
                onClick={() => setProofFilter('SUBMITTED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  proofFilter === 'SUBMITTED'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>{activeTab === 4 ? `Proof Uploaded (${sem4SubmittedCount})` : `Deliverables Submitted (${sem5SubmittedCount})`}</span>
              </button>
              <button
                onClick={() => setProofFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  proofFilter === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{activeTab === 4 ? `Pending Upload (${sem4PendingCount})` : `Pending Submission (${sem5PendingCount})`}</span>
              </button>
            </div>

            {facultyFilter !== 'ALL' && (
              <div className="text-xs text-indigo-700 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1">
                <span>Filtered to: {facultyFilter}</span>
                <button onClick={() => setFacultyFilter('ALL')} className="text-indigo-400 hover:text-indigo-800 ml-1">✕</button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TEAMS CONTENT DISPLAY                                                     */}
        {/* ========================================================================= */}
        {activeTab === 4 ? (
          <div className="space-y-8">
            {/* SECTION 1: PROOFS UPLOADED (DOC / IMG) */}
            {(proofFilter === 'ALL' || proofFilter === 'SUBMITTED') && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-600 text-white">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-emerald-950">
                        Verified Proof Document & Image Submissions
                      </h3>
                      <p className="text-xs text-emerald-700">
                        Faculties who have uploaded verification documents, acceptance letters, or published paper proofs.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-xs shadow-sm self-start sm:self-auto">
                    {submittedFiltered.length} Teams Uploaded
                  </span>
                </div>

                {submittedFiltered.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                    <FileX className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">No proof documents match this filter.</p>
                    <p className="text-[11px] text-slate-400">Try clearing filters or checking pending submissions below.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {submittedFiltered.map(t => renderTeamCard(t, true))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: PROOFS PENDING FROM FACULTY */}
            {(proofFilter === 'ALL' || proofFilter === 'PENDING') && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-600 text-white">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-950">
                        Pending Proof Document Submissions (Faculty Upload Awaiting)
                      </h3>
                      <p className="text-xs text-amber-800">
                        Faculties assigned to these 4th semester teams have not yet uploaded proof files.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-600 text-white font-extrabold text-xs shadow-sm self-start sm:self-auto">
                    {pendingFiltered.length} Teams Pending
                  </span>
                </div>

                {pendingFiltered.length === 0 ? (
                  <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-emerald-800">Outstanding! All faculty guides in this selection have uploaded their proof documents.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pendingFiltered.map(t => renderTeamCard(t, false))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* 5TH SEMESTER PBL PROJECTS DISPLAY: SUBMITTED TEAMS AT TOP, PENDING TEAMS BELOW */
          <div className="space-y-8">
            {/* SECTION 1: 5TH SEMESTER DELIVERABLES SUBMITTED */}
            {(proofFilter === 'ALL' || proofFilter === 'SUBMITTED') && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-600 text-white">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-emerald-950">
                        Deliverables Submitted by Student Teams (1st Review Reports)
                      </h3>
                      <p className="text-xs text-emerald-700">
                        Teams who have successfully uploaded project reports, IEEE papers, or phase deliverables.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-xs shadow-sm self-start sm:self-auto">
                    {submitted5thFiltered.length} Teams Submitted
                  </span>
                </div>

                {submitted5thFiltered.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                    <FileX className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">No submitted deliverables match this filter.</p>
                    <p className="text-[11px] text-slate-400">Try adjusting section filters or check pending teams below.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {submitted5thFiltered.map(t => renderTeamCard(t, true))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: 5TH SEMESTER SUBMISSIONS PENDING */}
            {(proofFilter === 'ALL' || proofFilter === 'PENDING') && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-600 text-white">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-950">
                        Pending Deliverable Submissions (Student Team Upload Awaiting)
                      </h3>
                      <p className="text-xs text-amber-800">
                        These 5th semester teams have not yet uploaded their Phase 1 Review Report document.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-600 text-white font-extrabold text-xs shadow-sm self-start sm:self-auto">
                    {pending5thFiltered.length} Teams Pending
                  </span>
                </div>

                {pending5thFiltered.length === 0 ? (
                  <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-emerald-800">Outstanding! All teams in this selection have submitted their deliverables.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pending5thFiltered.map(t => renderTeamCard(t, false))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal for Creating / Editing Team */}
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
                      placeholder="e.g. A18"
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {activeTab === 4 ? 'Research Paper Title' : 'Project Title'}
                  </label>
                  <input
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Enter finalized title"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description / Problem Statement</label>
                  <textarea
                    rows={3}
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Enter description..."
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
