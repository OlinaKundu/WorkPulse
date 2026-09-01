import React from 'react';
import {
  ShieldCheck,
  Flame,
  CalendarCheck,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';

export function PersonalAnalyticsCard({ analytics = {}, user = {} }) {
  const integrity = analytics.integrity || { score: 100, grade: 'A+', level: 'Excellent', stats: {} };
  const burnout = analytics.burnout || { riskLevel: 'Healthy', consecutiveWeeksOver50h: 0, weeklyBreakdown: [] };
  const weeklyData = burnout.weeklyBreakdown || [];

  return (
    <div className="space-y-6">
      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Integrity Score */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Attendance Integrity
            </span>
            <ShieldCheck className="w-4 h-4 text-slate-700" />
          </div>

          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900 font-mono tracking-tight">
              {integrity.score}%
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              Grade {integrity.grade}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Rating: <strong className="text-slate-700 font-medium">{integrity.level}</strong>
          </p>

          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                integrity.score >= 90
                  ? 'bg-emerald-600'
                  : integrity.score >= 75
                  ? 'bg-amber-600'
                  : 'bg-rose-600'
              }`}
              style={{ width: `${integrity.score}%` }}
            />
          </div>
        </div>

        {/* Burnout Risk Assessment */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Burnout Risk Index
            </span>
            <Flame
              className={`w-4 h-4 ${
                burnout.riskLevel === 'High Risk' ? 'text-rose-600' : 'text-slate-400'
              }`}
            />
          </div>

          <div className="my-1.5">
            <span
              className={`text-xl font-semibold ${
                burnout.riskLevel === 'High Risk'
                  ? 'text-rose-800'
                  : burnout.riskLevel === 'Moderate Risk'
                  ? 'text-amber-800'
                  : 'text-emerald-800'
              }`}
            >
              {burnout.riskLevel}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            {burnout.alertMessage || 'Workload within standard parameters.'}
          </p>

          <div className="mt-2 text-xs text-slate-500 font-mono">
            Weekly Average: <strong className="text-slate-700">{burnout.avgWeeklyHours || 0}h</strong>
          </div>
        </div>

        {/* Leave Balance */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Paid Leave Balance
            </span>
            <CalendarCheck className="w-4 h-4 text-emerald-700" />
          </div>

          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold text-slate-900 font-mono tracking-tight">
              {user.leaveBalance !== undefined ? user.leaveBalance : 20.0}
            </span>
            <span className="text-xs text-slate-500 font-medium">Days Available</span>
          </div>

          <p className="text-xs text-slate-500">
            -0.5d per Half Day · -1.0d per Absent shift
          </p>

          <div className="mt-2 text-[11px] text-slate-400">
            Standard entitlement: 20 Days/Year
          </div>
        </div>
      </div>

      {/* Weekly Hours Workload Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-slate-700" />
              <span>Weekly Workload Overview</span>
            </h4>
            <p className="text-xs text-slate-500">
              Red dotted indicator marks the 50h/week overtime threshold
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 bg-slate-900 rounded-xs" /> Standard Hours
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 font-medium">
              <span className="w-2.5 h-2.5 bg-rose-600 rounded-xs" /> &gt;50h Burnout Warning
            </span>
          </div>
        </div>

        <div className="h-56 w-full">
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="weekStart" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 60]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    color: '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  }}
                  formatter={(value) => [`${value} Hours`, 'Total Hours']}
                />
                <ReferenceLine y={50} stroke="#f43f5e" strokeDasharray="3 3" />
                <Bar dataKey="totalHours" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.totalHours > 50 ? '#e11d48' : '#18181b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
              No weekly overtime trends aggregated yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
