import React, { useState } from 'react';
import { X, CalendarCheck } from 'lucide-react';
import { api } from '../../services/api';

export function LeaveOverrideModal({ isOpen, onClose, employee, onUpdated }) {
  if (!isOpen || !employee) return null;

  const [leaveBalance, setLeaveBalance] = useState(employee.leaveBalance || 20);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A justification note is required to override leave balance.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.put(`/admin/user/${employee.id || employee.userId}/leave-balance`, {
        leaveBalance: parseFloat(leaveBalance),
        reason: reason.trim(),
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update leave balance');
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
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Adjust Leave Balance
              </h3>
              <p className="text-xs text-slate-500">
                Employee: {employee.fullName}
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Leave Balance (Days)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              required
              value={leaveBalance}
              onChange={(e) => setLeaveBalance(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:border-slate-800 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Current balance: {employee.leaveBalance} Days
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Audit Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Approved leave credit adjustment or rollover."
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
              {loading ? 'Updating...' : 'Commit Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
