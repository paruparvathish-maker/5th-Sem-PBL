'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import {
  UploadCloud, FileText, CheckCircle2, AlertOctagon, Lock,
  ShieldAlert, Sparkles, Check, Edit3
} from 'lucide-react';

export default function StudentSubmissionsPage() {
  const { user } = useAuth();
  if (!user) return null;

  const team = store.getTeamByStudentId(user.id);
  const submissions = team ? store.getSubmissionsForTeam(team.id) : [];

  // --- Block 1 State: Project Statement ---
  const isProjectLocked = !!(team?.projectTitle && team.projectTitle !== 'To Be Decided (TBD)');
  const [projectTitle, setProjectTitle] = useState(team?.projectTitle === 'To Be Decided (TBD)' ? '' : team?.projectTitle || '');
  const [projectDesc, setProjectDesc] = useState(team?.projectDescription || '');
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectMessage, setProjectMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    
    if (!projectTitle.trim() || !projectDesc.trim()) {
      setProjectMessage({ type: 'error', text: 'Please fill out both the title and description.' });
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

  // --- Block 2 State: 1st Guide Meeting Document ---
  const guideDocSubmission = submissions.find(s => s.deadlineId === 'dl-guide-meeting');
  const isGuideDocLocked = !!guideDocSubmission;
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx'].includes(ext || '')) {
        setUploadMessage({ type: 'error', text: 'Please upload a PDF or DOCX file.' });
        setFile(null);
        return;
      }
      setFile(selected);
      setUploadMessage(null);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !file) return;

    setIsUploading(true);
    const result = store.submitDocument(
      'dl-guide-meeting',
      team.id,
      user.id,
      file.name,
      file.type || 'application/pdf',
      file.size
    );
    setIsUploading(false);

    if (result.success) {
      setUploadMessage({ type: 'success', text: '1st Guide Meeting Document Uploaded & Locked!' });
      setFile(null);
    } else {
      setUploadMessage({ type: 'error', text: result.error || 'Upload failed.' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">0th Review Submissions</h1>
            <p className="text-sm text-slate-600 mt-1">
              Complete the two required submissions below. Once saved, they are permanently locked.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-700">Team: Group {team?.teamNumber || 'N/A'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* BLOCK 1: Project Statement */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2">
                <Edit3 className="h-5 w-5 text-indigo-600" />
                <span>Project Statement</span>
              </h3>
              {isProjectLocked && (
                <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>
            
            <p className="text-xs text-slate-500 mb-6">
              Finalize your project title and write a detailed problem description. This is worth 5 marks.
            </p>

            {projectMessage && (
              <div className={`p-3 mb-4 rounded-xl text-xs font-semibold flex items-start space-x-2 border ${projectMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                {projectMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />}
                <span>{projectMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProject} className="space-y-4 flex-grow flex flex-col">
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

              <div className="flex-grow flex flex-col">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Problem Description</label>
                <textarea
                  value={projectDesc}
                  onChange={e => setProjectDesc(e.target.value)}
                  disabled={isProjectLocked}
                  placeholder="Describe your problem statement and methodology in detail..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed flex-grow min-h-[150px] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isProjectLocked || isSavingProject}
                className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center space-x-2 ${isProjectLocked ? 'bg-slate-300 cursor-not-allowed shadow-none text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'}`}
              >
                {isProjectLocked ? (
                  <><Check className="w-4 h-4" /> <span>Saved & Locked</span></>
                ) : (
                  <span>{isSavingProject ? 'Saving...' : 'Save & Lock Statement'}</span>
                )}
              </button>
            </form>
          </div>

          {/* BLOCK 2: Guide Meeting Document */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-lg flex items-center space-x-2">
                <UploadCloud className="h-5 w-5 text-emerald-600" />
                <span>1st Guide Meeting Doc</span>
              </h3>
              {isGuideDocLocked && (
                <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mb-6">
              Upload the signed document from your first guide meeting (PDF/DOCX only).
            </p>

            {uploadMessage && (
              <div className={`p-3 mb-4 rounded-xl text-xs font-semibold flex items-start space-x-2 border ${uploadMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                {uploadMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />}
                <span>{uploadMessage.text}</span>
              </div>
            )}

            <div className="flex-grow flex flex-col justify-center">
              {isGuideDocLocked ? (
                <div className="text-center p-8 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Document Uploaded Successfully</p>
                    <p className="text-xs text-slate-500 mt-1">{guideDocSubmission.fileName}</p>
                  </div>
                  <p className="text-[10px] text-slate-400">Locked on {new Date(guideDocSubmission.submissionTime).toLocaleDateString()}</p>
                </div>
              ) : (
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-2xl p-8 text-center cursor-pointer transition-all">
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      id="guide-doc-upload"
                    />
                    <label htmlFor="guide-doc-upload" className="cursor-pointer block">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <FileText className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        {file ? file.name : 'Click to select document'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Max 10MB (PDF, DOCX)
                      </p>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!file || isUploading}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center space-x-2 ${!file ? 'bg-slate-300 cursor-not-allowed shadow-none text-slate-500' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'}`}
                  >
                    <span>{isUploading ? 'Uploading...' : 'Upload & Lock Document'}</span>
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
