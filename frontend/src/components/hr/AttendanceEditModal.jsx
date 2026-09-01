import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

export function AttendanceEditModal({ isOpen, onClose, record, onRecordUpdated }) {
  if (!isOpen || !record) return null;

  const [status, setStatus] = useState(record.status || 'Present');
  const [workingHours, setWorkingHours] = useState(record.workingHours || 0);
  const [leaveDeducted, setLeaveDeducted] = useState(record.leaveDeducted || 0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sync state whenever modal opens with a new record
  useEffect(() => {
    if (record) {
      setStatus(record.status || 'Present');
      setWorkingHours(record.workingHours || 0);
      setLeaveDeducted(record.leaveDeducted || 0);
      setReason('');
      setError('');
    }
  }, [record]);

  // Smart auto-calculation when working hours are edited
  const handleWorkingHoursChange = (val) => {
    setWorkingHours(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      if (num >= 8.0) {
        setStatus('Present');
        setLeaveDeducted(0);
      } else if (num >= 4.0) {
        setStatus('Half Day');
        setLeaveDeducted(0.5);
      } else {
        setStatus('Absent');
        setLeaveDeducted(1.0);
      }
    }
  };

  // Smart auto-calculation when status is edited
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    if (newStatus === 'Present' || newStatus === 'Late') {
      setLeaveDeducted(0);
      if (parseFloat(workingHours) < 8.0) {
        setWorkingHours(8.0);
      }
    } else if (newStatus === 'Half Day') {
      setLeaveDeducted(0.5);
      if (parseFloat(workingHours) < 4.0 || parseFloat(workingHours) >= 8.0) {
        setWorkingHours(4.0);
      }
    } else if (newStatus === 'Absent') {
      setLeaveDeducted(1.0);
    } else if (newStatus === 'On Leave') {
      setLeaveDeducted(1.0);
      setWorkingHours(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A justification reason is required for administrative audit logs.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.put(`/admin/attendance/${record.id}`, {
        status,
        workingHours: parseFloat(workingHours),
        leaveDeducted: parseFloat(leaveDeducted),
        reason: reason.trim(),
      });
      onRecordUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update attendance record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Edit Attendance Record
              </h3>
              <p className="text-xs text-slate-500">
                {record.user?.fullName} · {record.attendanceDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Net Hours (hrs)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="24"
                value={workingHours}
                onChange={(e) => handleWorkingHoursChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attendance Status
              </label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-slate-800 focus:outline-none"
              >
                <option value="Present">Present (≥8.0h)</option>
                <option value="Late">Late Arrival</option>
                <option value="Half Day">Half Day (4.0-8.0h)</option>
                <option value="Absent">Absent (&lt;4.0h)</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Leave Deduction (Days)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="5"
              value={leaveDeducted}
              onChange={(e) => setLeaveDeducted(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:border-slate-800 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-slate-500" />
              <span>Auto-synchronized: Present = 0d, Half Day = 0.5d, Absent = 1.0d</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Audit Reason / Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Corrected shift hours to 8.0h and marked Present."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-800 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading ? 'Saving...' : 'Save & Log Audit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
