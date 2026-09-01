import React, { useState, useEffect } from 'react';
import { X, Users, Trash2, AlertTriangle, CheckCircle2, Shield, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function EmployeeDirectoryModal({ isOpen, onClose, onUserDeleted }) {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/employees');
      if (res.data) {
        setEmployees(res.data);
      }
    } catch (err) {
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      setConfirmUser(null);
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  const handleDelete = async (userToDelete) => {
    setError('');
    setSuccessMsg('');
    setDeletingId(userToDelete.id);

    try {
      const res = await api.delete(`/admin/users/${userToDelete.id}`, {
        reason: reason.trim() || 'Employee account deleted by HR Administrator',
      });
      setSuccessMsg(res.message || 'Account removed successfully.');
      setConfirmUser(null);
      setReason('');
      loadEmployees();
      if (onUserDeleted) onUserDeleted();
    } catch (err) {
      setError(err.message || 'Failed to delete account.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Employee Accounts Directory
              </h3>
              <p className="text-xs text-slate-500">
                Manage registered staff and permanently terminate accounts
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

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Delete Confirmation Dialog Box */}
        {confirmUser && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-3 shrink-0">
            <div className="flex items-start gap-2 text-rose-800 font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                Confirm Account Deletion for {confirmUser.fullName} ({confirmUser.email})
              </div>
            </div>
            <p className="text-[11px] text-rose-700">
              This action will permanently delete this employee account, their shift history, and break logs. An immutable audit record will be logged.
            </p>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for deletion (e.g. Resigned, Contract ended)"
              className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmUser(null)}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmUser)}
                disabled={deletingId === confirmUser.id}
                className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {deletingId === confirmUser.id ? 'Deleting...' : 'Confirm & Delete Permanently'}
              </button>
            </div>
          </div>
        )}

        {/* Employee List Table */}
        <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 sticky top-0 font-semibold">
              <tr>
                <th className="py-2.5 px-3.5">Employee</th>
                <th className="py-2.5 px-3.5">Department</th>
                <th className="py-2.5 px-3.5">Role</th>
                <th className="py-2.5 px-3.5">Leave Balance</th>
                <th className="py-2.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => {
                const isSelf = emp.id === currentUser?.id || emp.email === currentUser?.email;
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-900">{emp.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{emp.email}</div>
                    </td>
                    <td className="py-3 px-3.5 text-slate-600">{emp.department?.name || 'General'}</td>
                    <td className="py-3 px-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${emp.role === 'HR' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-700 font-medium">
                      {emp.leaveBalance} Days
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      {isSelf ? (
                        <span className="text-[11px] text-slate-400 italic">Current User</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmUser(emp);
                            setError('');
                            setSuccessMsg('');
                          }}
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3 text-rose-500" />
                          <span>Delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {employees.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No employee accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-4 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Total Registered: <strong>{employees.length}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
