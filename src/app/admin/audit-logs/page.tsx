'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import Link from 'next/link';
import { 
  History, ShieldAlert, FileText, User, Lock, Search, RefreshCw, 
  LogIn, LogOut, Award, UploadCloud, KeyRound, CheckCircle2, 
  Activity, ShieldCheck, Filter 
} from 'lucide-react';
import { isExecutiveViewer } from '@/lib/auth/roles';
import { AuditLogItem } from '@/lib/types/pbl';

type FilterCategory = 'ALL' | 'AUTH' | 'EVAL' | 'SUBMISSION' | 'ADMIN';

export default function AdminAuditLogsPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (isExecutiveViewer(user)) {
    return (
      <DashboardLayout>
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto space-y-4 my-12 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            System audit trail logs and security event histories are restricted to the Main Administrator.
            Executive leadership accounts have access to supervise 4th Sem Research Papers and 5th Sem PBL Projects.
          </p>
          <Link
            href="/admin/teams"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
          >
            Go to 4th &amp; 5th Sem Projects
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const [logs, setLogs] = useState<AuditLogItem[]>(store.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('ALL');
  const [isSyncing, setIsSyncing] = useState(true);

  const fetchLogs = async () => {
    setIsSyncing(true);
    try {
      await store.syncFromSupabase();
      let localLogs = store.getAuditLogs();
      try {
        const res = await fetch('/api/audit/log');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.auditLogs) && data.auditLogs.length > 0) {
            const map = new Map(localLogs.map(l => [l.id, l]));
            data.auditLogs.forEach((l: AuditLogItem) => map.set(l.id, { ...(map.get(l.id) || {}), ...l }));
            localLogs = Array.from(map.values());
          }
        }
      } catch {}
      localLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLogs([...localLogs]);
    } catch {}
    setIsSyncing(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Categorize log action
  const getLogCategory = (action: string): FilterCategory => {
    const act = (action || '').toLowerCase();
    if (act.includes('log in') || act.includes('logged in') || act.includes('log out') || act.includes('logged out') || act.includes('session')) {
      return 'AUTH';
    }
    if (act.includes('evaluation') || act.includes('marks') || act.includes('grade')) {
      return 'EVAL';
    }
    if (act.includes('submission') || act.includes('paper') || act.includes('proof') || act.includes('file')) {
      return 'SUBMISSION';
    }
    return 'ADMIN';
  };

  const authLogsCount = logs.filter(l => getLogCategory(l.action) === 'AUTH').length;
  const evalLogsCount = logs.filter(l => getLogCategory(l.action) === 'EVAL').length;
  const submissionLogsCount = logs.filter(l => getLogCategory(l.action) === 'SUBMISSION').length;
  const adminLogsCount = logs.filter(l => getLogCategory(l.action) === 'ADMIN').length;

  const filteredLogs = logs.filter(log => {
    const cat = getLogCategory(log.action);
    if (filterCategory !== 'ALL' && cat !== filterCategory) {
      return false;
    }

    if (!searchTerm.trim()) return true;

    const q = searchTerm.toLowerCase();
    const detailsStr = log.details ? JSON.stringify(log.details).toLowerCase() : '';
    return (
      (log.userName && log.userName.toLowerCase().includes(q)) ||
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.entityType && log.entityType.toLowerCase().includes(q)) ||
      (log.userRole && log.userRole.toLowerCase().includes(q)) ||
      detailsStr.includes(q)
    );
  });

  const getActionBadge = (action: string) => {
    const act = (action || '').toLowerCase();
    if (act.includes('logged in') || act.includes('log in')) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <LogIn className="w-3.5 h-3.5 text-emerald-600" />
      };
    }
    if (act.includes('logged out') || act.includes('log out')) {
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: <LogOut className="w-3.5 h-3.5 text-slate-600" />
      };
    }
    if (act.includes('evaluation') || act.includes('marks')) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: <Award className="w-3.5 h-3.5 text-amber-600" />
      };
    }
    if (act.includes('submission') || act.includes('paper') || act.includes('proof')) {
      return {
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
      };
    }
    if (act.includes('password') || act.includes('reset')) {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <KeyRound className="w-3.5 h-3.5 text-rose-600" />
      };
    }
    return {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Activity className="w-3.5 h-3.5 text-blue-600" />
    };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold mb-2 bg-rose-50 text-rose-700 border border-rose-200">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Main Administrator Security Console</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">System Audit Trail & Event Logs</h1>
            <p className="text-sm text-slate-600 mt-1">
              Complete chronological audit history tracking all user logins, logouts, evaluations, submissions, and administrative changes.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchLogs}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center space-x-2 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-amber-400' : 'text-white'}`} />
              <span>{isSyncing ? 'Synchronizing...' : 'Sync Logs'}</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Recorded Events</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{logs.length}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Immutable system history</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Logins &amp; Logouts</p>
            <h3 className="text-2xl font-black text-emerald-950 mt-1">{authLogsCount}</h3>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">Authentication actions</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Guide Evaluations</p>
            <h3 className="text-2xl font-black text-amber-950 mt-1">{evalLogsCount}</h3>
            <p className="text-[11px] text-amber-600/80 mt-0.5">Marks &amp; review scores</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Submissions &amp; Proofs</p>
            <h3 className="text-2xl font-black text-indigo-950 mt-1">{submissionLogsCount}</h3>
            <p className="text-[11px] text-indigo-600/80 mt-0.5">Deliverables uploaded</p>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit trail by user name, USN, email, role, or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 mr-1 uppercase flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Filter:</span>
            </span>
            <button
              onClick={() => setFilterCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Events ({logs.length})
            </button>
            <button
              onClick={() => setFilterCategory('AUTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterCategory === 'AUTH'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <LogIn className="w-3 h-3" />
              <span>Logins &amp; Logouts ({authLogsCount})</span>
            </button>
            <button
              onClick={() => setFilterCategory('EVAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterCategory === 'EVAL'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Award className="w-3 h-3" />
              <span>Evaluations ({evalLogsCount})</span>
            </button>
            <button
              onClick={() => setFilterCategory('SUBMISSION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterCategory === 'SUBMISSION'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <UploadCloud className="w-3 h-3" />
              <span>Submissions &amp; Proofs ({submissionLogsCount})</span>
            </button>
            <button
              onClick={() => setFilterCategory('ADMIN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filterCategory === 'ADMIN'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Admin Changes ({adminLogsCount})</span>
            </button>
          </div>
        </div>

        {/* Audit Log Results */}
        {filteredLogs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2 shadow-sm">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No matching audit events found</h3>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or clearing filters.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                      <th className="py-3.5 px-4 rounded-l-lg">Timestamp</th>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Action</th>
                      <th className="py-3.5 px-4">Entity Type</th>
                      <th className="py-3.5 px-4 rounded-r-lg">Event Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map(log => {
                      const badge = getActionBadge(log.action);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-600 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{log.userName || 'System'}</span>
                            {log.details?.email && (
                              <span className="text-[10px] text-slate-400 font-mono block">{log.details.email}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              log.userRole === 'admin' ? 'bg-rose-100 text-rose-800' :
                              log.userRole === 'faculty' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {log.userRole || 'system'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.bg}`}>
                              {badge.icon}
                              <span>{log.action}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-600">{log.entityType}</td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] max-w-sm truncate" title={log.details ? JSON.stringify(log.details) : ''}>
                            {log.details ? JSON.stringify(log.details) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View (Optimized for small screens) */}
            <div className="block md:hidden space-y-3">
              {filteredLogs.map(log => {
                const badge = getActionBadge(log.action);
                return (
                  <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${badge.bg}`}>
                        {badge.icon}
                        <span>{log.action}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        log.userRole === 'admin' ? 'bg-rose-100 text-rose-800' :
                        log.userRole === 'faculty' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {log.userRole || 'system'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        <p className="font-extrabold text-slate-900">{log.userName || 'System'}</p>
                        {log.details?.email && (
                          <p className="text-[10px] text-slate-400 font-mono">{log.details.email}</p>
                        )}
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {log.details && (
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px] font-mono text-slate-600 break-all">
                        {JSON.stringify(log.details)}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 font-mono text-right pt-0.5">
                      {new Date(log.createdAt).toLocaleDateString()} &bull; {log.entityType}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
