'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import {
  FileText, CheckCircle2, AlertOctagon, Lock,
  ShieldAlert, Check, Edit3
} from 'lucide-react';

export default function StudentSubmissionsPage() {
  const { user } = useAuth();
  if (!user) return null;

  const team = store.getTeamByStudentId(user.id);

  // --- Project Statement State ---
  const isProjectLocked = !!(team?.projectTitle && team.projectTitle !== 'To Be Decided (TBD)');
  const [projectTitle, setProjectTitle] = useState(team?.projectTitle === 'To Be Decided (TBD)' ? '' : team?.projectTitle || '');
  const [projectDesc, setProjectDesc] = useState(team?.projectDescription || '');
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectMessage, setProjectMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    
    if (!projectTitle.trim() || !projectDesc.trim()) {
      setProjectMessage({ type: 'error', text: 'Please fill out both the title and problem description.' });
      return;
    }

    setIsSavingProject(true);
    const result = store.updateTeamProjectDetails(team.id, projectTitle, projectDesc);
    setIsSavingProject(false);

    if (result.success) {
      setProjectMessage({ type: 'success', text: 'Project Details Saved & Locked Successfully!' });
    } else {
      setProjectMessage({ type: 'error', text: result.error || 'Failed to save project details.' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">0th Review Submission</h1>
            <p className="text-sm text-slate-600 mt-1">
              Finalize your Project Title & Problem Description below. Once saved, it is locked for faculty evaluation (5 Marks).
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-700">Team: Group {team?.teamNumber || 'N/A'}</span>
          </div>
        </div>

        {/* Project Statement Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Edit3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">Project Statement & Problem Description</h3>
                <p className="text-xs text-slate-500">Worth 5 marks in the 0th review evaluation scorecard</p>
              </div>
            </div>
            {isProjectLocked ? (
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-bold">
                <Lock className="w-3.5 h-3.5" /> Saved & Locked
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-xl text-xs font-bold">
                Open for Submission
              </span>
            )}
          </div>

          {projectMessage && (
            <div className={`p-4 rounded-xl text-xs font-semibold flex items-start space-x-2 border ${
              projectMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {projectMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />}
              <span>{projectMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveProject} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Project Title</label>
              <input
                type="text"
                value={projectTitle}
                onChange={e => setProjectTitle(e.target.value)}
                disabled={isProjectLocked}
                placeholder="Enter final project title..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Problem Description & Objectives</label>
              <textarea
                value={projectDesc}
                onChange={e => setProjectDesc(e.target.value)}
                disabled={isProjectLocked}
                placeholder="Describe your problem statement, methodology, and expected outcomes in detail..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed min-h-[200px] resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isProjectLocked || isSavingProject}
                className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center space-x-2 ${
                  isProjectLocked ? 'bg-slate-300 cursor-not-allowed shadow-none text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                }`}
              >
                {isProjectLocked ? (
                  <><Check className="w-4 h-4" /> <span>Project Details Submitted & Locked</span></>
                ) : (
                  <span>{isSavingProject ? 'Saving...' : 'Save & Lock Project Statement'}</span>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </DashboardLayout>
  );
}
