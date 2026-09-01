import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { WorkforceMetricsGrid } from './WorkforceMetricsGrid';
import { AttendanceManagementTable } from './AttendanceManagementTable';
import { AiBurnoutAnalyticsView } from './AiBurnoutAnalyticsView';
import { AuditTrailView } from './AuditTrailView';
import { AdminSettingsView } from './AdminSettingsView';
import { RefreshCw } from 'lucide-react';

export function HrDashboard({ activeTab = 'workforce' }) {
  const [stats, setStats] = useState({});
  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({});

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHrData = async () => {
    setIsRefreshing(true);
    const minWaitPromise = new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const [statsRes, recordsRes, deptsRes, analyticsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/workforce-attendance'),
        api.get('/users/departments'),
        api.get('/analytics/workforce'),
        minWaitPromise, // Ensures the spin animation is visible to human perception
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (recordsRes.data) setRecords(recordsRes.data);
      if (deptsRes.data) setDepartments(deptsRes.data);
      if (analyticsRes.data) setAnalyticsData(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching HR dashboard data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHrData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading workforce data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Clean, Minimal Hero Banner (Clutter-Free, Low Chroma) */}
      {activeTab !== 'settings' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div>
            <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              HR Administrative Console
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight mt-1">
              Workforce Attendance & Productivity
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-normal">
              Real-time shift logging, ACID leave deductions, and automated audit tracking
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHrData}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-75"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-700 transition-transform duration-500 ${isRefreshing ? 'animate-spin text-slate-900' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5-Column Metrics Grid (on Workforce Ledger) */}
      {activeTab === 'workforce' && (
        <WorkforceMetricsGrid stats={stats} />
      )}

      {/* Tab 1: Workforce Ledger */}
      {activeTab === 'workforce' && (
        <AttendanceManagementTable
          records={records}
          departments={departments}
          stats={stats}
          onDataRefresh={fetchHrData}
        />
      )}

      {/* Tab 2: AI Burnout & Integrity */}
      {activeTab === 'burnout' && (
        <AiBurnoutAnalyticsView
          analyticsData={analyticsData}
        />
      )}

      {/* Tab 3: Audit Trail */}
      {activeTab === 'audit' && (
        <AuditTrailView />
      )}

      {/* Tab 4: System Settings (Dedicated Clean Page) */}
      {activeTab === 'settings' && (
        <AdminSettingsView
          onSettingsChanged={fetchHrData}
        />
      )}
    </div>
  );
}
