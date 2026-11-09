'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, UserCheck, Briefcase, Lock, Mail,
  User, Phone, ArrowRight, CheckCircle2, AlertCircle,
  Eye, EyeOff, Hash, Sparkles, Building
} from 'lucide-react';

type SignUpRole = 'student' | 'faculty' | 'industry';

export default function SignUpPage() {
  const router = useRouter();

  const [role, setRole] = useState<SignUpRole>('student');

  // Common fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Student specific
  const [usn, setUsn] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentName, setStudentName] = useState('');
  const [section, setSection] = useState('A');

  // Faculty specific
  const [employeeId, setEmployeeId] = useState('');
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [facultyPhone, setFacultyPhone] = useState('');

  // Industry specific
  const [industryEmail, setIndustryEmail] = useState('');
  const [industryName, setIndustryName] = useState('');
  const [industryPhone, setIndustryPhone] = useState('');
  const [organization, setOrganization] = useState('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRoleChange = (newRole: SignUpRole) => {
    setRole(newRole);
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsSubmitting(true);

    let payload: any = { role, password, confirmPassword };

    if (role === 'student') {
      if (!usn.trim()) {
        setError('Please enter your University Seat Number (USN).');
        setIsSubmitting(false);
        return;
      }
      if (!studentEmail.trim()) {
        setError('Please enter your Email address.');
        setIsSubmitting(false);
        return;
      }
      payload = {
        ...payload,
        usn: usn.trim().toUpperCase(),
        email: studentEmail.trim(),
        name: studentName.trim() || undefined,
        section
      };
    } else if (role === 'faculty') {
      if (!employeeId.trim()) {
        setError('Please enter your Employee ID / Staff Code.');
        setIsSubmitting(false);
        return;
      }
      if (!facultyEmail.trim()) {
        setError('Please enter your official Institutional Email.');
        setIsSubmitting(false);
        return;
      }
      if (!facultyName.trim()) {
        setError('Please enter your Full Name.');
        setIsSubmitting(false);
        return;
      }
      payload = {
        ...payload,
        employeeId: employeeId.trim().toUpperCase(),
        email: facultyEmail.trim(),
        name: facultyName.trim(),
        phone: facultyPhone.trim() || undefined
      };
    } else if (role === 'industry') {
      if (!industryEmail.trim()) {
        setError('Please enter your Email address.');
        setIsSubmitting(false);
        return;
      }
      if (!industryName.trim()) {
        setError('Please enter your Full Name.');
        setIsSubmitting(false);
        return;
      }
      payload = {
        ...payload,
        email: industryEmail.trim(),
        name: industryName.trim(),
        phone: industryPhone.trim() || undefined,
        organization: organization.trim() || undefined
      };
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to create account.');
      } else {
        setSuccessMessage(data.message || 'Account created successfully!');
        setTimeout(() => {
          router.push('/login');
        }, 2200);
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-grid-pattern selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Blur */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 text-center">
        <div className="mb-3">
          <Link
            href="/"
            className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <span>&larr; Back to Portal Home</span>
          </Link>
        </div>
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
            <p className="text-xs text-indigo-300 font-medium">DSATM Portal Registration</p>
          </div>
        </Link>
        <p className="text-sm text-slate-400 mt-1">
          Create your account for academic project evaluation &amp; tracking
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg z-10 px-4">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/60 sm:px-10">
          
          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900/80 rounded-xl mb-6 border border-slate-700/50">
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                role === 'student'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('faculty')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                role === 'faculty'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Faculty</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('industry')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                role === 'industry'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Industry</span>
            </button>
          </div>

          {/* Success Notification */}
          {successMessage && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start space-x-2">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-emerald-200">Registration Successful!</p>
                <p className="mt-1">{successMessage}</p>
                <p className="mt-2 text-emerald-400 font-semibold">Redirecting to login in a moment...</p>
              </div>
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* ==================== STUDENT FIELDS ==================== */}
            {role === 'student' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    University Seat Number (USN) *
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Hash className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={usn}
                      onChange={(e) => setUsn(e.target.value.toUpperCase())}
                      placeholder="e.g. 1DT24CS010"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-indigo-400 mt-1 font-medium">
                    Important: You will log in using your USN as your username.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Student Email Address *
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="student@dsatm.edu.in or personal email"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Full Name (Optional)
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="e.g. Achut Mallikarjun"
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Section
                    </label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="block w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                      <option value="E">Section E</option>
                      <option value="F">Section F</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* ==================== FACULTY FIELDS ==================== */}
            {role === 'faculty' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Employee ID / Staff Code *
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Hash className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                        placeholder="e.g. F1023 or EMP01"
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={facultyName}
                        onChange={(e) => setFacultyName(e.target.value)}
                        placeholder="e.g. Dr. Usha K C"
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Institutional Email Address *
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={facultyEmail}
                      onChange={(e) => setFacultyEmail(e.target.value)}
                      placeholder="faculty-cse@dsatm.edu.in"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={facultyPhone}
                      onChange={(e) => setFacultyPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-[11px] text-amber-400 mt-1 font-medium">
                    Note: You can log in using either your Employee ID or Institutional Email.
                  </p>
                </div>
              </>
            )}

            {/* ==================== INDUSTRY FIELDS ==================== */}
            {role === 'industry' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={industryName}
                        onChange={(e) => setIndustryName(e.target.value)}
                        placeholder="e.g. Mr. Raghu"
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Company / Organization
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Building className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Company Name"
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Official Email Address *
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={industryEmail}
                      onChange={(e) => setIndustryEmail(e.target.value)}
                      placeholder="expert@company.com or raghu.industry@dsatm.edu.in"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Mobile Number
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      value={industryPhone}
                      onChange={(e) => setIndustryPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-[11px] text-emerald-400 mt-1 font-medium">
                    Note: You can log in using your Email as username.
                  </p>
                </div>
              </>
            )}

            {/* ==================== PASSWORDS ==================== */}
            <div className="pt-2 border-t border-slate-700/60">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Create New Password *
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                Confirm Password *
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
                  placeholder="Re-enter password"
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

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center items-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all ${
                  role === 'student' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30' :
                  role === 'faculty' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30' :
                  'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                <span>{isSubmitting ? 'Creating Account...' : 'Create Account & Continue to Login'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Bottom Navigation */}
          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold underline transition-colors">
                Log In to your account
              </Link>
            </p>
            <div>
              <Link href="/forgot-password" className="text-[11px] text-slate-400 hover:text-slate-300 transition-colors">
                Forgot your password?
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

