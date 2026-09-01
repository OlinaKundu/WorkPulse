import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Download,
  Coffee,
  MapPin,
  Filter,
  FileSpreadsheet,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { AuditBadge } from '../common/AuditBadge';
import { generateEmployeeAttendancePDF } from '../../services/pdfService';
import { useAuth } from '../../context/AuthContext';

export function AttendanceCalendar({ history = [], analytics = {} }) {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredHistory = history.filter((item) => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    return true;
  });

  const handleDownloadPDF = () => {
    generateEmployeeAttendancePDF(user, history, analytics);
  };

  const historyMap = history.reduce((acc, curr) => {
    acc[curr.attendanceDate] = curr;
    return acc;
  }, {});

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-700" />
            <span>Attendance Log & Monthly Grid</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Official day-by-day shift records and PDF export
          </p>
        </div>

        <button
          onClick={handleDownloadPDF}
          className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Summary (PDF)</span>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            {monthNames[selectedMonth]} {selectedYear}
          </h4>
          <div className="flex items-center gap-3 text-[11px] text-slate-600">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Present</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-600" /> Late</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-600" /> Half Day</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-600" /> Absent</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-slate-400 mb-2">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-12 rounded-lg bg-slate-50 border border-slate-100" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const record = historyMap[dateStr];

            let cellBg = 'bg-slate-50 border-slate-200';
            if (record) {
              if (record.status === 'Present') cellBg = 'bg-emerald-50/70 border-emerald-200 text-emerald-800';
              else if (record.status === 'Late') cellBg = 'bg-amber-50/70 border-amber-200 text-amber-800';
              else if (record.status === 'Half Day') cellBg = 'bg-orange-50/70 border-orange-200 text-orange-800';
              else if (record.status === 'Absent') cellBg = 'bg-rose-50/70 border-rose-200 text-rose-800';
            }

            return (
              <div
                key={dateStr}
                className={`h-12 rounded-lg border p-1.5 flex flex-col justify-between ${cellBg}`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-slate-700">{dayNum}</span>
                  {record?.isOutOfBounds && (
                    <MapPin className="w-3 h-3 text-amber-600" />
                  )}
                </div>

                {record ? (
                  <div className="text-[10px] truncate font-semibold">
                    {record.workingHours > 0 ? `${record.workingHours.toFixed(1)}h` : record.status}
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-300 font-mono">—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Shift Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Shift Records ({filteredHistory.length})
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-slate-800"
            >
              <option value="ALL">All Records</option>
              <option value="Present">Present</option>
              <option value="Late">Late Arrival</option>
              <option value="Half Day">Half Day</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Net Hours</th>
                <th className="py-3 px-4">Breaks</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Leave Deducted</th>
                <th className="py-3 px-4">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-slate-900">{item.attendanceDate}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {item.checkIn ? new Date(item.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {item.checkOut ? new Date(item.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-900 font-semibold">{(item.workingHours || 0).toFixed(2)}h</td>
                  <td className="py-3 px-4 font-sans">
                    {item.breaks && item.breaks.length > 0 ? (
                      <span className="text-amber-800 text-xs font-medium flex items-center gap-1">
                        <Coffee className="w-3.5 h-3.5" /> {item.breaks.length} ({item.breaks.reduce((acc, b) => acc + (b.durationMinutes || 0), 0)}m)
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    {item.isOutOfBounds ? (
                      <span className="text-amber-800 text-xs font-medium">Remote</span>
                    ) : (
                      <span className="text-emerald-800 text-xs font-medium">Office</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-sans"><StatusBadge status={item.status} /></td>
                  <td className="py-3 px-4 font-sans">
                    {item.leaveDeducted > 0 ? (
                      <span className="text-rose-700 font-semibold">-{item.leaveDeducted}d</span>
                    ) : (
                      <span className="text-slate-400 font-mono">0.0d</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-sans"><AuditBadge auditLogs={item.auditLogs} /></td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-medium text-slate-600">No attendance records logged yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Use the Shift Console above to log today's check-in</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
