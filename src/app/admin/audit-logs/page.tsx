'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import { History, ShieldAlert, FileText, User } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const { user } = useAuth();
  if (!user) return null;

  const logs = store.getAuditLogs();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">System Audit Trail & Event Logs</h1>
            <p className="text-sm text-slate-600 mt-1">
              Complete chronological audit history tracking all administrative, evaluation, submission, and login security actions.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-rose-50 text-rose-800 px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-bold">
            <ShieldAlert className="h-4 w-4" />
            <span>Immutable Audit Logging</span>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{log.userName || 'System'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.userRole === 'admin' ? 'bg-rose-100 text-rose-800' :
                        log.userRole === 'faculty' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {log.userRole || 'system'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">{log.action}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">{log.entityType}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
