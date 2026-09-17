'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import { Calendar, Plus, Clock, Unlock, CheckCircle2 } from 'lucide-react';
import { DeadlineType, SectionCode } from '@/lib/types/pbl';

export default function AdminDeadlinesPage() {
  const { user } = useAuth();
  if (!user) return null;

  const [deadlines, setDeadlines] = useState(store.getAllDeadlines());
  const teams = store.getAllTeams();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [selectedDeadlineId, setSelectedDeadlineId] = useState('');
  const [reopenTeamId, setReopenTeamId] = useState(teams[0]?.id || '');
  const [reopenMinutes, setReopenMinutes] = useState('60');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadlineType, setDeadlineType] = useState<DeadlineType>('submission');
  const [dueDate, setDueDate] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const refreshData = () => {
    setDeadlines([...store.getAllDeadlines()]);
  };

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Deadline Configuration & Lock Management</h1>
            <p className="text-sm text-slate-600 mt-1">
              Create milestone cut-offs and override submission locks for specific project groups.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 w-fit"
          >
            <Plus className="h-4 w-4" />
            <span>Configure New Deadline</span>
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        {/* Deadlines Grid */}
        <div className="space-y-4">
          {deadlines.map(d => {
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
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base">{d.title}</h3>
                  <p className="text-xs text-slate-500 max-w-xl">{d.description}</p>
                </div>

                <div className="flex items-center space-x-4 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 block">
                      📅 {due.toLocaleDateString()}
                    </span>
                    <span className="text-[11px] text-indigo-600 font-semibold">
                      ⏰ {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {isPassed && d.submissionRequired && (
                    <button
                      onClick={() => {
                        setSelectedDeadlineId(d.id);
                        setShowReopenModal(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center space-x-1"
                    >
                      <Unlock className="h-3.5 w-3.5" />
                      <span>Re-open Submission</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Create */}
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
                    placeholder="e.g. Review 2 Architecture Presentation"
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

        {/* Modal Reopen */}
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
                    className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-md"
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
