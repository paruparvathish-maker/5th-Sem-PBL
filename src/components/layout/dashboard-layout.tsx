'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  GraduationCap, LayoutDashboard, Users, Calendar, UploadCloud, 
  Award, Bot, BookOpen, ShieldAlert, LogOut, Menu, X, Bell, FileSpreadsheet, 
  History, CheckCircle2, Globe, User, KeyRound, Sparkles, ChevronDown, Settings
} from 'lucide-react';
import { store } from '@/lib/data/store';
import { isExecutiveViewer, getIndustryPersonAccess } from '@/lib/auth/roles';
import { ProfileModal } from '@/components/profile/profile-modal';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'profile' | 'password' | 'ai' | null>(null);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Universal database hydration for mobile phones and desktop clients
  useEffect(() => {
    store.syncFromSupabase().catch(() => {});
  }, []);

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-medium">Loading session...</div>;

  const notifications = store.getNotificationsForUser(user.id);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Navigation Links based on user role
  const isExec = isExecutiveViewer(user);
  const industryAccess = getIndustryPersonAccess(user);

  const userHomeHref = user.role === 'student'
    ? '/student/dashboard'
    : user.role === 'faculty'
    ? '/faculty/dashboard'
    : '/admin/dashboard';

  const navItems = user.role === 'student' ? [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Team', href: '/student/team', icon: Users },
    { label: 'Deadlines', href: '/student/deadlines', icon: Calendar },
    { label: 'Submissions', href: '/student/submissions', icon: UploadCloud },
    { label: 'My Marks', href: '/student/marks', icon: Award },
    { label: 'AI Project Assistant', href: '/student/ai-assistant', icon: Bot },
  ] : user.role === 'faculty' ? [
    { label: 'Dashboard', href: '/faculty/dashboard', icon: LayoutDashboard },
    { label: 'Assigned Teams', href: '/faculty/teams', icon: Users },
    { label: 'Submissions & Docs', href: '/faculty/documents', icon: UploadCloud },
    { label: 'Evaluations & Grading', href: '/faculty/evaluations', icon: Award },
    { label: 'Guide Meetings', href: '/faculty/meetings', icon: Calendar },
  ] : isExec ? [
    // Executive Leadership (HOD, Principal, Industry Expert) - Read-only view for 4th Sem papers & 5th Sem projects only
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: '4th & 5th Sem Projects', href: '/admin/teams', icon: GraduationCap },
  ] : [
    // Main Admin - Full administrative control
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Student Management', href: '/admin/students', icon: Users },
    { label: 'Faculty Allocation', href: '/admin/faculty', icon: BookOpen },
    { label: 'Team Management', href: '/admin/teams', icon: GraduationCap },
    { label: 'Deadline Config', href: '/admin/deadlines', icon: Calendar },
    { label: 'Excel Import Module', href: '/admin/import', icon: FileSpreadsheet },
    { label: 'Audit Trail Logs', href: '/admin/audit-logs', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800 shrink-0">
        <Link href={userHomeHref} className="p-5 border-b border-slate-800 flex items-center space-x-3 hover:bg-slate-800/40 transition-colors cursor-pointer group">
          <div className="h-11 w-11 rounded-full bg-white p-0.5 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <img
              src="/dsatm-logo.png"
              alt="DSATM Logo"
              className="h-full w-full object-contain rounded-full"
            />
          </div>
          <div>
            <h1 className="font-bold text-base text-white leading-tight group-hover:text-indigo-300 transition-colors">Industrial PBL</h1>
            <p className="text-xs text-slate-400 font-medium">DSATM CSE Dept</p>
          </div>
        </Link>

        {/* User Card with Quick Profile & AI Options */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-800/90 border border-slate-700/60 shadow-lg">
          <div 
            onClick={() => setActiveModalTab('profile')}
            className="flex items-center space-x-3 cursor-pointer group"
            title="Click to view full user profile"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">{user.name}</p>
                <Settings className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-colors" />
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {user.role === 'student' ? user.usn : user.email}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-700/50">
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
              industryAccess.isIndustry ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
              isExec ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              user.role === 'admin' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
              user.role === 'faculty' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {industryAccess.isIndustry ? 'Industry Expert' : (user.email === 'vp@dsatm.edu.in' || user.id === 'admin-hod') ? 'Vice Principal & HOD' : (user.id === 'admin-principal' || (user.email || '').toLowerCase() === 'principal@dsatm.edu.in') ? 'Principal' : isExec ? 'Executive Observer' : user.role === 'admin' ? 'Super Admin' : user.role}
            </span>
            {industryAccess.isIndustry ? (
              <span className="text-[10px] font-semibold text-slate-300 bg-slate-700 px-2 py-0.5 rounded">
                Sec {industryAccess.allAllowedSections.join(', ')}
              </span>
            ) : user.section ? (
              <span className="text-xs font-semibold text-slate-300 bg-slate-700 px-2 py-0.5 rounded">
                Sec {user.section}
              </span>
            ) : null}
          </div>

          {/* Quick Action Badges */}
          <div className="mt-3 pt-2 border-t border-slate-700/40 grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setActiveModalTab('profile')}
              className="py-1 px-1.5 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-700/70 transition flex items-center justify-center space-x-1"
              title="View User Profile"
            >
              <User className="h-3 w-3 text-indigo-400" />
              <span>Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModalTab('password')}
              className="py-1 px-1.5 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-700/70 transition flex items-center justify-center space-x-1"
              title="Change Password"
            >
              <KeyRound className="h-3 w-3 text-amber-400" />
              <span>Pass</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModalTab('ai')}
              className="py-1 px-1.5 rounded-lg text-[10px] font-bold text-purple-300 hover:text-white hover:bg-purple-900/50 transition flex items-center justify-center space-x-1"
              title="AI Project Copilot"
            >
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span>AI</span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link href={userHomeHref} className="flex items-center space-x-2 md:hidden">
              <img
                src="/dsatm-logo.png"
                alt="DSATM Logo"
                className="h-8 w-8 rounded-full object-contain bg-white p-0.5 ring-1 ring-slate-300 shadow-sm"
              />
              <span className="font-bold text-sm text-slate-900">Industrial PBL</span>
            </Link>
            <h2 className="text-lg font-bold text-slate-800 capitalize hidden sm:block">
              {pathname.split('/')[2]?.replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-sm text-slate-800">Notifications</h3>
                    <span className="text-xs text-slate-500 font-medium">{notifications.length} total</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto mt-2 divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No notifications yet.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="py-2.5 text-xs">
                          <p className="font-semibold text-slate-800">{n.title}</p>
                          <p className="text-slate-600 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <Link
              href={userHomeHref}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
              title="Go to My Dashboard Home"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-indigo-600" />
              <span className="hidden sm:inline font-bold">Home</span>
            </Link>

            <div className="h-6 w-px bg-slate-200" />

            {/* User Profile Trigger & Dropdown Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-all border border-slate-200/80 bg-slate-50/70 shadow-sm cursor-pointer group"
                title="Account options: View Profile, Change Password, AI Copilot"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-sm ring-2 ring-indigo-500/20 group-hover:scale-105 transition-transform">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider">
                    {user.role}
                  </p>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${showProfileMenu ? 'rotate-180 text-indigo-600' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                        {user.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 font-mono truncate">{user.email || user.usn}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-1 space-y-0.5 text-xs font-semibold text-slate-700">
                    {/* Option 1: User Profile */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveModalTab('profile');
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-700 transition text-left cursor-pointer group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block font-bold text-slate-900 group-hover:text-indigo-700">User Profile</span>
                        <span className="text-[10px] text-slate-400 font-normal">Account, Section &amp; Team Details</span>
                      </div>
                    </button>

                    {/* Option 2: Change Password */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveModalTab('password');
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 hover:text-amber-800 transition text-left cursor-pointer group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block font-bold text-slate-900 group-hover:text-amber-800">Change Password</span>
                        <span className="text-[10px] text-slate-400 font-normal">Update Security Credentials</span>
                      </div>
                    </button>

                    {/* Option 3: AI Project Copilot */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveModalTab('ai');
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-purple-50 hover:text-purple-800 transition text-left cursor-pointer group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="block font-bold text-slate-900 group-hover:text-purple-800">AI Project Copilot</span>
                          <span className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.2 rounded font-extrabold uppercase">AI</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal">Ideation, IEEE Papers &amp; Rubrics</span>
                      </div>
                    </button>
                  </div>

                  <div className="pt-1 mt-1 border-t border-slate-100 p-1">
                    <button
                      type="button"
                      onClick={logout}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-slate-900 text-white p-4 space-y-2 border-b border-slate-800 animate-in slide-in-from-top-2">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <img
                src="/dsatm-logo.png"
                alt="DSATM Logo"
                className="h-10 w-10 rounded-full object-contain bg-white p-0.5 ring-2 ring-indigo-500/40 shrink-0"
              />
              <div>
                <h1 className="font-bold text-sm text-white">Industrial PBL</h1>
                <p className="text-[11px] text-slate-400">DSATM CSE Dept</p>
              </div>
            </div>

            {/* Mobile User Profile Quick Trigger */}
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700/60 my-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-[150px]">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{user.email || user.usn}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300">
                  {user.role}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setActiveModalTab('profile');
                  }}
                  className="py-1 px-2 rounded-lg text-[10px] font-bold text-slate-200 bg-slate-700/80 hover:bg-slate-700 flex items-center justify-center space-x-1"
                >
                  <User className="h-3 w-3 text-indigo-400" />
                  <span>Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setActiveModalTab('password');
                  }}
                  className="py-1 px-2 rounded-lg text-[10px] font-bold text-slate-200 bg-slate-700/80 hover:bg-slate-700 flex items-center justify-center space-x-1"
                >
                  <KeyRound className="h-3 w-3 text-amber-400" />
                  <span>Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setActiveModalTab('ai');
                  }}
                  className="py-1 px-2 rounded-lg text-[10px] font-bold text-purple-300 bg-purple-900/40 hover:bg-purple-900/60 flex items-center justify-center space-x-1"
                >
                  <Sparkles className="h-3 w-3 text-purple-400" />
                  <span>AI</span>
                </button>
              </div>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    pathname === item.href ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Page Children Container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Profile, Password & AI Copilot Modal */}
      <ProfileModal
        isOpen={activeModalTab !== null}
        onClose={() => setActiveModalTab(null)}
        initialTab={activeModalTab || 'profile'}
      />
    </div>
  );
}
