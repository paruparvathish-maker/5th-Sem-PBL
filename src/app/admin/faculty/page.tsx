'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import { BookOpen, Search, Plus, KeyRound, Edit, CheckCircle2, ShieldCheck } from 'lucide-react';
import { UserProfile } from '@/lib/types/pbl';

export default function AdminFacultyPage() {
  const { user } = useAuth();
  if (!user) return null;

  const [facultyList, setFacultyList] = useState<UserProfile[]>(store.getFaculty());
  const teams = store.getAllTeams();

  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const refreshData = () => {
    setFacultyList([...store.getFaculty()]);
  };

  const filteredFaculty = facultyList.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingFaculty(null);
    setName('');
    setEmail('');
    setPhone('9550011981');
    setShowModal(true);
  };

  const handleOpenEditModal = (fac: UserProfile) => {
    setEditingFaculty(fac);
    setName(fac.name);
    setEmail(fac.email);
    setPhone(fac.phone || '9550011981');
    setShowModal(true);
  };

  const handleSaveFaculty = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingFaculty) {
      store.updateProfile(editingFaculty.id, { name, email, phone });
      setMessage(`Updated faculty profile for ${name}.`);
    } else {
      store.createProfile({
        name,
        email,
        phone,
        role: 'faculty',
        isFirstLogin: true
      });
      setMessage(`Created new faculty profile for ${name}. Initial password set to mobile number.`);
    }

    setShowModal(false);
    refreshData();
  };

  const handleResetPassword = (fac: UserProfile) => {
    store.updateProfile(fac.id, { isFirstLogin: true });
    store.addAuditLog(user.id, user.name, user.role, 'Reset Password', 'UserProfile', fac.id, { targetEmail: fac.email });
    setMessage(`Password reset for ${fac.name} (${fac.email}). User must set new password upon next login.`);
    refreshData();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Faculty Guide Allocation & Workload</h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage faculty credentials, guide allocations across sections, and workload metrics.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center space-x-2 w-fit"
          >
            <Plus className="h-4 w-4" />
            <span>Add Faculty Member</span>
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty by Name or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Faculty Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFaculty.map(f => {
            const assignedTeams = teams.filter(t => t.guideId === f.id);
            const sections = Array.from(new Set(assignedTeams.map(t => t.section))).sort();

            return (
              <div key={f.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-amber-300 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm">
                      {f.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{f.name}</h3>
                      <p className="text-xs text-slate-500">{f.email}</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    Phone: {f.phone || 'N/A'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    Password: {f.password || f.phone || 'N/A'}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Assigned Teams Workload:</span>
                    <span className="font-bold text-amber-700">{assignedTeams.length} Groups</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Sections Covered:</span>
                    <span className="font-bold text-slate-800">
                      {sections.length > 0 ? `Sec ${sections.join(', ')}` : 'None'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleResetPassword(f)}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-xs border border-amber-200 flex items-center space-x-1"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Reset Password</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(f)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs border border-indigo-200 flex items-center space-x-1"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingFaculty ? 'Edit Faculty Profile' : 'Add New Faculty Guide'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold">✕</button>
              </div>

              <form onSubmit={handleSaveFaculty} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Faculty Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Guruprasad B J"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Institutional Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. guruprasad-cse@dsatm.edu.in"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Registered Mobile Phone (Initial Password)</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-md"
                  >
                    Save Faculty Profile
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
