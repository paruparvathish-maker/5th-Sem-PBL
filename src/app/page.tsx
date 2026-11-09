'use client';

import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  BookOpen,
  FileText,
  Award,
  Sparkles,
  Layers,
  Building,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Check,
  Terminal,
  Clock,
  Compass,
  Cpu
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background Blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[400px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-600/10 rounded-full blur-[128px]" />
        <div className="absolute top-[600px] -left-40 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[1200px] -right-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px]" />
      </div>

      {/* ============================================================== */}
      {/* 1. TOP NAVIGATION BAR */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Identity */}
          <Link href="/" className="flex items-center space-x-3.5 group">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black text-white tracking-tight">Industrial PBL</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  DSATM CSE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Dayananda Sagar Academy of Technology &amp; Management
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#overview" className="hover:text-indigo-400 transition-colors">Overview</a>
            <a href="#semesters" className="hover:text-indigo-400 transition-colors">4th &amp; 5th Sem Tracks</a>
            <a href="#roles" className="hover:text-indigo-400 transition-colors">User Access</a>
            <a href="#security" className="hover:text-indigo-400 transition-colors">Security &amp; Auth</a>
          </nav>

          {/* Action Buttons: Login & Sign Up */}
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-200 bg-slate-900/80 hover:bg-slate-800 hover:text-white border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-1.5"
            >
              <span>Sign Up / Create Account</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. HERO SECTION */}
      {/* ============================================================== */}
      <section id="overview" className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Department Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8 backdrop-blur-md shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span>Department of Computer Science &amp; Engineering &bull; Autonomous Institution</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
          Welcome to <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Industrial Project-Based Learning (PBL)
          </span>
        </h1>

        {/* Sub Heading & Innovation Quotation */}
        <div className="mt-6 max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 border border-indigo-500/30 text-indigo-200 text-sm sm:text-lg font-bold tracking-wide shadow-sm">
            <span>✨</span>
            <span className="text-white font-extrabold tracking-wider">Think. Innovate. Build. Launch.</span>
            <span>🚀</span>
          </div>

          <p className="text-base sm:text-xl text-slate-300 font-medium italic leading-relaxed max-w-3xl mx-auto">
            &ldquo;Empowering visionary engineers to think critically, innovate fearlessly, and launch world-class technological solutions.&rdquo;
          </p>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The unified academic and industrial platform for DSATM engineering students, faculty project guides, and enterprise evaluators. Turn research curiosity into published IEEE papers, and translate conceptual designs into working production software.
          </p>
        </div>

        {/* Primary Action Buttons: Sign Up / Create Account and Login */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 max-w-md mx-auto">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/35 hover:shadow-indigo-600/50 hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2"
          >
            <span>Login</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-slate-100 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 shadow-xl shadow-black/20 hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2"
          >
            <span>Sign Up / Create Account</span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </Link>
        </div>

        {/* Three Pillars: Think, Innovate, Launch */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/20 backdrop-blur-md">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>1. Think &amp; Ideate</span>
            </div>
            <p className="text-xs text-slate-300 italic">
              &ldquo;Every great engineering breakthrough starts with the courage to question and the curiosity to think differently.&rdquo;
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-purple-500/20 backdrop-blur-md">
            <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>2. Innovate &amp; Engineer</span>
            </div>
            <p className="text-xs text-slate-300 italic">
              &ldquo;Innovation is not just about ideas; it is the rigorous craft of transforming concepts into robust real-world architectures.&rdquo;
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-pink-500/20 backdrop-blur-md">
            <div className="flex items-center space-x-2 text-pink-400 font-bold text-xs uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              <span>3. Launch &amp; Impact</span>
            </div>
            <p className="text-xs text-slate-300 italic">
              &ldquo;Deploy solutions that make a difference. From campus project repositories directly into industrial production.&rdquo;
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400 font-medium">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-slate-300">Email-Activated Credentials</span>
          </div>
          <div className="flex items-center space-x-1.5 text-indigo-400">
            <Clock className="h-4 w-4" />
            <span className="text-slate-300">5-Min Cryptographic OTP Recovery</span>
          </div>
          <div className="flex items-center space-x-1.5 text-purple-400">
            <Cpu className="h-4 w-4" />
            <span className="text-slate-300">Real-Time Mobile &amp; Desktop Sync</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* LIVE METRICS STRIP */}
        {/* ============================================================== */}
        <div className="mt-16 sm:mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-left">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-indigo-500/40 transition-colors">
            <div className="text-3xl sm:text-4xl font-black text-indigo-400">500+</div>
            <div className="mt-1 text-sm font-bold text-white">Engineering Students</div>
            <p className="mt-1 text-xs text-slate-400">Active student accounts across Sections A to F.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-purple-500/40 transition-colors">
            <div className="text-3xl sm:text-4xl font-black text-purple-400">120+</div>
            <div className="mt-1 text-sm font-bold text-white">Project Teams</div>
            <p className="mt-1 text-xs text-slate-400">Collaborative batches in 4th &amp; 5th semesters.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-pink-500/40 transition-colors">
            <div className="text-3xl sm:text-4xl font-black text-pink-400">100%</div>
            <div className="mt-1 text-sm font-bold text-white">IEEE Research Track</div>
            <p className="mt-1 text-xs text-slate-400">Paper formats &amp; Turnitin plagiarism verification.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-emerald-500/40 transition-colors">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400">1:1</div>
            <div className="mt-1 text-sm font-bold text-white">Faculty Guide Mentorship</div>
            <p className="mt-1 text-xs text-slate-400">Automated guide mapping &amp; rubric gradebooks.</p>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. DUAL SEMESTER TRACKS SECTION */}
      {/* ============================================================== */}
      <section id="semesters" className="py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
              Departmental Curriculum Tracks
            </h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-black text-white">
              Two Specialized Semester Tracks
            </h3>
            <p className="mt-4 text-sm sm:text-base text-slate-400">
              Tailored academic and industrial workflows engineered to advance student competencies from research literature to full-scale working products.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Track 1: 4th Semester IEEE Paper Track */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 sm:p-10 relative overflow-hidden group hover:border-indigo-500/50 transition-all flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
              
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    4th Semester
                  </span>
                </div>

                <h4 className="text-2xl font-black text-white">
                  IEEE Research Paper Track
                </h4>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Transforming conceptual problem statements into peer-reviewed research papers. Students write IEEE 2-column manuscripts under designated faculty guides.
                </p>

                <ul className="mt-6 space-y-3.5 text-xs text-slate-300">
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Literature survey, methodology design &amp; comparative experimental analysis.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Rigorous Turnitin similarity index check (strictly under 15% plagiarism).</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>Formal IEEE manuscript uploads, guide approval checkpoints &amp; conference submission readiness.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Track Coordinator: CSE Research Committee</span>
                <Link
                  href="/login"
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <span>Access Track</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Track 2: 5th Semester Industrial PBL Track */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 sm:p-10 relative overflow-hidden group hover:border-purple-500/50 transition-all flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />
              
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Layers className="h-6 w-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    5th Semester
                  </span>
                </div>

                <h4 className="text-2xl font-black text-white">
                  Industrial Project-Based Learning
                </h4>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Real-world corporate product development. Teams tackle high-impact enterprise problem statements and build full-stack architectures.
                </p>

                <ul className="mt-6 space-y-3.5 text-xs text-slate-300">
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Phase-wise milestone evaluation: SRS Formulation, Architecture Blueprint &amp; Live Prototype.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Direct submission of GitHub codebases, system diagrams, and deployed application URLs.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <Check className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Dual assessment: Internal Faculty Mentors &amp; External Corporate Industry Evaluators.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Track Coordinator: CSE Industrial PBL Cell</span>
                <Link
                  href="/login"
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                >
                  <span>Access Track</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. USER ROLES & ACCESS OVERVIEW */}
      {/* ============================================================== */}
      <section id="roles" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
            Stakeholder Ecosystem
          </h2>
          <h3 className="mt-2 text-3xl sm:text-4xl font-black text-white">
            Tailored Experiences by Role
          </h3>
          <p className="mt-4 text-sm sm:text-base text-slate-400">
            Dedicated portals engineered specifically for each member of the academic community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Role */}
          <div className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">For Students</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Sign up using your College Email &amp; USN. Activate via the automated email link to upload submissions, view mentor rubrics, and track deadlines.
              </p>
              <div className="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 font-mono">
                <div><span className="text-slate-500">Username:</span> USN or College Email</div>
                <div><span className="text-slate-500">Auth:</span> Self-created password</div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <Link href="/signup" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1">
                <span>Sign Up as Student</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Faculty Role */}
          <div className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">For Faculty Guides</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Sign up with your Staff Code &amp; Institutional Email. Your 4th &amp; 5th sem project batches are automatically linked to your guide dashboard.
              </p>
              <div className="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 font-mono">
                <div><span className="text-slate-500">Username:</span> Staff Code or Inst. Email</div>
                <div><span className="text-slate-500">Auth:</span> Self-created password</div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <Link href="/signup" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1">
                <span>Sign Up as Faculty</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Industry & Executive Leadership */}
          <div className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-white">Industry &amp; Leadership</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Executive visibility for Principal, Head of Department, and Industry Experts. Direct access to rubric scoring and departmental audit reports.
              </p>
              <div className="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 font-mono">
                <div><span className="text-slate-500">Main Admin:</span> paruparvathish@gmail.com</div>
                <div><span className="text-slate-500">Executive:</span> Institutional Credentials</div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <Link href="/login" className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center space-x-1">
                <span>Sign In to Executive Portal</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. SECURITY & AUTHENTICATION PROTOCOL */}
      {/* ============================================================== */}
      <section id="security" className="py-20 bg-slate-900/30 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-4">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Enterprise Academic Security</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Self-Service Accounts with Cryptographic Verification
              </h3>
              <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">
                Default static passwords have been completely retired. Every student and faculty member creates their private credential, verified against college email addresses.
              </p>

              <div className="mt-8 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Email Activation Workflow</h5>
                    <p className="mt-1 text-xs text-slate-400">
                      Upon registration, an activation link is dispatched to the user's registered college email. Accounts remain strictly protected until activated.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Strict 5-Minute Timed OTPs</h5>
                    <p className="mt-1 text-xs text-slate-400">
                      Forgot your password? Enter your email to receive a 6-digit OTP valid for exactly 5 minutes. Incorrect entries automatically burn the code.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Automated Batch &amp; Guide Reconciliation</h5>
                    <p className="mt-1 text-xs text-slate-400">
                      When faculty register with their name or staff code, all corresponding 4th sem research teams and 5th sem project batches link automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Security Box */}
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] font-mono text-slate-400">auth.protocol.dsatm.edu.in</span>
              </div>

              <div className="mt-6 space-y-4 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300">
                  <span className="text-indigo-400">$</span> pbl auth --verify-origin <br />
                  <span className="text-emerald-400">&gt; Status: 200 OK • Institution Verified</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300">
                  <span className="text-indigo-400">$</span> pbl token --ttl 300 <br />
                  <span className="text-amber-400">&gt; OTP Active: 5 Minutes Expire Policy [ENFORCED]</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300">
                  <span className="text-indigo-400">$</span> pbl cluster --sync <br />
                  <span className="text-purple-400">&gt; Cloud KV Distributed Replication: Connected</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
                <Link
                  href="/login"
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-center text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30"
                >
                  Sign In to Your Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. CALL TO ACTION BANNER */}
      {/* ============================================================== */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-indigo-950/60 to-purple-950/40 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-600/5 blur-3xl pointer-events-none" />
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              Think. Innovate. Build. Launch.
            </h3>
            <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Join the DSATM Industrial Project-Based Learning (PBL) ecosystem to collaborate on projects, submit IEEE research manuscripts, or review semester deliverables.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <span>Login</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-bold text-slate-100 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center space-x-2"
              >
                <span>Sign Up / Create Account</span>
                <Sparkles className="h-4 w-4 text-purple-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. INSTITUTIONAL FOOTER */}
      {/* ============================================================== */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Column 1: Institution Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Industrial PBL Portal</h4>
                  <p className="text-[11px] text-slate-400">Department of Computer Science &amp; Engineering</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                Dayananda Sagar Academy of Technology &amp; Management (DSATM)<br />
                Autonomous Institution Affiliated to VTU, Approved by AICTE &amp; Accredited by NBA &bull; NAAC A+<br />
                Kanakapura Main Road, Udayapura, Bangalore - 560082, Karnataka, India
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Portal Navigation</h5>
              <ul className="space-y-2">
                <li><Link href="/login" className="hover:text-indigo-400 transition-colors">Sign In / Login</Link></li>
                <li><Link href="/signup" className="hover:text-indigo-400 transition-colors">Create Account / Sign Up</Link></li>
                <li><Link href="/forgot-password" className="hover:text-indigo-400 transition-colors">Forgot Password (OTP)</Link></li>
                <li><Link href="/activate" className="hover:text-indigo-400 transition-colors">Activate Account</Link></li>
              </ul>
            </div>

            {/* Column 3: Administration */}
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3">System Administration</h5>
              <ul className="space-y-2 text-[11px]">
                <li><strong className="text-slate-300">Coordinator:</strong> Mr. Parvathisha Pudugosula</li>
                <li><strong className="text-slate-300">Admin Email:</strong> paruparvathish@gmail.com</li>
                <li><strong className="text-slate-300">Department:</strong> CSE Industrial PBL Cell</li>
                <li><strong className="text-slate-300">Academic Year:</strong> 2025 – 2026</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <p>
              &copy; {new Date().getFullYear()} Dayananda Sagar Academy of Technology &amp; Management. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-slate-500">
              <span>Industrial PBL System</span>
              <span>&bull;</span>
              <span>IEEE Publication &amp; Evaluation</span>
              <span>&bull;</span>
              <span>v2.4 Enterprise</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
