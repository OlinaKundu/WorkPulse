import React, { useState } from 'react';
import {
  Search,
  Download,
  Edit2,
  CalendarCheck,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { AuditBadge } from '../common/AuditBadge';
import { AttendanceEditModal } from './AttendanceEditModal';
import { LeaveOverrideModal } from './LeaveOverrideModal';
import { generateWorkforceSummaryPDF } from '../../services/pdfService';
import { api } from '../../services/api';

export function AttendanceManagementTable({
  records = [],
  departments = [],
  stats = {},
  onDataRefresh,
}) {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');

  // Modals state
  const [editingRecord, setEditingRecord] = useState(null);
  const [adjustingLeaveUser, setAdjustingLeaveUser] = useState(null);

  const filteredRecords = records.filter((r) => {
    if (selectedDept !== 'ALL' && r.user?.departmentId !== selectedDept) return false;
    if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
    if (selectedDate && r.attendanceDate !== selectedDate) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = (r.user?.fullName || '').toLowerCase();
      const email = (r.user?.email || '').toLowerCase();
      if (!name.includes(q) && !email.includes(q)) return false;
    }
    return true;
  });

  const handleExportPDF = () => {
    generateWorkforceSummaryPDF(filteredRecords, stats, selectedDate);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Controls Bar */}
      <div className="p-5 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Workforce Attendance Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredRecords.length} of {records.length} records
            </p>
          </div>

          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (PDF)</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-800 transition-colors"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-slate-800 transition-colors"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-slate-800 transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late Arrival</option>
            <option value="Half Day">Half Day</option>
            <option value="Absent">Absent</option>
            <option value="On Leave">On Leave</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-slate-800 transition-colors"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-2 bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 font-semibold">
            <tr>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Check-In</th>
              <th className="py-3 px-4">Check-Out</th>
              <th className="py-3 px-4">Net Hours</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Leave Deducted</th>
              <th className="py-3 px-4">Audit Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredRecords.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4 font-sans">
                  <div className="font-semibold text-slate-900">{r.user?.fullName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{r.user?.email}</div>
                </td>
                <td className="py-3.5 px-4 font-sans text-slate-600">{r.user?.department?.name || 'General'}</td>
                <td className="py-3.5 px-4 text-slate-600">{r.attendanceDate}</td>
                <td className="py-3.5 px-4 text-slate-600">
                  {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-900">{(r.workingHours || 0).toFixed(2)}h</td>
                <td className="py-3.5 px-4 font-sans">
                  {r.isOutOfBounds ? (
                    <span className="text-amber-800 text-xs font-medium">Remote</span>
                  ) : (
                    <span className="text-emerald-800 text-xs font-medium">Office</span>
                  )}
                </td>
                <td className="py-3.5 px-4 font-sans"><StatusBadge status={r.status} /></td>
                <td className="py-3.5 px-4 font-sans">
                  {r.leaveDeducted > 0 ? (
                    <span className="text-rose-700 font-semibold">-{r.leaveDeducted}d</span>
                  ) : (
                    <span className="text-slate-400 font-mono">0.0d</span>
                  )}
                </td>
                <td className="py-3.5 px-4 font-sans"><AuditBadge auditLogs={r.auditLogs} /></td>
                <td className="py-3.5 px-4 text-right font-sans space-x-1.5">
                  <button
                    onClick={() => setEditingRecord(r)}
                    title="Manual HR Override"
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors cursor-pointer text-xs inline-flex items-center gap-1 px-2.5 font-medium shadow-2xs"
                  >
                    <Edit2 className="w-3 h-3 text-slate-500" /> Edit
                  </button>
                  <button
                    onClick={() => setAdjustingLeaveUser(r.user)}
                    title="Adjust Leave"
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors cursor-pointer text-xs inline-flex items-center gap-1 px-2.5 font-medium shadow-2xs"
                  >
                    <CalendarCheck className="w-3 h-3 text-slate-500" /> Leave
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to permanently delete ${r.user?.fullName}'s account and shift records?`)) {
                        try {
                          await api.delete(`/admin/users/${r.user?.id}`, { reason: 'HR direct ledger removal' });
                          onDataRefresh();
                        } catch (err) {
                          alert(err.message || 'Failed to delete account');
                        }
                      }
                    }}
                    title="Delete Employee Account"
                    className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-300 hover:border-rose-300 transition-colors cursor-pointer text-xs inline-flex items-center gap-1 px-2 font-medium shadow-2xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400 font-sans">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-600">No matching attendance records found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Records will appear as staff check in</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AttendanceEditModal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
        onRecordUpdated={onDataRefresh}
      />

      <LeaveOverrideModal
        isOpen={!!adjustingLeaveUser}
        onClose={() => setAdjustingLeaveUser(null)}
        employee={adjustingLeaveUser}
        onUpdated={onDataRefresh}
      />
    </div>
  );
}
