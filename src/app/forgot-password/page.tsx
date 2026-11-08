'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, Mail, KeyRound, Lock, Eye, EyeOff,
  ArrowRight, CheckCircle2, AlertCircle, ShieldCheck,
  RefreshCw, Sparkles, ArrowLeft
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Wizard Steps: 1 = Request Code, 2 = Verify OTP, 3 = New Password
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [identifier, setIdentifier] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Feedback State
  const [maskedEmail, setMaskedEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // STEP 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!identifier.trim()) {
      setError('Please enter your Institutional Email, USN, or Employee ID.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to generate verification code.');
      } else {
        setMaskedEmail(data.maskedEmail || identifier);
        setSuccess(data.message || 'Verification code sent to your email.');
        setEnteredOtp('');
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred while sending OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanOtp = enteredOtp.trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), otp: cleanOtp })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Code is wrong or burned: immediately invalidate and return to Step 1
        setEnteredOtp('');
        setError(data.error || 'Incorrect OTP code. For security, this code has been invalidated. Please request a new code.');
        setSuccess('');
        setTimeout(() => {
          setStep(1);
        }, 1800);
      } else {
        setError('');
        setSuccess('Verification code confirmed! You can now create your new password.');
        setStep(3);
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while verifying code.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters in length.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter carefully.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          newPassword,
          confirmPassword
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to reset password.');
      } else {
        setSuccess(data.message || 'Password successfully updated!');
        setTimeout(() => {
          router.push('/login');
        }, 2200);
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while resetting password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Blur */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 text-center">
        <Link href="/login" className="inline-flex items-center justify-center space-x-3 mb-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Industrial PBL</h2>
            <p className="text-xs text-indigo-300 font-medium">Password Recovery Portal</p>
          </div>
        </Link>
        <p className="text-sm text-slate-400 mt-1">
          Verify your identity via Email OTP to reset your portal password
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/60 sm:px-10">
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-6 px-2">
            <div className={`flex items-center space-x-1.5 text-xs font-bold ${step >= 1 ? 'text-indigo-400' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                1
              </span>
              <span>Identify</span>
            </div>
            <div className={`h-0.5 w-8 ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
            <div className={`flex items-center space-x-1.5 text-xs font-bold ${step >= 2 ? 'text-indigo-400' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                2
              </span>
              <span>Verify OTP</span>
            </div>
            <div className={`h-0.5 w-8 ${step >= 3 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
            <div className={`flex items-center space-x-1.5 text-xs font-bold ${step >= 3 ? 'text-indigo-400' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                3
              </span>
              <span>Reset</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Notification */}
          {success && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="font-semibold">{success}</span>
            </div>
          )}

          {/* ================= STEP 1: IDENTIFY USER ================= */}
          {step === 1 && (
            <form className="space-y-4" onSubmit={handleRequestOtp}>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Institutional Email, USN, or Employee ID *
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 1DT24CS010, faculty-cse@dsatm.edu.in, or F1023"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Enter your registered Student USN, Faculty Email/Staff ID, or Industry Expert Email to receive a 6-digit OTP.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all"
              >
                <span>{isLoading ? 'Generating Code...' : 'Send 6-Digit OTP'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* ================= STEP 2: VERIFY OTP ================= */}
          {step === 2 && (
            <form className="space-y-4" onSubmit={handleVerifyOtp}>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Enter 6-Digit Verification Code *
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); setSuccess(''); }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Change ID</span>
                  </button>
                </div>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="block w-full pl-10 pr-3 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xl font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 text-center leading-relaxed">
                  Verification code dispatched to your registered email: <strong className="text-indigo-300">{maskedEmail || identifier}</strong>.
                  <br /><span className="text-[10px] text-amber-400/90 font-medium">Please check your inbox &amp; spam folder. If an incorrect code is entered, it will be invalidated immediately.</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || enteredOtp.length !== 6}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <span>{isLoading ? 'Verifying...' : 'Verify OTP'}</span>
                <CheckCircle2 className="h-4 w-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center justify-center space-x-1 mx-auto"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Resend Verification Code</span>
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 3: RESET PASSWORD ================= */}
          {step === 3 && (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  New Password *
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Confirm New Password *
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <span>{isLoading ? 'Updating Password...' : 'Save Password & Go to Login'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Bottom Navigation */}
          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center space-y-2">
            <Link
              href="/login"
              className="inline-flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

