'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { store } from '@/lib/data/store';
import {
  User, KeyRound, Sparkles, X, ShieldCheck, Mail, Phone,
  Building, CheckCircle2, AlertCircle, Eye, EyeOff, Bot,
  Award, BookOpen, Send, Copy, Check, Lock, RefreshCw, Cpu
} from 'lucide-react';
import { isExecutiveViewer, getIndustryPersonAccess } from '@/lib/auth/roles';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'password' | 'ai';
}

export function ProfileModal({ isOpen, onClose, initialTab = 'profile' }: ProfileModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'ai'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Profile Edit State
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConversation, setAiConversation] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `Hello ${user?.name || 'Engineer'}! I am your Industrial PBL AI Copilot. Ask me anything about:
• IEEE manuscript drafting and section formatting
• 4th & 5th semester rubric criteria and deliverables
• IoT, ML, and Web tech stack recommendations
• Problem statement ideation and methodology formulation`
    }
  ]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen || !user) return null;

  // Retrieve user-specific project / team metadata
  const isExec = isExecutiveViewer(user);
  const industryAccess = getIndustryPersonAccess(user);
  const studentTeam = user.role === 'student' ? store.getTeamByStudentId(user.id) : null;
  const facultyTeams = user.role === 'faculty' ? store.getTeamsByGuideId(user.email || user.id) : [];

  // Handle Profile Update
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    user.phone = phone.trim();
    const updated = store.updateProfile(user.id, { phone: phone.trim() });
    if (updated) {
      setProfileMsg({ type: 'success', text: 'Contact details updated successfully!' });
    } else {
      setProfileMsg({ type: 'success', text: 'Profile preferences saved locally.' });
    }
    setTimeout(() => setProfileMsg(null), 3000);
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (cleanNew.length < 6) {
      setPassMsg({ type: 'error', text: 'New password must be at least 6 characters in length.' });
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPassMsg({ type: 'error', text: 'New passwords do not match. Please verify.' });
      return;
    }

    setPassLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          newPassword: cleanNew,
          currentPassword: currentPassword.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        user.password = cleanNew;
        user.isFirstLogin = false;
        setPassMsg({ type: 'success', text: 'Your password has been securely updated!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassMsg({ type: 'error', text: data.error || 'Failed to update password. Please try again.' });
      }
    } catch (err: any) {
      setPassMsg({ type: 'error', text: err.message || 'Network error occurred while updating password.' });
    } finally {
      setPassLoading(false);
    }
  };

  // Handle AI Prompt Submission
  const handleSendAiPrompt = async (promptToSend?: string) => {
    const q = (promptToSend || aiPrompt).trim();
    if (!q) return;

    const newConvo = [...aiConversation, { sender: 'user' as const, text: q }];
    setAiConversation(newConvo);
    setAiPrompt('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          mode: 'ideation',
          teamId: studentTeam?.id || undefined,
          studentId: user.id
        })
      });

      const data = await res.json();
      const reply = data.answer || 'I could not process this request right now. Please try asking again.';
      setAiConversation([...newConvo, { sender: 'ai' as const, text: reply }]);
    } catch {
      setAiConversation([
        ...newConvo,
        {
          sender: 'ai' as const,
          text: 'AI Assistant recommendation:\nEnsure your project architecture includes clear hardware interfacing, edge inference latency budgets, and rigorous evaluation benchmarks under varying real-world conditions.'
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-full bg-white p-0.5 ring-2 ring-indigo-400/50 shadow-md flex items-center justify-center shrink-0">
              <img
                src="/dsatm-logo.png"
                alt="DSATM Logo"
                className="h-full w-full object-contain rounded-full"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                Account &amp; AI Workspace
              </h2>
              <p className="text-xs text-indigo-300 font-medium">
                Dayananda Sagar Academy of Technology &amp; Management
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="h-4 w-4" />
            <span>User Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center space-x-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'password'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span>Change Password</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center space-x-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'ai'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>AI Project Copilot</span>
            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-extrabold uppercase">
              AI
            </span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* ============================================================== */}
          {/* TAB 1: USER PROFILE VIEW                                        */}
          {/* ============================================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Profile Card Summary */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black">{user.name}</h3>
                    <p className="text-xs text-indigo-300 font-mono mt-0.5">
                      {user.email || user.usn}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                        {industryAccess.isIndustry
                          ? 'Industry Evaluator'
                          : isExec
                          ? 'Executive Leadership'
                          : user.role === 'admin'
                          ? 'Super Admin'
                          : user.role === 'faculty'
                          ? 'Faculty Project Mentor'
                          : 'Student Researcher'}
                      </span>
                      <span className="inline-flex items-center text-[11px] text-emerald-300 font-medium space-x-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Active Account</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Institutional Email ID
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Mail className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 break-all">
                      {user.email || 'Not specified'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {user.role === 'student' ? 'University Seat Number (USN)' : 'Staff Code / Employee ID'}
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Building className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">
                      {user.usn || user.staffCode || user.id}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Assigned Section &amp; Track
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 mt-1 block">
                    {industryAccess.isIndustry
                      ? `Sections ${industryAccess.allAllowedSections.join(', ')} (4th & 5th Sem)`
                      : user.section
                      ? `Section ${user.section} &bull; CSE Department`
                      : 'All Sections (Department Wide)'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Institution Affiliation
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 mt-1 block">
                    DSATM &bull; NAAC A+ &bull; NBA Accredited
                  </span>
                </div>
              </div>

              {/* Student Team or Faculty Mentee Overview */}
              {user.role === 'student' && studentTeam && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-indigo-900 tracking-wider">
                      Assigned PBL Team: {studentTeam.teamNumber}
                    </span>
                    <span className="text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                      Semester {studentTeam.semester || 5}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{studentTeam.projectTitle}</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Faculty Guide: <strong className="text-slate-800">{studentTeam.guideName}</strong> ({studentTeam.guideEmail})
                  </p>
                </div>
              )}

              {user.role === 'faculty' && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <span className="text-xs font-black uppercase text-amber-900 tracking-wider block mb-1">
                    Mentorship Summary
                  </span>
                  <p className="text-xs text-slate-700">
                    Currently supervising <strong>{facultyTeams.length} teams</strong> across 4th semester IEEE Research Papers and 5th semester Industrial PBL projects.
                  </p>
                </div>
              )}

              {/* Update Contact Details Form */}
              <form onSubmit={handleSaveProfile} className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Contact Mobile Phone
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md"
                  >
                    Save Contact
                  </button>
                </div>
                {profileMsg && (
                  <p className={`text-xs mt-2 font-bold ${profileMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {profileMsg.text}
                  </p>
                )}
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: CHANGE PASSWORD                                         */}
          {/* ============================================================== */}
          {activeTab === 'password' && (
            <div className="space-y-5 animate-in fade-in duration-150 max-w-lg mx-auto">
              <div className="text-center">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 border border-indigo-200">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-base font-black text-slate-900">Change Account Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ensure your password is at least 6 characters long and stored securely.
                </p>
              </div>

              {passMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                    passMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {passMsg.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{passMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter at least 6 characters"
                      className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passLoading}
                    className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
                  >
                    {passLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Update Password Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: AI PROJECT COPILOT & ASSISTANT                          */}
          {/* ============================================================== */}
          {activeTab === 'ai' && (
            <div className="space-y-4 animate-in fade-in duration-150 flex flex-col h-full">
              {/* Quick Prompt Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Quick AI Prompts:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendAiPrompt('problem_statement')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition"
                  >
                    ✨ Generate Problem Statement
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendAiPrompt('tech_stack')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition"
                  >
                    🛠️ Recommend Hardware &amp; Stack
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendAiPrompt('Explain the Phase 2 PBL Rubrics and viva requirements')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition"
                  >
                    📊 Explain Rubric &amp; Marks
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendAiPrompt('What are the IEEE research paper double column requirements for 4th sem?')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition"
                  >
                    📑 IEEE Paper Guidelines
                  </button>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="space-y-3 min-h-[220px] max-h-[320px] overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-200">
                {aiConversation.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`relative max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                          : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm'
                      }`}
                    >
                      {msg.text}
                      {msg.sender === 'ai' && (
                        <button
                          onClick={() => copyToClipboard(msg.text, idx)}
                          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 transition"
                          title="Copy answer"
                        >
                          {copiedIndex === idx ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex items-center space-x-2 text-xs text-purple-600 font-semibold p-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>AI is formulating guidance...</span>
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiPrompt();
                }}
                className="flex gap-2 pt-1"
              >
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask AI anything about your project, paper, or rubric..."
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition shadow-md flex items-center space-x-1"
                >
                  <span>Send</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Industrial PBL System &bull; DSATM Bangalore</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

