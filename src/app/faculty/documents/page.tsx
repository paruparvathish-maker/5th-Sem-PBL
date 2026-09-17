'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import { 
  FileText, Download, Sparkles, Clock, CheckCircle2, 
  AlertCircle, ShieldCheck, HelpCircle, FileCheck 
} from 'lucide-react';

export default function FacultyDocumentsPage() {
  const { user } = useAuth();
  if (!user) return null;

  const assignedTeams = store.getTeamsByGuideId(user.id);
  const submissions = store.getAllSubmissions().filter(s => 
    assignedTeams.some(t => t.id === s.teamId)
  );

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  const handleAnalyze = async (subId: string) => {
    setAnalyzingId(subId);
    setAnalysisResult(null);

    try {
      const res = await fetch('/api/ai/analyze-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: subId })
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (e) {
      alert('AI Analysis failed.');
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Submitted Deliverables & Documents</h1>
            <p className="text-sm text-slate-600 mt-1">
              Review submitted student project documents, examine upload timestamps, and trigger advisory AI document analysis.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-indigo-50 text-indigo-800 px-3 py-1.5 rounded-xl border border-indigo-200 text-xs font-bold">
            <ShieldCheck className="h-4 w-4" />
            <span>Assigned Team Submissions Only</span>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm max-w-lg mx-auto">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No Submissions Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              None of your assigned teams have uploaded deliverables for active deadlines.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map(sub => (
              <div key={sub.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-900 text-white">
                        Group {sub.teamNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        v{sub.version}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">{sub.deadlineTitle}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900">{sub.fileName}</h3>
                    <p className="text-xs text-slate-500">
                      Project: <strong className="text-slate-700">{sub.projectTitle}</strong> • Submitted by: <strong className="text-slate-700">{sub.studentName}</strong>
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <button
                      onClick={() => alert(`Simulated Download for ${sub.fileName}`)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>

                    <button
                      onClick={() => handleAnalyze(sub.id)}
                      disabled={analyzingId === sub.id}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>{analyzingId === sub.id ? 'Analyzing...' : 'AI Submission Analysis'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>📅 Submission Timestamp: <strong>{new Date(sub.submissionTime).toLocaleString()}</strong></span>
                  <span>Size: <strong>{(sub.fileSize / (1024*1024)).toFixed(2)} MB</strong></span>
                </div>

                {/* AI Analysis Result Card */}
                {analysisResult && (
                  <div className="p-5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-xs space-y-4 mt-4 animate-in fade-in">
                    
                    <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                      <div className="flex items-center space-x-2 text-purple-900 font-bold">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <span>AI Advisory Analysis (Advisory Only)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-800 uppercase">
                        Faculty Advisory
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed italic">{analysisResult.summary}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg border border-purple-100">
                        <h5 className="font-bold text-emerald-800 mb-1">Key Strengths</h5>
                        <ul className="list-disc list-inside space-y-1 text-slate-600">
                          {analysisResult.strengths?.map((s: string, idx: number) => (
                            <li key={idx}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-purple-100">
                        <h5 className="font-bold text-rose-800 mb-1">Missing / Weak Sections</h5>
                        <ul className="list-disc list-inside space-y-1 text-slate-600">
                          {analysisResult.missingSections?.map((m: string, idx: number) => (
                            <li key={idx}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-purple-100">
                      <h5 className="font-bold text-indigo-900 mb-1">Suggested Faculty Defense Questions</h5>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
                        {analysisResult.facultyQuestions?.map((q: string, idx: number) => (
                          <li key={idx}>"{q}"</li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-[10px] text-purple-700 font-bold bg-purple-100 p-2 rounded">
                      ⚠️ <strong>Reminder:</strong> {analysisResult.disclaimer}
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
