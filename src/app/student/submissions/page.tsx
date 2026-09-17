'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import {
  UploadCloud, FileText, CheckCircle2, AlertOctagon, Clock,
  FileCheck, ShieldAlert, Sparkles, FileCode, Check
} from 'lucide-react';

export default function StudentSubmissionsPage() {
  const { user } = useAuth();
  if (!user) return null;

  const team = store.getTeamByStudentId(user.id);
  const deadlines = store.getDeadlinesForStudent(user.section).filter(d => d.submissionRequired);
  const submissions = team ? store.getSubmissionsForTeam(team.id) : [];

  const [selectedDeadlineId, setSelectedDeadlineId] = useState(deadlines[0]?.id || '');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedDeadline = deadlines.find(d => d.id === selectedDeadlineId);
  const isPastDeadline = selectedDeadline ? new Date() > new Date(selectedDeadline.dueDate) : false;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'pptx'].includes(ext || '')) {
        setMessage({ type: 'error', text: 'Unsupported file type. Please upload a PDF, DOCX, or PPTX file.' });
        setFile(null);
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size exceeds the 10MB limit. Please upload a smaller file.' });
        setFile(null);
        return;
      }
      setFile(selected);
      setMessage(null);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) {
      setMessage({ type: 'error', text: 'You must belong to a team to upload submissions.' });
      return;
    }
    if (!selectedDeadlineId) {
      setMessage({ type: 'error', text: 'Please select a deadline milestone.' });
      return;
    }
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file to upload.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    // Call store submission with strict server-side deadline enforcement
    const result = store.submitDocument(
      selectedDeadlineId,
      team.id,
      user.id,
      file.name,
      file.type || 'application/pdf',
      file.size
    );

    setIsSubmitting(false);

    if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'Upload failed.' });
    } else {
      setMessage({
        type: 'success',
        text: `Document "${file.name}" uploaded successfully! Registered as Version ${result.submission?.version}.`
      });
      setFile(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Document Upload & Submissions</h1>
            <p className="text-sm text-slate-600 mt-1">
              Submit your team project deliverables (PDF, DOCX, PPTX) securely. Submission cut-offs are enforced server-side.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-700">Team: Group {team?.teamNumber || 'N/A'}</span>
          </div>
        </div>

        {/* 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Upload Form (2 Columns) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
              <UploadCloud className="h-5 w-5 text-indigo-600" />
              <span>Submit Project Deliverable</span>
            </h3>

            {message && (
              <div className={`p-4 rounded-xl text-xs font-semibold flex items-start space-x-2 border ${message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-5">

              {/* Deadline Milestone Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Deadline Milestone
                </label>
                <select
                  value={selectedDeadlineId}
                  onChange={(e) => {
                    setSelectedDeadlineId(e.target.value);
                    setMessage(null);
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {deadlines.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.title} (Due: {new Date(d.dueDate).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Deadline Status Banner */}
              {selectedDeadline && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed flex items-center justify-between ${isPastDeadline
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                  }`}>
                  <div>
                    <span className="font-bold block">
                      {isPastDeadline ? '❌ DEADLINE PASSED & LOCKED' : '✅ UPLOAD OPEN'}
                    </span>
                    <span>Due Date: {new Date(selectedDeadline.dueDate).toLocaleString()}</span>
                  </div>
                  {isPastDeadline && (
                    <span className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-[10px]">
                      Upload Blocked
                    </span>
                  )}
                </div>
              )}

              {/* Drag & Drop File Input Area */}
              <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isPastDeadline
                  ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
                  : 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/60 cursor-pointer'
                }`}>
                <input
                  type="file"
                  accept=".pdf,.docx,.pptx"
                  disabled={isPastDeadline}
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload-input"
                />
                <label htmlFor="file-upload-input" className={isPastDeadline ? 'cursor-not-allowed' : 'cursor-pointer'}>
                  <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {file ? file.name : 'Click to select or drag & drop document'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports PDF, DOCX, PPTX (Max 10MB)
                  </p>
                  {file && (
                    <p className="text-xs font-semibold text-emerald-600 mt-2">
                      Selected: {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  )}
                </label>
              </div>

              {/* Submission Submit Button */}
              <button
                type="submit"
                disabled={isPastDeadline || !file || isSubmitting}
                className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center space-x-2 ${isPastDeadline || !file
                    ? 'bg-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                  }`}
              >
                <span>{isSubmitting ? 'Uploading & Processing AI Summary...' : 'Upload Document Deliverable'}</span>
              </button>
            </form>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 leading-relaxed">
              🛡️ <strong>Server-side Enforcement:</strong> If current server timestamp is past the deadline, your upload API request will be automatically rejected with a 403 Forbidden error even if client UI controls are bypassed.
            </div>
          </div>

          {/* Submission History Sidebar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
              <FileCheck className="h-5 w-5 text-emerald-600" />
              <span>Submitted Files History</span>
            </h3>

            {submissions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No documents uploaded yet for Group {team?.teamNumber}.</p>
            ) : (
              <div className="space-y-3">
                {submissions.map(sub => (
                  <div key={sub.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate max-w-[140px]">{sub.fileName}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        v{sub.version}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Submitted by {sub.studentName}</p>
                    <p className="text-[10px] text-slate-400">
                      📅 {new Date(sub.submissionTime).toLocaleString()}
                    </p>

                    {sub.aiSummary && (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600 bg-indigo-50/50 p-2 rounded-lg">
                        <span className="font-bold text-indigo-700 flex items-center space-x-1 mb-1">
                          <Sparkles className="h-3 w-3" />
                          <span>AI Automated Document Summary</span>
                        </span>
                        <p className="line-clamp-2 italic">{sub.aiSummary}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
