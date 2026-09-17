'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  GraduationCap, LayoutDashboard, Users, Calendar, UploadCloud, 
  Award, Bot, BookOpen, ShieldAlert, LogOut, Menu, X, Bell, FileSpreadsheet, History, CheckCircle2 
} from 'lucide-react';
import { store } from '@/lib/data/store';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-medium">Loading session...</div>;

  const notifications = store.getNotificationsForUser(user.id);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Navigation Links based on user role
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
  ] : [
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
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white leading-tight">PBL Portal</h1>
            <p className="text-xs text-slate-400 font-medium">DSATM CSE Dept</p>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-indigo-600/30 text-indigo-400 font-semibold flex items-center justify-center border border-indigo-500/30 text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">
                {user.role === 'student' ? user.usn : user.email}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-700/40">
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
              user.role === 'admin' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
              user.role === 'faculty' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {user.role}
            </span>
            {user.section && (
              <span className="text-xs font-semibold text-slate-300 bg-slate-700 px-2 py-0.5 rounded">
                Sec {user.section}
              </span>
            )}
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

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-700">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-slate-900 text-white p-4 space-y-2 border-b border-slate-800 animate-in slide-in-from-top-2">
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
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10"
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
    </div>
  );
}
