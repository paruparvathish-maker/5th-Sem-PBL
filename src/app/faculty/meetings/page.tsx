'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import { Calendar, Plus, MapPin, Clock, Users, CheckCircle2 } from 'lucide-react';

export default function FacultyMeetingsPage() {
  const { user } = useAuth();
  if (!user) return null;

  const assignedTeams = store.getTeamsByGuideId(user.id);
  const meetings = store.getMeetingsForFaculty(user.id);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(assignedTeams[0]?.id || '');
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [location, setLocation] = useState('CSE Lab 4 / Offline');
  const [agenda, setAgenda] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !title || !meetingDate) return;

    const team = assignedTeams.find(t => t.id === selectedTeamId);

    store.createMeeting({
      title,
      facultyId: user.id,
      facultyName: user.name,
      teamId: selectedTeamId,
      teamNumber: team?.teamNumber,
      projectTitle: team?.projectTitle,
      meetingDate: new Date(meetingDate).toISOString(),
      location,
      agenda,
      status: 'scheduled'
    });

    setMessage(`Guide meeting "${title}" scheduled successfully for Group ${team?.teamNumber}!`);
    setShowCreateModal(false);
    setTitle('');
    setAgenda('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Guide Meetings Management</h1>
            <p className="text-sm text-slate-600 mt-1">
              Schedule and manage periodic review sessions with your assigned project teams.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center space-x-2 w-fit"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule New Meeting</span>
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        {/* Meetings List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {meetings.map(m => (
            <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3 hover:border-purple-300 transition">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-800 font-extrabold text-xs">
                  Group {m.teamNumber}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                  {m.status}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-900 text-base">{m.title}</h3>
              <p className="text-xs text-slate-500 font-medium">Project: {m.projectTitle}</p>

              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3.5 w-3.5 text-purple-600" />
                  <span>📅 {new Date(m.meetingDate).toLocaleString()}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="h-3.5 w-3.5 text-amber-600" />
                  <span>📍 {m.location}</span>
                </div>
              </div>

              {m.agenda && (
                <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
                  <strong>Agenda:</strong> {m.agenda}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base">Schedule Guide Meeting</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>

              <form onSubmit={handleCreateMeeting} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Assigned Team</label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {assignedTeams.map(t => (
                      <option key={t.id} value={t.id}>
                        Sec {t.section} • Group {t.teamNumber} ({t.projectTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Meeting Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Review 1 Progress & Circuit Verification"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Location / Link</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Agenda & Preparation Notes</label>
                  <textarea
                    rows={2}
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    placeholder="What should students bring or prepare?"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-md"
                  >
                    Schedule Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
