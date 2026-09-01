import React from 'react';
import {
  AlertTriangle,
  Flame,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
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

export function AiBurnoutAnalyticsView({ analyticsData = {} }) {
  const burnoutHighRisk = analyticsData.burnoutHighRisk || [];
  const integrityRankings = analyticsData.integrityRankings || [];
  const workloadDist = analyticsData.workloadDistribution || [];

  return (
    <div className="space-y-6">
      {/* Burnout Risk Alert Banner */}
      {burnoutHighRisk.length > 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-900">
                High Burnout Risk Detected ({burnoutHighRisk.length} Employees)
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed font-normal">
                The analytics engine detected staff members exceeding <strong>50 working hours/week</strong> for 3+ consecutive rolling weeks. Managerial workload redistribution is recommended.
              </p>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {burnoutHighRisk.map((item) => (
                  <div
                    key={item.userId}
                    className="p-3 bg-white rounded-lg border border-amber-200 text-xs"
                  >
                    <div className="font-semibold text-slate-900 flex items-center justify-between">
                      <span>{item.fullName}</span>
                      <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {item.consecutiveWeeks} Wks &gt;50h
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Avg: <strong className="text-slate-700">{item.avgWeeklyHours}h/week</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-900">
              Workforce Load Normalized
            </h3>
            <p className="text-xs text-emerald-800 mt-0.5 font-normal">
              Zero staff members currently exhibit high burnout risk indicators. All overtime metrics remain within standard operational bounds.
            </p>
          </div>
        </div>
      )}

      {/* 2-Column Grid: Integrity Rankings + Workload Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Integrity Leaderboard */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
                <span>Attendance Integrity Scores</span>
              </h4>
              <p className="text-xs text-slate-500">
                Punctuality, consistency, and compliance index
              </p>
            </div>
            <span className="text-xs font-medium text-slate-400 font-mono">
              Scale: 0-100%
            </span>
          </div>

          <div className="space-y-3">
            {integrityRankings.map((emp) => (
              <div
                key={emp.userId}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {emp.fullName}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {emp.stats?.presentDays || 0} Present · {emp.stats?.lateDays || 0} Late · {emp.stats?.absentDays || 0} Absent
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                      emp.score >= 90
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : emp.score >= 75
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {emp.score}% ({emp.grade})
                  </span>
                </div>
              </div>
            ))}

            {integrityRankings.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                No employee records aggregated yet.
              </div>
            )}
          </div>
        </div>

        {/* Weekly Workforce Workload Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-slate-700" />
                <span>Workforce Weekly Hours</span>
              </h4>
              <p className="text-xs text-slate-500">
                Average weekly hours per active department
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600" /> Threshold (50h)
            </span>
          </div>

          <div className="h-60 w-full">
            {workloadDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadDist} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} />
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
                    formatter={(val) => [`${val} Hours`, 'Avg Hours']}
                  />
                  <ReferenceLine y={50} stroke="#f43f5e" strokeDasharray="3 3" />
                  <Bar dataKey="avgHours" radius={[4, 4, 0, 0]}>
                    {workloadDist.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.avgHours > 50 ? '#e11d48' : '#18181b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                No longitudinal workload data recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
