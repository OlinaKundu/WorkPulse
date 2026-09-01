import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { History, FileText, RefreshCw } from 'lucide-react';

export function AuditTrailView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = async () => {
    setIsRefreshing(true);
    const minWaitPromise = new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const [res] = await Promise.all([
        api.get('/audit/logs?limit=100'),
        minWaitPromise,
      ]);
      if (res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatSnapshot = (val) => {
    if (!val) return '—';
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return String(val);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Immutable HR Audit Trail
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Append-only audit log of all administrative modifications
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-md font-medium">
            {logs.length} Log Entries
          </div>
          <button
            onClick={fetchLogs}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-75"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-700 ${isRefreshing ? 'animate-spin text-slate-900' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table / Empty State */}
      {logs.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">No Audit Entries Recorded</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            All administrative overrides, attendance corrections, and leave balance adjustments will appear in this immutable trail.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Target User</th>
                <th className="py-3 px-4">Original Snapshot</th>
                <th className="py-3 px-4">Override Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleDateString()}
                    <div className="text-[11px] text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{log.performer?.fullName || 'System'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{log.performer?.email}</div>
                  </td>
                  <td className="py-3 px-4 font-sans whitespace-nowrap">
                    {log.targetUser ? (
                      <>
                        <div className="font-semibold text-slate-900">{log.targetUser.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{log.targetUser.email}</div>
                      </>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate font-mono text-[11px] text-slate-600">
                    <pre className="p-2 rounded bg-slate-50 border border-slate-200 text-[10px] overflow-x-auto text-slate-800 font-medium">
                      {formatSnapshot(log.oldValue)}
                    </pre>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate font-mono text-[11px] text-slate-800">
                    <pre className="p-2 rounded bg-slate-50 border border-slate-200 text-[10px] overflow-x-auto text-slate-800 font-medium">
                      {formatSnapshot(log.newValue)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
