import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ShiftTimerCard } from './ShiftTimerCard';
import { AttendanceCalendar } from './AttendanceCalendar';
import { PersonalAnalyticsCard } from './PersonalAnalyticsCard';

export function EmployeeDashboard({ activeTab = 'dashboard' }) {
  const { user, refreshUser } = useAuth();
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [todayRes, historyRes, analyticsRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/attendance/my-history'),
        api.get('/analytics/my-analytics'),
      ]);

      if (todayRes.data) setTodayStatus(todayRes.data);
      if (historyRes.data) setHistory(historyRes.data);
      if (analyticsRes.data) setAnalytics(analyticsRes.data);
      refreshUser();
    } catch (error) {
      console.error('Error fetching employee dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading employee workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Employee Workspace
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight mt-1">
            {user?.fullName}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            {user?.department || 'General'} · <span className="font-mono text-slate-600">{user?.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Leave Balance</span>
            <span className="text-base font-bold text-emerald-800 font-mono">{user?.leaveBalance} Days</span>
          </div>
          <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Integrity Score</span>
            <span className="text-base font-bold text-slate-900 font-mono">{analytics.integrity?.score || 100}%</span>
          </div>
        </div>
      </div>

      {/* Main Console View */}
      {activeTab === 'dashboard' && (
        <>
          <ShiftTimerCard
            todayStatus={todayStatus}
            onStatusChange={fetchDashboardData}
          />
          <AttendanceCalendar
            history={history}
            analytics={analytics}
          />
        </>
      )}

      {/* History Log Tab */}
      {activeTab === 'calendar' && (
        <AttendanceCalendar
          history={history}
          analytics={analytics}
        />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <PersonalAnalyticsCard
          analytics={analytics}
          user={user}
        />
      )}
    </div>
  );
}
