'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/data/store';
import { GraduationCap, ShieldCheck, UserCheck, Lock, Mail, User, AlertCircle, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!identifier.trim() || !password.trim()) {
      setError('Please enter both identifier and password.');
      setIsSubmitting(false);
      return;
    }

    const res = login(identifier.trim(), password);
    if (!res.success) {
      setError(res.error || 'Authentication failed. Please check your credentials.');
      setIsSubmitting(false);
      return;
    }

    // Sync from Supabase so the app has the latest cloud data in memory
    await store.syncFromSupabase();

    if (res.requiresPasswordChange) {
      router.push('/first-time-password-change');
    } else {
      if (res.user?.role === 'student') router.push('/student/dashboard');
      else if (res.user?.role === 'faculty') router.push('/faculty/dashboard');
      else router.push('/admin/dashboard');
    }
  };

  // Quick Demo Auto-fill Helper
  const fillDemo = (id: string, pass: string, role: UserRole) => {
    setActiveTab(role);
    setIdentifier(id);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex items-center justify-center space-x-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">PBL Portal</h2>
            <p className="text-xs text-indigo-300 font-medium">Dayananda Sagar Academy of Technology & Management</p>
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-slate-400">
          Project-Based Learning Activity & Evaluation System
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

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {activeTab === 'student' ? 'USN (University Seat Number)' : activeTab === 'faculty' ? 'Faculty Institutional Email' : 'Admin Email'}
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
                  placeholder={
                    activeTab === 'student' ? 'e.g. 1DT24CS001' :
                    activeTab === 'faculty' ? 'e.g. parvathisha-cse@dsatm.edu.in' :
                    'admin@pbl.edu.in'
                  }
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {activeTab === 'student' && 'Initial password is your USN (e.g. 1DT24CS001)'}
                {activeTab === 'faculty' && 'Initial password is your registered 10-digit mobile number'}
                {activeTab === 'admin' && 'Secure administrator account credentials'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
          </form>

          {/* Quick Demo Credentials Panel */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Quick Demo Credentials</h4>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => fillDemo('1DT24CS010', '1DT24CS010', 'student')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 hover:border-indigo-500/50 transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200 block">Student (Team A1): ACHUT MALLIKARJUN</span>
                  <span className="text-slate-400">USN: 1DT24CS010</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">Autofill</span>
              </button>

              <button
                onClick={() => fillDemo('mr.-gajendra-l-cse@dsatm.edu.in', '9550095500', 'faculty')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 hover:border-amber-500/50 transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200 block">Faculty: Mr. Gajendra L (Guide for A1, D12, F9)</span>
                  <span className="text-slate-400">Email: mr.-gajendra-l-cse@dsatm.edu.in</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">Autofill</span>
              </button>

              <button
                onClick={() => fillDemo('admin@pbl.edu.in', 'Admin@PBL2026!', 'admin')}
                className="w-full text-left p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 hover:border-rose-500/50 transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200 block">System Administrator</span>
                  <span className="text-slate-400">admin@pbl.edu.in</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">Autofill</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
