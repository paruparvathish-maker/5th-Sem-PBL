'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import { Bot, Sparkles, FileText, Send, Lightbulb, BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function StudentAiAssistantPage() {
  const { user } = useAuth();
  if (!user) return null;

  const team = store.getTeamByStudentId(user.id);

  const [activeTab, setActiveTab] = useState<'ideation' | 'rag'>('ideation');
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [sources, setSources] = useState<{ fileName: string; version: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleIdeationClick = async (type: string) => {
    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/ai/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: type, mode: 'ideation' })
      });
      const data = await res.json();
      setResponse(data.answer);
    } catch (e) {
      setResponse('Failed to generate AI recommendation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !team) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/ai/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          teamId: team.id,
          studentId: user.id,
          mode: 'rag'
        })
      });
      const data = await res.json();
      setResponse(data.answer);
      setSources(data.sources || []);
    } catch (e) {
      setResponse('Failed to retrieve answer from project documents.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center">
              <Bot className="h-7 w-7" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-xs font-bold border border-purple-500/30">
                <Sparkles className="h-3 w-3" />
                <span>AI Assistant • Labeled AI Generated Content</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white mt-1">PBL AI Project & Document Assistant</h1>
            </div>
          </div>
          <p className="text-xs text-purple-200 mt-3 max-w-2xl leading-relaxed">
            Generate project methodology ideas or perform vector RAG search strictly over your team's authorized documents.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex space-x-2 bg-slate-200/60 p-1.5 rounded-xl w-fit">
          <button
            onClick={() => { setActiveTab('ideation'); setResponse(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 ${
              activeTab === 'ideation' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lightbulb className="h-4 w-4" />
            <span>AI Project Ideation Assistant</span>
          </button>

          <button
            onClick={() => { setActiveTab('rag'); setResponse(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center space-x-2 ${
              activeTab === 'rag' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>RAG Document Q&A</span>
          </button>
        </div>

        {/* Tab 1: Project Ideation */}
        {activeTab === 'ideation' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => handleIdeationClick('problem_statement')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition">
                  🎯
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Problem Statement</h4>
                <p className="text-xs text-slate-500 mt-1">Refine and structure your project problem statement.</p>
              </button>

              <button
                onClick={() => handleIdeationClick('objectives')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition">
                  📌
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Project Objectives</h4>
                <p className="text-xs text-slate-500 mt-1">Generate measurable 3-step project objectives.</p>
              </button>

              <button
                onClick={() => handleIdeationClick('methodology')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition">
                  ⚙️
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Methodology Phases</h4>
                <p className="text-xs text-slate-500 mt-1">Outline 4 phase development workflow.</p>
              </button>

              <button
                onClick={() => handleIdeationClick('tech_stack')}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition">
                  💻
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Tech Stack Ideas</h4>
                <p className="text-xs text-slate-500 mt-1">Hardware, ML & dashboard stack options.</p>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: RAG Q&A */}
        {activeTab === 'rag' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-purple-800 bg-purple-50 p-3 rounded-xl border border-purple-200">
              <ShieldCheck className="h-4 w-4" />
              <span>RAG Security: Queries evaluate ONLY documents submitted by Group {team?.teamNumber}.</span>
            </div>

            <form onSubmit={handleRagSubmit} className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about your submitted project documents..."
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center space-x-2 shrink-0"
              >
                <Send className="h-4 w-4" />
                <span>Ask RAG</span>
              </button>
            </form>
          </div>
        )}

        {/* Response Box */}
        {isLoading && (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs font-bold text-slate-500">
            🤖 Processing AI Query & Analyzing Vector Context...
          </div>
        )}

        {response && (
          <div className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <h4 className="font-bold text-slate-800 text-sm">AI Generated Output</h4>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">
                AI Generated
              </span>
            </div>

            <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-mono bg-slate-50 p-4 rounded-xl border border-slate-200">
              {response}
            </p>

            {sources.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Sources Cites</h5>
                <div className="flex flex-wrap gap-2">
                  {sources.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1">
                      <FileText className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{s.fileName} (v{s.version})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
