'use client';

import React, { useState } from 'react';
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
  Cpu,
  Lightbulb,
  Rocket,
  Code2,
  BarChart3,
  Globe,
  Star,
  CheckCheck,
  ShieldAlert,
  FolderGit2
} from 'lucide-react';

export default function HomePage() {
  const [activePreviewTab, setActivePreviewTab] = useState<'sem4' | 'sem5'>('sem5');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Background Tech Grids & Ambient Radial Glows */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none -z-20 opacity-70" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-tr from-indigo-600/25 via-purple-600/20 to-pink-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-[800px] -left-48 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[160px]" />
        <div className="absolute top-[1600px] -right-48 w-[700px] h-[700px] bg-purple-600/15 rounded-full blur-[180px]" />
      </div>

      {/* ============================================================== */}
      {/* 1. TOP NAVIGATION BAR */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Identity */}
          <Link href="/" className="flex items-center space-x-3.5 group">
            <div className="relative h-12 w-12 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 shadow-xl shadow-indigo-500/25 group-hover:scale-105 transition-all duration-300 flex items-center justify-center shrink-0">
              <img
                src="/dsatm-logo.png"
                alt="Dayananda Sagar Academy of Technology & Management"
                className="h-full w-full object-contain rounded-full bg-white p-0.5"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                  Industrial PBL
                </span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  DSATM CSE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Dayananda Sagar Academy of Technology &amp; Management
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-300">
            <a href="#overview" className="hover:text-indigo-400 transition-colors">Overview</a>
            <a href="#simulator" className="hover:text-indigo-400 transition-colors">Interactive Preview</a>
            <a href="#semesters" className="hover:text-indigo-400 transition-colors">Curriculum Tracks</a>
            <a href="#roles" className="hover:text-indigo-400 transition-colors">Stakeholders</a>
            <a href="#security" className="hover:text-indigo-400 transition-colors">Security &amp; Auth</a>
          </nav>

          {/* Action Buttons: Login & Sign Up */}
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800 hover:text-white border border-slate-700/80 hover:border-slate-600 shadow-sm transition-all"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-1.5"
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
      <section id="overview" className="relative pt-10 pb-16 md:pt-16 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* DSATM Institutional Emblem Showcase */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-2.5 rounded-full bg-gradient-to-r from-amber-400 via-indigo-500 to-purple-600 opacity-70 blur-xl group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
            <div className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-white p-2 shadow-2xl ring-4 ring-white/30 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
              <img
                src="/dsatm-logo.png"
                alt="Dayananda Sagar Academy of Technology & Management (DSATM) Official Seal"
                className="h-full w-full object-contain rounded-full"
              />
            </div>
          </div>
          <span className="mt-4 text-xs sm:text-sm font-extrabold text-amber-300 tracking-wider uppercase">
            Dayananda Sagar Academy of Technology &amp; Management
          </span>
        </div>

        {/* Department Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-8 backdrop-blur-md shadow-md animate-float">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Department of Computer Science &amp; Engineering &bull; Autonomous Institution</span>
          <span className="hidden sm:inline text-indigo-400/60">&bull;</span>
          <span className="hidden sm:inline text-slate-300">NAAC A+ &bull; NBA Accredited</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] max-w-5xl mx-auto">
          Welcome to <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Industrial Project-Based Learning (PBL)
          </span>
        </h1>

        {/* Sub Heading & Innovation Quotation */}
        <div className="mt-8 max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 border border-indigo-500/40 text-indigo-200 text-sm sm:text-xl font-black tracking-wide shadow-lg shadow-indigo-500/10">
            <span>✨</span>
            <span className="text-white font-extrabold tracking-wider">Think. Innovate. Build. Launch.</span>
            <span>🚀</span>
          </div>

          <p className="text-lg sm:text-2xl text-slate-200 font-medium italic leading-relaxed max-w-3xl mx-auto">
            &ldquo;Empowering visionary engineers to think critically, innovate fearlessly, and launch world-class technological solutions.&rdquo;
          </p>

          <p className="text-xs sm:text-base text-slate-400 max-w-3xl mx-auto leading-relaxed">
            The unified academic and industrial platform for DSATM engineering students, faculty project mentors, and enterprise evaluators. Turn research curiosity into published IEEE papers, and translate conceptual designs into working production software.
          </p>
        </div>

        {/* Primary Action Buttons: Sign Up / Create Account and Login */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 max-w-md mx-auto">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/35 hover:shadow-indigo-600/50 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center space-x-2.5 group"
          >
            <span>Login to Portal</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold text-slate-100 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 shadow-xl shadow-black/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center space-x-2"
          >
            <span>Sign Up / Create Account</span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </Link>
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
        {/* THREE INNOVATION PILLARS (THINK, INNOVATE, LAUNCH) */}
        {/* ============================================================== */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto text-left">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-indigo-500/25 backdrop-blur-xl hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div className="flex items-center space-x-2 text-indigo-400 font-black text-xs uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>1. Think &amp; Ideate</span>
            </div>
            <p className="text-sm text-slate-300 font-medium italic leading-relaxed">
              &ldquo;Every great engineering breakthrough starts with the courage to question assumptions and the curiosity to think differently.&rdquo;
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-purple-500/25 backdrop-blur-xl hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="h-5 w-5" />
            </div>
            <div className="flex items-center space-x-2 text-purple-400 font-black text-xs uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>2. Innovate &amp; Engineer</span>
            </div>
            <p className="text-sm text-slate-300 font-medium italic leading-relaxed">
              &ldquo;Innovation is not just about ideas; it is the rigorous craft of transforming conceptual algorithms into robust real-world architectures.&rdquo;
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/80 border border-pink-500/25 backdrop-blur-xl hover:border-pink-500/50 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 group">
            <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-4 group-hover:scale-110 transition-transform">
              <Rocket className="h-5 w-5" />
            </div>
            <div className="flex items-center space-x-2 text-pink-400 font-black text-xs uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
              <span>3. Launch &amp; Impact</span>
            </div>
            <p className="text-sm text-slate-300 font-medium italic leading-relaxed">
              &ldquo;Deploy solutions that make a tangible difference. From campus project repositories directly into industrial production.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. INTERACTIVE LIVE PLATFORM SIMULATOR (THE WOW COMPONENT) */}
      {/* ============================================================== */}
      <section id="simulator" className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3.5 py-1.5 rounded-full border border-indigo-500/20">
            Live Interactive Showcase
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-white">
            Experience the Digital Workflow
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Switch between the 4th semester IEEE Research Paper track and the 5th semester Industrial PBL project stream.
          </p>
        </div>

        {/* The Mock Window Container */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-700/80 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Top Window Chrome */}
          <div className="bg-slate-950/90 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/90" />
              <div className="w-3 h-3 rounded-full bg-amber-500/90" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/90" />
              <span className="ml-3 font-mono text-xs text-slate-400 hidden sm:inline">portal.dsatm.edu.in/pbl-workspace</span>
            </div>

            {/* Interactive Toggle Pill */}
            <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-700/80">
              <button
                type="button"
                onClick={() => setActivePreviewTab('sem4')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePreviewTab === 'sem4'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                4th Sem IEEE Paper
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('sem5')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePreviewTab === 'sem5'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                5th Sem Industrial PBL
              </button>
            </div>
          </div>

          {/* Window Body */}
          <div className="p-6 sm:p-10">
            {activePreviewTab === 'sem4' ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-400 mb-1">
                      <FileText className="h-4 w-4" />
                      <span>4th Semester &bull; Section A &bull; Batch 4A-08</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Deep Learning-Based Automated Defect Detection in Semiconductor Wafers
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Guide: <strong className="text-slate-200">Dr. C Nandini</strong> &bull; Industry Supervisor: <strong className="text-slate-200">Mr. Girish</strong>
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1.5">
                      <CheckCheck className="h-4 w-4" />
                      <span>IEEE Format Verified</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Metric 1 */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div className="text-xs text-slate-400 font-semibold">Turnitin Plagiarism Score</div>
                    <div className="mt-2 flex items-baseline space-x-2">
                      <span className="text-3xl font-black text-emerald-400">8%</span>
                      <span className="text-xs text-emerald-400/80 font-bold">Passed (&lt; 15% Max)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: '8%' }} />
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div className="text-xs text-slate-400 font-semibold">Review Milestone 1</div>
                    <div className="mt-2 text-3xl font-black text-indigo-400">19 / 20</div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Literature survey and methodology accepted with honors.
                    </p>
                  </div>

                  {/* Metric 3 */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div className="text-xs text-slate-400 font-semibold">Publication Status</div>
                    <div className="mt-2 text-lg font-black text-purple-300">Camera-Ready Accepted</div>
                    <p className="mt-2 text-[11px] text-slate-400 font-mono">
                      IEEE Xplore Conference Submission
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-purple-400 mb-1">
                      <Layers className="h-4 w-4" />
                      <span>5th Semester &bull; Section C &bull; Team 5C-04</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Autonomous Cloud-Native Edge Telemetry &amp; Robotic Sorting Engine
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Guide: <strong className="text-slate-200">Mr. Parvathisha Pudugosula</strong> &bull; Industry Evaluator: <strong className="text-slate-200">Ms. Harshitha R</strong>
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center space-x-1.5">
                      <Rocket className="h-4 w-4" />
                      <span>Live Production Demo</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Metric 1 */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div className="text-xs text-slate-400 font-semibold">Sprint Milestones</div>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-3xl font-black text-white">Phase 3</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">Completed</span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      SRS Formulation &bull; System Blueprint &bull; Working Prototype
                    </p>
                  </div>

                  {/* Metric 2 */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div className="text-xs text-slate-400 font-semibold">Industry Rubric Score</div>
                    <div className="mt-2 text-3xl font-black text-purple-400">19.5 / 20</div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Grade: <strong className="text-white">O (Outstanding)</strong> &bull; Verified by Industry Panel
                    </p>
                  </div>

                  {/* Metric 3 */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <div className="text-xs text-slate-400 font-semibold">Codebase &amp; Architecture</div>
                    <div className="mt-2 flex items-center space-x-2 text-indigo-400 font-mono text-xs">
                      <FolderGit2 className="h-4 w-4" />
                      <span>github.com/dsatm-cse/pbl-5c-04</span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Next.js &bull; Fastify &bull; Edge Microcontrollers
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. LIVE METRICS STRIP */}
      {/* ============================================================== */}
      <section className="py-12 border-y border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md hover:border-indigo-500/40 transition-colors">
            <div className="text-3xl sm:text-4xl font-black text-indigo-400">500+</div>
            <div className="mt-1 text-sm font-bold text-white">Engineering Students</div>
            <p className="mt-1 text-xs text-slate-400">Active student accounts across Sections A to F.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md hover:border-purple-500/40 transition-colors">
            <div className="text-3xl sm:text-4xl font-black text-purple-400">120+</div>
            <div className="mt-1 text-sm font-bold text-white">Project Teams</div>
            <p className="mt-1 text-xs text-slate-400">Collaborative batches in 4th &amp; 5th semesters.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md hover:border-pink-500/40 transition-colors">
            <div className="text-3xl sm:text-4xl font-black text-pink-400">100%</div>
            <div className="mt-1 text-sm font-bold text-white">IEEE Research Track</div>
            <p className="mt-1 text-xs text-slate-400">Paper formats &amp; Turnitin plagiarism verification.</p>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md hover:border-emerald-500/40 transition-colors">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400">1:1</div>
            <div className="mt-1 text-sm font-bold text-white">Faculty Guide Mentorship</div>
            <p className="mt-1 text-xs text-slate-400">Automated guide mapping &amp; rubric gradebooks.</p>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. CURRICULUM TRACKS IN-DEPTH */}
      {/* ============================================================== */}
      <section id="semesters" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
            Curriculum Architecture
          </h2>
          <h3 className="mt-2 text-3xl sm:text-4xl font-black text-white">
            Two Specialized Academic Paths
          </h3>
          <p className="mt-4 text-sm sm:text-base text-slate-400">
            Tailored engineering workflows engineered to advance student competencies from research literature to full-scale working products.
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
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
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
              <span className="text-xs font-semibold text-slate-400">Track: CSE Research Committee</span>
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
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
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
              <span className="text-xs font-semibold text-slate-400">Track: CSE Industrial PBL Cell</span>
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
      </section>

      {/* ============================================================== */}
      {/* 6. USER ROLES & ACCESS OVERVIEW */}
      {/* ============================================================== */}
      <section id="roles" className="py-20 bg-slate-900/30 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
              User Experiences
            </h2>
            <h3 className="mt-2 text-3xl sm:text-4xl font-black text-white">
              Tailored Portals for Every Member
            </h3>
            <p className="mt-4 text-sm sm:text-base text-slate-400">
              Dedicated interfaces engineered specifically for each member of the academic and corporate community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Student Role */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5 border border-indigo-500/20">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-bold text-white">For Students</h4>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  Sign up using your College Email &amp; USN. Activate via the automated email link to upload submissions, view mentor rubrics, and track deadlines.
                </p>
                <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 font-mono">
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
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5 border border-amber-500/20">
                  <Users className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-bold text-white">For Faculty Guides</h4>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  Sign up with your Staff Code &amp; Institutional Email. Your 4th &amp; 5th sem project batches are automatically linked to your guide dashboard.
                </p>
                <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 font-mono">
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
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5 border border-purple-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-bold text-white">Industry &amp; Leadership</h4>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  Executive visibility for Principal, Head of Department, and Industry Experts. Direct access to rubric scoring and departmental audit reports.
                </p>
                <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 font-mono">
                  <div><span className="text-slate-500">Main Admin:</span> paruparvathish@gmail.com</div>
                  <div><span className="text-slate-500">Leadership:</span> Institutional Credentials</div>
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
        </div>
      </section>

      {/* ============================================================== */}
      {/* 7. SECURITY & AUTHENTICATION PROTOCOL */}
      {/* ============================================================== */}
      <section id="security" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-4">
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
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
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
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
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
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
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

          {/* Visual Security Terminal */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[11px] font-mono text-slate-400">security.dsatm.edu.in</span>
            </div>

            <div className="mt-6 space-y-4 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300">
                <span className="text-indigo-400">$</span> pbl auth --verify-origin <br />
                <span className="text-emerald-400">&gt; Status: 200 OK &bull; Institution Verified</span>
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
                className="w-full py-3.5 px-4 rounded-xl text-xs font-bold text-center text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30"
              >
                Sign In to Your Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. CALL TO ACTION BANNER */}
      {/* ============================================================== */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-indigo-950/60 to-purple-950/40 border border-indigo-500/40 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-600/5 blur-3xl pointer-events-none" />
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-white p-1 ring-4 ring-indigo-400/30 shadow-2xl flex items-center justify-center">
                <img
                  src="/dsatm-logo.png"
                  alt="DSATM Seal"
                  className="h-full w-full object-contain rounded-full"
                />
              </div>
            </div>
            <h3 className="text-3xl sm:text-5xl font-black text-white">
              Think. Innovate. Build. Launch.
            </h3>
            <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Join the DSATM Industrial Project-Based Learning (PBL) ecosystem to collaborate on projects, submit IEEE research manuscripts, or review semester deliverables.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <span>Login</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold text-slate-100 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center space-x-2"
              >
                <span>Sign Up / Create Account</span>
                <Sparkles className="h-4 w-4 text-purple-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 9. INSTITUTIONAL FOOTER */}
      {/* ============================================================== */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Column 1: Institution Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-white p-1 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-600/30 flex items-center justify-center shrink-0">
                  <img
                    src="/dsatm-logo.png"
                    alt="DSATM Emblem"
                    className="h-full w-full object-contain rounded-full"
                  />
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
                <li><Link href="/login" className="hover:text-indigo-400 transition-colors">Login</Link></li>
                <li><Link href="/signup" className="hover:text-indigo-400 transition-colors">Sign Up / Create Account</Link></li>
                <li><Link href="/forgot-password" className="hover:text-indigo-400 transition-colors">Forgot Password (5-Min OTP)</Link></li>
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
                <li><strong className="text-slate-300">Academic Year:</strong> 2025 &ndash; 2026</li>
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
              <span>v2.5 Enterprise Edition</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
