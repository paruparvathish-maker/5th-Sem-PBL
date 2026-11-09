'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/data/store';
import { GraduationCap, ShieldCheck, UserCheck, Lock, Mail, User, AlertCircle, ArrowRight, Eye, EyeOff, KeyRound, UserPlus } from 'lucide-react';
import { UserRole } from '@/lib/types/pbl';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<UserRole>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsActivation, setNeedsActivation] = useState(false);
  const [activationEmail, setActivationEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    // When visiting login page (especially on mobile phone browsers), immediately sync latest database
    store.syncFromSupabase().catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNeedsActivation(false);
    setResendMsg('');
    setIsSubmitting(true);

    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    if (!cleanIdentifier || !cleanPassword) {
      setError('Please enter both identifier and password.');
      setIsSubmitting(false);
      return;
    }

    const res = await login(cleanIdentifier, cleanPassword);
    if (!res.success) {
      setError(res.error || 'Authentication failed. Please check your credentials.');
      if (res.needsActivation) {
        setNeedsActivation(true);
        setActivationEmail(res.email || cleanIdentifier);
      }
      setIsSubmitting(false);
      return;
    }

    if (res.requiresPasswordChange) {
      router.push('/first-time-password-change');
    } else {
      if (res.user?.role === 'student') router.push('/student/dashboard');
      else if (res.user?.role === 'faculty') router.push('/faculty/dashboard');
      else router.push('/admin/dashboard');
    }
  };

  const handleResendActivation = async () => {
    if (!activationEmail && !identifier) return;
    setResendStatus('sending');
    setResendMsg('');
    try {
      const res = await fetch('/api/auth/resend-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: (activationEmail || identifier).trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendStatus('sent');
        setResendMsg(data.message || 'Activation email resent successfully! Check your inbox.');
      } else {
        setResendStatus('idle');
        setResendMsg(data.error || 'Failed to resend activation email.');
      }
    } catch {
      setResendStatus('idle');
      setResendMsg('Network error while resending activation link.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="mb-3 text-center">
          <Link
            href="/"
            className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <span>&larr; Back to Portal Home</span>
          </Link>
        </div>
        <div className="flex items-center justify-center space-x-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Industrial PBL</h2>
            <p className="text-xs text-indigo-300 font-medium">Dayananda Sagar Academy of Technology & Management</p>
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-slate-400">
          Industrial Project-Based Learning Activity & Evaluation System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/60 sm:px-10">
          
          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900/80 rounded-xl mb-6 border border-slate-700/50">
            <button
              type="button"
              onClick={() => { setActiveTab('student'); setError(''); setIdentifier(''); setPassword(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'student'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('faculty'); setError(''); setIdentifier(''); setPassword(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'faculty'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Faculty
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setError(''); setIdentifier(''); setPassword(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'admin'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>

          {needsActivation && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 shrink-0 text-amber-400" />
                <span className="font-semibold">Account Pending Email Activation</span>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Please check your college email inbox or spam folder for the activation link. If you didn't receive it, click below to resend.
              </p>
              {resendMsg ? (
                <p className="text-xs text-emerald-400 font-semibold">{resendMsg}</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendActivation}
                  disabled={resendStatus === 'sending'}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-amber-300 hover:text-white underline pt-1"
                >
                  <span>{resendStatus === 'sending' ? 'Sending Link...' : 'Resend Activation Email'}</span>
                </button>
              )}
            </div>
          )}

          {error && !needsActivation && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {activeTab === 'student' ? 'USN (e.g. 1DT24CS001) or Email' : activeTab === 'faculty' ? 'Institutional Email or Employee ID (Staff Code)' : 'Email, Username or Employee ID'}
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  {activeTab === 'student' ? <User className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="username"
                  placeholder={
                    activeTab === 'student' ? 'Enter USN (e.g. 1DT24CS010) or Email' :
                    activeTab === 'faculty' ? 'Enter Email (e.g. gajendra-cse@dsatm.edu.in) or Employee ID (e.g. F1023)' :
                    'Username (e.g. admin, raghu, girish) or Email'
                  }
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {activeTab === 'student' && 'Students log in with USN as username with your account password.'}
                {activeTab === 'faculty' && 'Faculties log in with Institutional Email or Employee ID (Staff Code).'}
                {activeTab === 'admin' && 'Main Admin (admin/parvathish) & Industry Experts (girish, raghu, rajashekhar, manasa, harshitha)'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center items-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all ${
                activeTab === 'student' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30' :
                activeTab === 'faculty' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30' :
                'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
              }`}
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Sign Up / Create Account Button */}
            <div className="pt-2 text-center">
              <Link
                href="/signup"
                className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-200 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/60 hover:border-indigo-500/50 transition-all shadow-sm"
              >
                <UserPlus className="h-3.5 w-3.5 text-indigo-400" />
                <span>New User? Create Account / Sign Up</span>
              </Link>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
