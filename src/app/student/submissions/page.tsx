'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import {
  FileText, CheckCircle2, AlertOctagon, Lock,
  Upload, FileCheck, ArrowDownToLine, Users, ShieldAlert,
  Clock, AlertCircle, Info, Sparkles, ExternalLink
} from 'lucide-react';
import { Deadline, Submission, Team } from '@/lib/types/pbl';
import { downloadSubmissionFile, viewSubmissionFile } from '@/lib/utils/download';
import { saveFileToIdb } from '@/lib/utils/idb-storage';
import { saveCloudSubmission } from '@/lib/data/cloud-sync';

export default function StudentSubmissionsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const [team, setTeam] = useState<Team | undefined>(store.getTeamByStudentId(user.id || user.usn || user.email));
  const [activeDeadline, setActiveDeadline] = useState<Deadline | undefined>(undefined);
  const [teamSubmissions, setTeamSubmissions] = useState<Submission[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    const currentTeam = store.getTeamByStudentId(user.id || user.usn || user.email);
    setTeam(currentTeam);
    // Deadlines applicable to student
    const deadlines = store.getDeadlinesForStudent(user.section);
    // Find 1st review deadline or first active deadline
    const rev1 = deadlines.find(d => d.id === 'dl-review-1' || d.title.toLowerCase().includes('1st review')) || deadlines[0];
    setActiveDeadline(rev1);

    if (currentTeam) {
      const subs = store.getSubmissionsForTeam(currentTeam.id);
      setTeamSubmissions(subs);
    }
  };

  useEffect(() => {
    loadData();
    store.syncFromSupabase().then(() => {
      loadData();
    });
  }, [user.id, user.usn, user.email, user.section]);

  // Existing submission for 1st Review
  const currentSubmission = teamSubmissions.find(s => 
    (activeDeadline && s.deadlineId === activeDeadline.id) || 
    s.deadlineId === 'dl-review-1' || 
    s.deadlineTitle?.toLowerCase().includes('1st review')
  );

  const isLocked = !!currentSubmission && currentSubmission.isLocked !== false;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File exceeds 25MB maximum size limit.' });
      return;
    }

    setSelectedFile(file);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAndLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) {
      setMessage({ type: 'error', text: 'You are not assigned to a team.' });
      return;
    }

    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select a document file (.pdf, .doc, .docx) to upload.' });
      return;
    }

    const deadlineId = activeDeadline?.id || 'dl-review-1';

    const confirmed = window.confirm(
      'Are you sure you want to Save & Lock this submission?\n\nOnce locked, this report will be finalized for your entire team and immediately submitted to your Guide and Admin.'
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = store.submitDocument(
        deadlineId,
        team.id,
        user.id,
        selectedFile.name,
        selectedFile.type || 'application/pdf',
        selectedFile.size,
        fileDataUrl || undefined,
        remarks
      );

      if (res.success && res.submission) {
        // Await cloud persistence so that mobile phones and all devices see the submission immediately
        await saveCloudSubmission(res.submission).catch(console.error);

        if (fileDataUrl) {
          saveFileToIdb(res.submission.id, fileDataUrl).catch(console.error);
          await fetch('/api/submissions/file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissionId: res.submission.id, fileData: fileDataUrl })
          }).catch(() => {});
        }

        // Sync full store to cloud API
        await store.syncToSupabase().catch(console.error);

        setMessage({
          type: 'success',
          text: `Document "${selectedFile.name}" successfully saved and locked for Team Group ${team.teamNumber}!`
        });
        setSelectedFile(null);
        setFileDataUrl('');
        setRemarks('');
        loadData();
      } else {
        setMessage({ type: 'error', text: res.error || 'Submission failed.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                Phase 1 Deliverable
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                5th Semester PBL
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">1st Review Report Submission</h1>
            <p className="text-sm text-slate-600 mt-1">
              Upload your completed Phase 1 / 1st Review Report. Once saved and locked, the document is visible to all teammates, your Faculty Guide, and Admin.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
            <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
              <Users className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">Group {team?.teamNumber || 'N/A'} • Sec {user.section}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Guide: {team?.guideName || 'Assigned Guide'}</span>
          </div>
        </div>

        {/* Team & Project Overview Card */}
        {team && (
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
                  Registered Project
                </span>
                <h2 className="text-lg font-bold mt-1 text-white">
                  {team.projectTitle && team.projectTitle !== 'To Be Decided (TBD)' ? team.projectTitle : 'DSATM 5th Sem PBL Project'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {isLocked ? (
                  <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-xl text-xs font-extrabold">
                    <Lock className="w-3.5 h-3.5" /> Locked & Submitted
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-xl text-xs font-extrabold">
                    <Clock className="w-3.5 h-3.5" /> Awaiting Submission
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Faculty Guide</span>
                <span className="font-bold text-slate-100">{team.guideName}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Team Members</span>
                <span className="font-bold text-slate-100">{team.members?.length || 0} Students</span>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Milestone Deadline</span>
                <span className="font-bold text-amber-300">
                  {activeDeadline?.dueDate ? new Date(activeDeadline.dueDate).toLocaleDateString() : 'Active'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Message Feedback */}
        {message && (
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-start space-x-2 border ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* ── CASE 1: SUBMISSION SAVED & LOCKED ── */}
        {isLocked && currentSubmission && (
          <div className="bg-white rounded-2xl border border-emerald-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
                  <FileCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-lg">1st Review Report Submitted</h3>
                    <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your report is verified and synced with all team members and your faculty guide.
                  </p>
                </div>
              </div>

              {/* Download / View Button */}
              <button
                type="button"
                onClick={() => viewSubmissionFile(currentSubmission)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                title="Open submitted document in new tab"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Document</span>
              </button>
            </div>

            {/* Submission File Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-indigo-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{currentSubmission.fileName}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {formatFileSize(currentSubmission.fileSize)} • Version {currentSubmission.version || 1}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                  {currentSubmission.status === 'late' ? 'Submitted Late' : 'Submitted on Time'}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Submitted By</span>
                  <p className="font-bold text-slate-800">
                    {currentSubmission.studentName} {currentSubmission.studentUsn ? `(${currentSubmission.studentUsn})` : ''}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Submission Timestamp</span>
                  <p className="font-bold text-slate-800">
                    {new Date(currentSubmission.submissionTime).toLocaleString()}
                  </p>
                </div>
              </div>

              {currentSubmission.remarks && (
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Student Remarks</span>
                  <p className="text-xs text-slate-700 mt-1 italic">"{currentSubmission.remarks}"</p>
                </div>
              )}
            </div>

            {/* Shared Awareness Notice */}
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-900 leading-relaxed">
                <p className="font-bold">Team Shared Submission</p>
                <p className="text-indigo-700 mt-0.5">
                  This submission applies to all <strong>{team?.members?.length || 0} members</strong> in Group {team?.teamNumber}. All teammates see this locked document in their respective logins.
                  Only the College Administrator can unlock this submission if a document replacement is required.
                </p>
              </div>
            </div>

            {/* AI Summary / Highlights */}
            {currentSubmission.aiSummary && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Automated AI Verification Check</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{currentSubmission.aiSummary}</p>
              </div>
            )}
          </div>
        )}

        {/* ── CASE 2: OPEN FOR SUBMISSION (UPLOAD & LOCK) ── */}
        {!isLocked && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Upload 1st Review Report</h3>
                  <p className="text-xs text-slate-500">
                    Upload your Phase 1 report (PDF or Word document, max 25MB).
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-xl text-xs font-bold">
                Open for Submission
              </span>
            </div>

            <form onSubmit={handleSaveAndLock} className="space-y-6">

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Report Document <span className="text-rose-500">*</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-indigo-50/50"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>

                  {selectedFile ? (
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-indigo-900">{selectedFile.name}</p>
                      <p className="text-xs font-semibold text-emerald-700">
                        {formatFileSize(selectedFile.size)} • Click to choose a different file
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">
                        Click to browse or drag and drop your report
                      </p>
                      <p className="text-xs text-slate-500">
                        Supported formats: PDF (.pdf), Microsoft Word (.doc, .docx) — Max 25MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Remarks / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Submission Notes / Remarks (Optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any brief notes for your guide (e.g., prototype testing highlights, methodology references)..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 min-h-[90px] resize-none"
                />
              </div>

              {/* Shared Locking Notice */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold">Important Notice regarding Team Submission:</p>
                  <p className="text-amber-800 mt-0.5">
                    Only <strong>one member</strong> from Group {team?.teamNumber} needs to submit. Once you click <strong>Save & Lock Submission</strong>, it locks the submission for all teammates and makes it available for faculty guide grading.
                  </p>
                </div>
              </div>

              {/* Save & Lock Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!selectedFile || isSubmitting}
                  className={`w-full py-4 px-6 rounded-xl text-sm font-extrabold text-white shadow-lg transition-all flex items-center justify-center space-x-2 ${
                    !selectedFile || isSubmitting
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting & Locking...' : 'Save & Lock 1st Review Report'}</span>
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}