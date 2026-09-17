'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import { Users, Search, Plus, KeyRound, Edit, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { UserProfile, SectionCode } from '@/lib/types/pbl';

export default function AdminStudentsPage() {
  const { user } = useAuth();
  if (!user) return null;

  const [students, setStudents] = useState<UserProfile[]>(store.getStudents());
  const teams = store.getAllTeams();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [message, setMessage] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [section, setSection] = useState<SectionCode>('A');

  const refreshData = () => {
    setStudents([...store.getStudents()]);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.usn && s.usn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSection = selectedSection === 'ALL' || s.section === selectedSection;

    return matchesSearch && matchesSection;
  });

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setName('');
    setUsn('');
    setSection('A');
    setShowModal(true);
  };

  const handleOpenEditModal = (stud: UserProfile) => {
    setEditingStudent(stud);
    setName(stud.name);
    setUsn(stud.usn || '');
    setSection((stud.section as SectionCode) || 'A');
    setShowModal(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsn = usn.toUpperCase().trim();

    if (editingStudent) {
      store.updateProfile(editingStudent.id, {
        name,
        usn: cleanUsn,
        section,
        email: `${cleanUsn.toLowerCase()}@student.dsatm.edu.in`
      });
      setMessage(`Updated student profile for ${cleanUsn}.`);
    } else {
      store.createProfile({
        name,
        usn: cleanUsn,
        email: `${cleanUsn.toLowerCase()}@student.dsatm.edu.in`,
        role: 'student',
        section,
        isFirstLogin: true
      });
      setMessage(`Created new student profile for ${cleanUsn}. Initial password set to USN.`);
    }

    setShowModal(false);
    refreshData();
  };

  const handleResetPassword = (stud: UserProfile) => {
    if (!stud.usn) return;
    store.updateProfile(stud.id, { isFirstLogin: true });
    store.addAuditLog(user.id, user.name, user.role, 'Reset Password', 'UserProfile', stud.id, { targetUsn: stud.usn });
    setMessage(`Password reset for ${stud.name} (${stud.usn}). User must set new password upon next login.`);
    refreshData();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Student Directory & Management</h1>
            <p className="text-sm text-slate-600 mt-1">
              Create, edit, reset passwords, and manage student enrollments across Sections A to F.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 w-fit"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Student</span>
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student by Name, USN, or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Sections (A-F)</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
            <option value="D">Section D</option>
            <option value="E">Section E</option>
            <option value="F">Section F</option>
          </select>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                  <th className="py-3.5 px-4 rounded-l-lg">Student Name</th>
                  <th className="py-3.5 px-4">USN</th>
                  <th className="py-3.5 px-4">Section</th>
                  <th className="py-3.5 px-4">Assigned Team</th>
                  <th className="py-3.5 px-4">Password</th>
                  <th className="py-3.5 px-4">Login Status</th>
                  <th className="py-3.5 px-4 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(s => {
                  const studTeam = teams.find(t => t.members?.some(m => m.id === s.id));

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{s.name}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{s.usn}</td>
                      <td className="py-3.5 px-4 font-bold">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">Sec {s.section}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {studTeam ? `Group ${studTeam.teamNumber}` : 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {s.password || s.usn}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.isFirstLogin ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {s.isFirstLogin ? 'First Login Required' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleResetPassword(s)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-[11px] border border-amber-200 inline-flex items-center space-x-1"
                        >
                          <KeyRound className="h-3 w-3" />
                          <span>Reset Password</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] border border-indigo-200 inline-flex items-center space-x-1"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-base">
                  {editingStudent ? 'Edit Student Profile' : 'Add New Student'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold">✕</button>
              </div>

              <form onSubmit={handleSaveStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. ACHUT MALLIKARJUN"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">USN (University Seat Number)</label>
                  <input
                    type="text"
                    required
                    value={usn}
                    onChange={(e) => setUsn(e.target.value)}
                    placeholder="e.g. 1DT24CS010"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Section</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value as SectionCode)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                    <option value="E">Section E</option>
                    <option value="F">Section F</option>
                  </select>
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
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
                  >
                    Save Student Profile
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
