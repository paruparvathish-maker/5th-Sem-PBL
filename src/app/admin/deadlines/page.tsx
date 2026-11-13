'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import Link from 'next/link';
import { isExecutiveViewer } from '@/lib/auth/roles';
import {
  Calendar, Plus, Clock, Unlock, CheckCircle2, Trash2, Edit3,
  FileText, Search, Filter, ShieldCheck, ArrowDownToLine, Lock,
  AlertTriangle, RefreshCw, Eye, ExternalLink
} from 'lucide-react';
import { Deadline, DeadlineType, DeadlineStatus, SectionCode, Submission, Team } from '@/lib/types/pbl';
import { downloadSubmissionFile, viewSubmissionFile } from '@/lib/utils/download';

export default function AdminDeadlinesPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (isExecutiveViewer(user)) {
    return (
      <DashboardLayout>
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto space-y-4 my-12 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Deadline Configuration Restricted</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Deadline configuration and milestone adjustments are strictly restricted to the Main Administrator account.
            Executive leadership accounts (HOD, Principal, Industry Expert) have access to supervise 4th Sem Research Papers and 5th Sem PBL Projects.
          </p>
          <Link
            href="/admin/teams"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
          >
            Go to 4th &amp; 5th Sem Projects
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const [activeTab, setActiveTab] = useState<'deadlines' | 'submissions'>('deadlines');
  const [deadlines, setDeadlines] = useState<Deadline[]>(store.getAllDeadlines());
  const [submissions, setSubmissions] = useState<Submission[]>(store.getAllSubmissions());
  const [teams, setTeams] = useState<Team[]>(store.getAllTeams());

  // Search & Filter state for submissions
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('ALL');
  const [selectedDeadlineFilter, setSelectedDeadlineFilter] = useState('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditDeadlineModal, setShowEditDeadlineModal] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);

  const [showEditSubmissionModal, setShowEditSubmissionModal] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [selectedDeadlineId, setSelectedDeadlineId] = useState('');
  const [reopenTeamId, setReopenTeamId] = useState('');
  const [reopenMinutes, setReopenMinutes] = useState('60');

  // Form states for create
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineType, setDeadlineType] = useState<DeadlineType>('submission');
  const [dueDate, setDueDate] = useState('');

  // Form states for edit deadline
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<DeadlineType>('submission');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<DeadlineStatus>('open');

  // Form states for edit submission
  const [editSubStatus, setEditSubStatus] = useState<'submitted' | 'late' | 'reopened_submission'>('submitted');
  const [editSubLocked, setEditSubLocked] = useState<boolean>(true);
  const [editSubRemarks, setEditSubRemarks] = useState('');

  const [message, setMessage] = useState<string | null>(null);

  const refreshData = () => {
    setDeadlines([...store.getAllDeadlines()]);
    setSubmissions([...store.getAllSubmissions()]);
    setTeams([...store.getAllTeams()]);
  };

  useEffect(() => {
    refreshData();
    store.syncFromSupabase().then(() => {
      refreshData();
    });
  }, []);

  // --- Handlers: Deadlines ---
  const handleCreateDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    store.createDeadline({
      title,
      description,
      deadlineType,
      dueDate: new Date(dueDate).toISOString(),
      applicableSections: ['A', 'B', 'C', 'D', 'E', 'F'],
      submissionRequired: deadlineType === 'submission',
      status: 'open',
      createdBy: user.id
    });

    setMessage(`Deadline "${title}" configured successfully!`);
    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    refreshData();
  };

  const handleOpenEditDeadline = (d: Deadline) => {
    setEditingDeadline(d);
    setEditTitle(d.title);
    setEditDescription(d.description);
    setEditType(d.deadlineType);
    setEditDueDate(d.dueDate ? new Date(d.dueDate).toISOString().slice(0, 16) : '');
    setEditStatus((d.status as any) || 'open');
    setShowEditDeadlineModal(true);
  };

  const handleSaveEditDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeadline || !editTitle || !editDueDate) return;

    store.updateDeadline(editingDeadline.id, {
      title: editTitle,
      description: editDescription,
      deadlineType: editType,
      dueDate: new Date(editDueDate).toISOString(),
      status: editStatus,
      submissionRequired: editType === 'submission'
    });

    setMessage(`Deadline "${editTitle}" updated successfully!`);
    setShowEditDeadlineModal(false);
    setEditingDeadline(null);
    refreshData();
  };

  const handleDeleteDeadline = (id: string, name: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete the deadline "${name}"?\n\nThis will remove it from the system.`);
    if (!confirmed) return;

    store.deleteDeadline(id);
    setMessage(`Deadline "${name}" deleted.`);
    refreshData();
  };

  const handleReopenSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    const teamObj = teams.find(t => t.id === reopenTeamId);
    store.addAuditLog(user.id, user.name, user.role, 'Reopened Submission', 'Deadline', selectedDeadlineId, {
      teamId: reopenTeamId,
      teamNumber: teamObj?.teamNumber,
      extendedMinutes: reopenMinutes
    });
    setMessage(`Reopened submission window for Group ${teamObj?.teamNumber} for ${reopenMinutes} minutes.`);
    setShowReopenModal(false);
  };

  // --- Handlers: Submissions ---
  const handleOpenEditSubmission = (s: Submission) => {
    setEditingSubmission(s);
    setEditSubStatus(s.status || 'submitted');
    setEditSubLocked(s.isLocked !== false);
    setEditSubRemarks(s.remarks || '');
    setShowEditSubmissionModal(true);
  };

  const handleSaveEditSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubmission) return;

    store.updateSubmission(editingSubmission.id, {
      status: editSubStatus,
      isLocked: editSubLocked,
      remarks: editSubRemarks
    });

    setMessage(`Submission for Group ${editingSubmission.teamNumber || ''} updated successfully!`);
    setShowEditSubmissionModal(false);
    setEditingSubmission(null);
    refreshData();
  };

  const handleQuickUnlock = (subId: string, teamNum?: string) => {
    store.unlockSubmission(subId);
    setMessage(`Submission for Group ${teamNum || ''} unlocked. Students may now submit a revised document.`);
    refreshData();
  };

  const handleDeleteSubmission = (subId: string, fileName: string, teamNum?: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the submission "${fileName}" for Group ${teamNum}?\n\nThis will allow the team to upload a new document.`
    );
    if (!confirmed) return;

    store.deleteSubmission(subId);
    setMessage(`Submission "${fileName}" deleted successfully.`);
    refreshData();
  };

  // Filtered submissions
  const filteredSubmissions = submissions.filter(s => {
    const matchesSection = selectedSectionFilter === 'ALL' || s.section === selectedSectionFilter;
    const matchesDeadline = selectedDeadlineFilter === 'ALL' || s.deadlineId === selectedDeadlineFilter;
    const q = submissionSearch.toLowerCase();
    const matchesSearch = !q ||
      (s.teamNumber && s.teamNumber.toLowerCase().includes(q)) ||
      (s.projectTitle && s.projectTitle.toLowerCase().includes(q)) ||
      (s.fileName && s.fileName.toLowerCase().includes(q)) ||
      (s.studentName && s.studentName.toLowerCase().includes(q)) ||
      (s.studentUsn && s.studentUsn.toLowerCase().includes(q));

    return matchesSection && matchesDeadline && matchesSearch;
  });

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Deadlines & Submissions Control</h1>
            <p className="text-sm text-slate-600 mt-1">
              Configure milestone deadlines, edit cut-offs, and monitor, unlock, or delete student document submissions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                refreshData();
                store.syncFromSupabase().then(() => refreshData());
              }}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Refresh and sync"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Configure New Deadline</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-emerald-700 font-bold ml-4">✕</button>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('deadlines')}
            className={`pb-3 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'deadlines'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Activity Deadlines</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-black">
              {deadlines.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`pb-3 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'submissions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Student Submissions</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black">
              {submissions.length}
            </span>
          </button>
        </div>

        {/* ════════ TAB 1: DEADLINES LIST ════════ */}
        {activeTab === 'deadlines' && (
          <div className="space-y-4">
            {deadlines.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700">No deadlines configured.</p>
                <p className="text-xs text-slate-400 mt-1">Click "Configure New Deadline" above to add one.</p>
              </div>
            ) : (
              deadlines.map(d => {
                const due = new Date(d.dueDate);
                const isPassed = new Date() > due;

                return (
                  <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          d.deadlineType === 'submission' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {d.deadlineType}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPassed ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isPassed ? 'Locked' : 'Open'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Sections: {d.applicableSections?.join(', ') || 'All'}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-base">{d.title}</h3>
                      <p className="text-xs text-slate-500 max-w-xl">{d.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <div className="text-right mr-2">
                        <span className="text-xs font-bold text-slate-800 block">
                          📅 {due.toLocaleDateString()}
                        </span>
                        <span className="text-[11px] text-indigo-600 font-semibold">
                          ⏰ {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Modify Button */}
                      <button
                        onClick={() => handleOpenEditDeadline(d)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteDeadline(d.id, d.title)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition border border-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>

                      {/* Reopen Button */}
                      {isPassed && d.submissionRequired && (
                        <button
                          onClick={() => {
                            setSelectedDeadlineId(d.id);
                            setShowReopenModal(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center space-x-1"
                        >
                          <Unlock className="h-3.5 w-3.5" />
                          <span>Re-open</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ════════ TAB 2: SUBMISSIONS LIST ════════ */}
        {activeTab === 'submissions' && (
          <div className="space-y-4">

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by team number, student, USN, or file name..."
                  value={submissionSearch}
                  onChange={(e) => setSubmissionSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Section filter */}
                <select
                  value={selectedSectionFilter}
                  onChange={(e) => setSelectedSectionFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="ALL">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                  <option value="E">Section E</option>
                  <option value="F">Section F</option>
                </select>

                {/* Deadline filter */}
                <select
                  value={selectedDeadlineFilter}
                  onChange={(e) => setSelectedDeadlineFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 max-w-[200px]"
                >
                  <option value="ALL">All Deadlines</option>
                  {deadlines.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submissions List */}
            {filteredSubmissions.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700">No submissions found matching criteria.</p>
                <p className="text-xs text-slate-400 mt-1">Uploaded reports from student teams will appear here automatically.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubmissions.map(s => {
                  const subTeam = teams.find(t => t.id === s.teamId);
                  const isLocked = s.isLocked !== false;

                  return (
                    <div
                      key={s.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-indigo-200 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white">
                            Group {s.teamNumber || subTeam?.teamNumber || 'N/A'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Sec {s.section || subTeam?.section || '5th'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {s.deadlineTitle || '1st Review Report'}
                          </span>
                          {isLocked ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Lock className="w-2.5 h-2.5" /> Locked
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Unlock className="w-2.5 h-2.5" /> Reopened
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {s.projectTitle || subTeam?.projectTitle || 'DSATM PBL Project'}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Guide: <strong className="text-slate-700">{subTeam?.guideName || 'Faculty Guide'}</strong>
                          </p>
                        </div>

                        {/* File summary */}
                        <div className="flex items-center gap-3 pt-1 text-xs text-slate-600">
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            {s.fileName}
                          </span>
                          <span>•</span>
                          <span>{formatFileSize(s.fileSize)}</span>
                          <span>•</span>
                          <span>Submitted by: <strong>{s.studentName || 'Student'}</strong> ({new Date(s.submissionTime).toLocaleDateString()})</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                        {/* Download / View */}
                        <button
                          type="button"
                          onClick={() => viewSubmissionFile(s)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                          title="Open submission document in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Document</span>
                        </button>

                        {/* Quick Unlock */}
                        {isLocked ? (
                          <button
                            onClick={() => handleQuickUnlock(s.id, s.teamNumber)}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-xs flex items-center gap-1 transition"
                            title="Unlock to allow student to re-submit"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Unlock</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                            Unlocked
                          </span>
                        )}

                        {/* Modify / Edit */}
                        <button
                          onClick={() => handleOpenEditSubmission(s)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Modify</span>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteSubmission(s.id, s.fileName, s.teamNumber)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 transition border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════ MODAL: CREATE DEADLINE ════════ */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base">Configure Activity Deadline</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 font-bold">✕</button>
              </div>

              <form onSubmit={handleCreateDeadline} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deadline Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 1st Review Report"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deadline Type</label>
                  <select
                    value={deadlineType}
                    onChange={(e) => setDeadlineType(e.target.value as DeadlineType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="submission">Document Submission</option>
                    <option value="review">Review Evaluation</option>
                    <option value="meeting">Guide Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Deliverable requirements..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
                  >
                    Save Deadline
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ════════ MODAL: EDIT DEADLINE ════════ */}
        {showEditDeadlineModal && editingDeadline && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base">Modify Deadline</h3>
                <button onClick={() => setShowEditDeadlineModal(false)} className="text-slate-400 font-bold">✕</button>
              </div>

              <form onSubmit={handleSaveEditDeadline} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as DeadlineType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="submission">Document Submission</option>
                    <option value="review">Review Evaluation</option>
                    <option value="meeting">Guide Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Due Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as DeadlineStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="open">Open for Submissions</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="deadline_passed">Deadline Passed (Locked)</option>
                    <option value="evaluated">Evaluated</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditDeadlineModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ════════ MODAL: EDIT SUBMISSION ════════ */}
        {showEditSubmissionModal && editingSubmission && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Modify Submission</h3>
                  <p className="text-xs text-slate-500">Group {editingSubmission.teamNumber} • {editingSubmission.fileName}</p>
                </div>
                <button onClick={() => setShowEditSubmissionModal(false)} className="text-slate-400 font-bold">✕</button>
              </div>

              <form onSubmit={handleSaveEditSubmission} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Submission Status</label>
                  <select
                    value={editSubStatus}
                    onChange={(e) => setEditSubStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="late">Late Submission</option>
                    <option value="reopened_submission">Reopened / Resubmission Allowed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Locking State</label>
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      id="isLockedCheck"
                      checked={editSubLocked}
                      onChange={(e) => setEditSubLocked(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="isLockedCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Submission Locked (Uncheck to allow students to edit/re-upload)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Admin / Student Remarks</label>
                  <textarea
                    rows={3}
                    value={editSubRemarks}
                    onChange={(e) => setEditSubRemarks(e.target.value)}
                    placeholder="Enter any notes or review remarks..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditSubmissionModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
                  >
                    Update Submission
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ════════ MODAL: REOPEN DEADLINE WINDOW ════════ */}
        {showReopenModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base">Re-open Locked Submission</h3>
                <button onClick={() => setShowReopenModal(false)} className="text-slate-400 font-bold">✕</button>
              </div>

              <form onSubmit={handleReopenSubmission} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Target Team</label>
                  <select
                    value={reopenTeamId}
                    onChange={(e) => setReopenTeamId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="">Choose team...</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        Sec {t.section} • Group {t.teamNumber} ({t.projectTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Extension Duration (Minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="1440"
                    value={reopenMinutes}
                    onChange={(e) => setReopenMinutes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowReopenModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!reopenTeamId}
                    className="px-5 py-2 rounded-xl bg-amber-600 disabled:opacity-50 text-white font-bold text-xs shadow-md"
                  >
                    Authorize Re-open Window
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