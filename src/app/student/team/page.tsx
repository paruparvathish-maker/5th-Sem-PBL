'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import { Users, BookOpen, Mail, ShieldCheck, UserCheck, AlertCircle, Edit2, Save, X, CheckCircle2 } from 'lucide-react';

export default function StudentTeamPage() {
  const { user } = useAuth();
  if (!user) return null;

  // Strict isolation: fetch ONLY the student's own team
  const [team, setTeam] = useState(store.getTeamByStudentId(user.id));
  const deadline = store.getAllDeadlines().find(d => d.id === 'dl-003');
  const isPastDeadline = deadline ? new Date() > new Date(deadline.dueDate) : false;

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(team?.projectTitle || '');
  const [editDesc, setEditDesc] = useState(team?.projectDescription || '');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    
    const result = store.updateTeamProjectDetails(team.id, editTitle, editDesc);
    if (result.success) {
      setTeam({ ...team, projectTitle: editTitle, projectDescription: editDesc });
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Project details updated successfully.' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update details.' });
    }
  };

  if (!team) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Team Allocation Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            You are currently not assigned to any PBL group. Please contact your section administrator.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-extrabold uppercase">
                Section {team.section} • Group {team.teamNumber}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Isolated Team View</span>
              </span>
              {deadline && (
                <span className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center space-x-1 ${isPastDeadline ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                  {isPastDeadline ? 'Editing Locked' : `Edit Deadline: ${new Date(deadline.dueDate).toLocaleString()}`}
                </span>
              )}
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-start space-x-2 border mb-4 w-full ${
                message.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                <span>{message.text}</span>
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4 w-full max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Project Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Project Description</label>
                  <textarea
                    required
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5">
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Details</span>
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1.5">
                    <X className="h-3.5 w-3.5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900">{team.projectTitle}</h1>
                  {!isPastDeadline && (
                    <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs border border-indigo-200 flex items-center space-x-1 shrink-0 w-fit">
                      <Edit2 className="h-3 w-3" />
                      <span>Edit Title & Description</span>
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed whitespace-pre-wrap">
                  {team.projectDescription || 'No description provided.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 2 Column Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Teammates List (2 Columns) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center space-x-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <span>Project Teammates</span>
            </h3>

            <div className="divide-y divide-slate-100">
              {team.members?.map((member, idx) => (
                <div key={member.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                        <span>{member.name}</span>
                        {member.id === user.id && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                            You
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        USN: <span className="font-mono font-bold text-slate-700">{member.usn}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">{member.email}</span>
                    <span className="text-[11px] font-semibold text-emerald-600">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Guide Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-amber-600" />
              <span>Faculty Guide Details</span>
            </h3>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Guide Name</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">{team.guideName}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Institutional Email</p>
                <a 
                  href={`mailto:${team.guideEmail}`} 
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center space-x-1.5 mt-0.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{team.guideEmail}</span>
                </a>
              </div>

              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Department</p>
                <p className="text-xs font-medium text-slate-700 mt-0.5">Computer Science & Engineering</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              🔒 <strong>Data Security Policy:</strong> You are authorized to view details only for your assigned team (Group {team.teamNumber}). Other section teams and marks are restricted.
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
