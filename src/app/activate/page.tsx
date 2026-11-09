'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  GraduationCap, CheckCircle2, AlertCircle, RefreshCw,
  ArrowRight, ShieldCheck, Mail
} from 'lucide-react';

function ActivateContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState(email || '');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMessage('Missing activation token or email address in the link.');
      return;
    }

    const activateAccount = async () => {
      try {
        const res = await fetch('/api/auth/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, email })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Your account has been successfully activated!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Activation failed or link has expired.');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Network error occurred during account activation.');
      }
    };

    activateAccount();
  }, [token, email]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setResendStatus('sending');
    setResendMessage('');

    try {
      const res = await fetch('/api/auth/resend-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: resendEmail.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        setResendStatus('sent');
        setResendMessage(data.message || 'Activation email sent!');
      } else {
        setResendStatus('idle');
        setResendMessage(data.error || 'Failed to resend activation email.');
      }
    } catch {
      setResendStatus('idle');
      setResendMessage('Network error occurred.');
    }
  };

  return (
    <div className="bg-slate-800/90 backdrop-blur-xl py-10 px-6 shadow-2xl rounded-2xl border border-slate-700/60 sm:px-10 text-center">
      {status === 'loading' && (
        <div className="py-8 space-y-4">
          <div className="inline-flex p-4 rounded-2xl bg-indigo-600/10 text-indigo-400">
            <RefreshCw className="h-10 w-10 animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-white">Activating Your Account...</h3>
          <p className="text-sm text-slate-400">
            Please wait while we verify your activation token with the university database.
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="py-6 space-y-5">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 ring-8 ring-emerald-500/5">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">Account Activated!</h3>
            <p className="text-sm text-emerald-300 mt-2 font-medium">
              {message}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Your credentials are confirmed. You can now access your projects, submissions, and evaluations.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/login"
              className="w-full inline-flex justify-center items-center space-x-2 py-3 px-6 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="py-6 space-y-5">
          <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 text-rose-400">
            <AlertCircle className="h-12 w-12" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Activation Incomplete</h3>
            <p className="text-sm text-rose-300 mt-2 font-medium">
              {message}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-700/60 text-left">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Resend Activation Link
            </h4>
            <form onSubmit={handleResend} className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {resendMessage && (
                <p className={`text-xs ${resendStatus === 'sent' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {resendMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={resendStatus === 'sending'}
                className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 transition"
              >
                <span>{resendStatus === 'sending' ? 'Sending Link...' : 'Send New Activation Link'}</span>
              </button>
            </form>
          </div>

          <div className="pt-3">
            <Link
              href="/login"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center space-x-1"
            >
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActivatePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-grid-pattern selection:bg-indigo-500 selection:text-white">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 text-center mb-6">
        <Link href="/" className="inline-flex items-center justify-center space-x-3 mb-2">
          <div className="h-14 w-14 rounded-full bg-white p-1 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-500/30 flex items-center justify-center shrink-0">
            <img
              src="/dsatm-logo.png"
              alt="DSATM Logo"
              className="h-full w-full object-contain rounded-full"
            />
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Industrial PBL</h2>
            <p className="text-xs text-indigo-300 font-medium">Account Activation</p>
          </div>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <Suspense fallback={
          <div className="bg-slate-800/90 py-12 px-6 rounded-2xl text-center text-white">
            Loading activation...
          </div>
        }>
          <ActivateContent />
        </Suspense>
      </div>
    </div>
  );
}

