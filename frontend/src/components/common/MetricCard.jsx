import React from 'react';

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className = '',
}) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-shadow hover:shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <Icon className="h-4 w-4 text-slate-400 shrink-0" />
        )}
      </div>

      <div className="my-1.5 text-3xl font-semibold text-slate-900 font-mono tracking-tight">
        {value}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-400 font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
}
