'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { store } from '@/lib/data/store';
import { 
  FileSpreadsheet, Upload, AlertCircle, CheckCircle2, 
  FileText, ArrowRight, ShieldAlert, Sparkles, Download, Check 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getGuideEmail, getGuidePhone } from '@/lib/data/seed-dataset';

interface ParsedRecord {
  rowNum: number;
  usn: string;
  studentName: string;
  section: string;
  teamNumber: string;
  guideName: string;
  guideEmail: string;
  projectTitle: string;
  errors: string[];
}

export default function AdminImportPage() {
  const { user } = useAuth();
  if (!user) return null;

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRecords, setParsedRecords] = useState<ParsedRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commitMessage, setCommitMessage] = useState<string | null>(null);

  const existingStudents = store.getStudents();
  const existingUsns = new Set(existingStudents.map(s => s.usn?.toUpperCase()));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setCommitMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });

        // Skip header if present, parse rows
        const records: ParsedRecord[] = [];
        const seenUsnsInFile = new Set<string>();

        // Row iteration starting after header (row 1+)
        const rows = data.slice(1);

        rows.forEach((row: any, idx: number) => {
          if (!row || row.length === 0) return;

          const rowNum = idx + 2;
          const usn = String(row[0] || '').trim().toUpperCase();
          const studentName = String(row[1] || '').trim();
          const section = String(row[2] || '').trim().toUpperCase();
          const teamNumber = String(row[3] || '').trim().toUpperCase();
          const guideName = String(row[4] || '').trim();
          const guideEmail = String(row[5] || getGuideEmail(guideName)).trim().toLowerCase();
          const projectTitle = String(row[6] || 'Untitled Project').trim();

          const errors: string[] = [];

          // Validation Rule 1: Missing Required Fields
          if (!usn) errors.push('Missing USN');
          if (!studentName) errors.push('Missing Student Name');
          if (!section) errors.push('Missing Section');
          if (!teamNumber) errors.push('Missing Team Number');
          if (!guideName) errors.push('Missing Faculty Guide');

          // Validation Rule 2: Invalid Section Code
          if (section && !['A', 'B', 'C', 'D', 'E', 'F'].includes(section)) {
            errors.push(`Invalid Section "${section}" (Must be A, B, C, D, E, F)`);
          }

          // Validation Rule 3: Duplicate USN within File
          if (usn) {
            if (seenUsnsInFile.has(usn)) {
              errors.push(`Duplicate USN "${usn}" found within file`);
            } else {
              seenUsnsInFile.add(usn);
            }

            // Validation Rule 4: Duplicate USN in Database
            if (existingUsns.has(usn)) {
              errors.push(`USN "${usn}" already registered in database`);
            }
          }

          records.push({
            rowNum,
            usn,
            studentName,
            section,
            teamNumber,
            guideName,
            guideEmail,
            projectTitle,
            errors
          });
        });

        setParsedRecords(records);
      } catch (err: any) {
        alert('Failed to parse Excel file. Ensure file format is valid .xlsx or .csv');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Download Sample Template Helper
  const downloadSampleTemplate = () => {
    const sampleData = [
      ['USN', 'Student Name', 'Section', 'Team Number', 'Faculty Guide', 'Faculty Email', 'Project Title'],
      ['1DT24CS999', 'Demo Student One', 'A', 'A18', 'Dr. Guruprasad B J', 'guruprasad-cse@dsatm.edu.in', 'AI Powered Traffic Signal Controller'],
      ['1DT24CS998', 'Demo Student Two', 'A', 'A18', 'Dr. Guruprasad B J', 'guruprasad-cse@dsatm.edu.in', 'AI Powered Traffic Signal Controller']
    ];
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PBL_Import_Template');
    XLSX.writeFile(wb, 'PBL_Student_Guide_Import_Template.xlsx');
  };

  const validRecords = parsedRecords.filter(r => r.errors.length === 0);
  const invalidRecords = parsedRecords.filter(r => r.errors.length > 0);

  const handleCommitImport = () => {
    if (validRecords.length === 0) {
      alert('No valid records to commit.');
      return;
    }

    setIsProcessing(true);

    const facultyMap = new Map<string, string>(); // guideEmail -> guideId

    validRecords.forEach(r => {
      // 1. Provision Guide Profile if missing
      let guideId = '';
      const existingFac = store.getFaculty().find(f => f.email.toLowerCase() === r.guideEmail.toLowerCase());
      if (existingFac) {
        guideId = existingFac.id;
      } else {
        const newFac = store.createProfile({
          name: r.guideName,
          email: r.guideEmail,
          phone: getGuidePhone(r.guideName),
          role: 'faculty',
          isFirstLogin: true
        });
        guideId = newFac.id;
      }

      // 2. Provision Student Profile
      const studentProf = store.createProfile({
        name: r.studentName,
        usn: r.usn,
        email: `${r.usn.toLowerCase()}@student.dsatm.edu.in`,
        role: 'student',
        section: r.section as any,
        isFirstLogin: true
      });

      // 3. Find or Create Team
      let teamObj = store.getAllTeams().find(t => t.teamNumber === r.teamNumber && t.section === r.section);
      if (!teamObj) {
        teamObj = store.createTeam({
          teamNumber: r.teamNumber,
          section: r.section as any,
          projectTitle: r.projectTitle,
          projectDescription: 'Imported via Excel dataset.',
          guideId: guideId,
          guideName: r.guideName,
          guideEmail: r.guideEmail,
          members: [studentProf]
        });
      } else {
        const updatedMembers = [...(teamObj.members || []), studentProf];
        store.updateTeam(teamObj.id, { members: updatedMembers });
      }
    });

    store.addAuditLog(user.id, user.name, user.role, 'Batch Excel Dataset Imported', 'System', 'ImportModule', {
      importedRecordsCount: validRecords.length,
      rejectedRecordsCount: invalidRecords.length
    });

    setIsProcessing(false);
    setCommitMessage(`Successfully committed ${validRecords.length} valid student records and team allocations to system database!`);
    setParsedRecords([]);
    setFileName(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Excel / Word Data Import & Validation Engine</h1>
            <p className="text-sm text-slate-600 mt-1">
              Upload structured spreadsheets containing USN, Student Name, Section, Team #, and Guide allocations with instant validation preview.
            </p>
          </div>
          <button
            onClick={downloadSampleTemplate}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-md flex items-center space-x-2 w-fit"
          >
            <Download className="h-4 w-4" />
            <span>Download Excel Template</span>
          </button>
        </div>

        {commitMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{commitMessage}</span>
          </div>
        )}

        {/* Upload Box */}
        <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-rose-200 text-center space-y-4 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="h-6 w-6" />
          </div>

          <div>
            <h3 className="font-extrabold text-slate-900 text-base">
              {fileName ? `Loaded: ${fileName}` : 'Upload Excel (.xlsx / .xls) Document'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Expected Fields: USN, Student Name, Section (A-F), Team Number, Faculty Guide, Faculty Email, Project Title
            </p>
          </div>

          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-import-input"
          />
          <label
            htmlFor="excel-import-input"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 cursor-pointer transition"
          >
            <Upload className="h-4 w-4" />
            <span>Select Excel File</span>
          </label>
        </div>

        {/* Interactive Validation Summary & Preview Table */}
        {parsedRecords.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            
            {/* Validation Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-4">
                <div className="text-center px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                  <span className="text-lg font-black block">{validRecords.length}</span>
                  <span className="text-[10px] font-bold uppercase">Valid Records</span>
                </div>

                <div className="text-center px-3 py-1 bg-rose-100 text-rose-800 rounded-lg">
                  <span className="text-lg font-black block">{invalidRecords.length}</span>
                  <span className="text-[10px] font-bold uppercase">Corrupt Rows</span>
                </div>
              </div>

              <button
                onClick={handleCommitImport}
                disabled={validRecords.length === 0 || isProcessing}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>{isProcessing ? 'Committing...' : `Commit ${validRecords.length} Valid Records to Database`}</span>
              </button>
            </div>

            {/* Preview Data Table with Error Highlighting */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                    <th className="py-3 px-4">Row #</th>
                    <th className="py-3 px-4">USN</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">Group #</th>
                    <th className="py-3 px-4">Faculty Guide</th>
                    <th className="py-3 px-4">Validation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRecords.map((r, idx) => (
                    <tr key={idx} className={r.errors.length > 0 ? 'bg-rose-50/60' : 'hover:bg-slate-50/50'}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">#{r.rowNum}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{r.usn || '—'}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{r.studentName || '—'}</td>
                      <td className="py-3 px-4 font-bold">{r.section || '—'}</td>
                      <td className="py-3 px-4 font-bold text-indigo-600">{r.teamNumber || '—'}</td>
                      <td className="py-3 px-4 text-slate-700">{r.guideName || '—'}</td>
                      <td className="py-3 px-4">
                        {r.errors.length === 0 ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center space-x-1 w-fit">
                            <Check className="h-3 w-3" />
                            <span>Valid</span>
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {r.errors.map((err, errIdx) => (
                              <span key={errIdx} className="block px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold text-[10px]">
                                ❌ {err}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
