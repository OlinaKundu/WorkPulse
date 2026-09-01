import React from 'react';
import { History } from 'lucide-react';

export function AuditBadge({ auditLogs = [] }) {
  if (!auditLogs || auditLogs.length === 0) {
    return <span className="text-xs text-slate-400 font-mono">—</span>;
  }

  const latest = auditLogs[auditLogs.length - 1];

  return (
    <span
      title={`Modified by HR: ${latest?.action || 'Manual Edit'} at ${new Date(latest?.createdAt).toLocaleTimeString()}`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-300"
    >
      <History className="w-3 h-3 text-slate-500" />
      <span>Edited ({auditLogs.length})</span>
    </span>
  );
}
