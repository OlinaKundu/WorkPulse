import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { Navbar } from './components/common/Navbar';
import { HrDashboard } from './components/hr/HrDashboard';
import { EmployeeDashboard } from './components/employee/EmployeeDashboard';

export function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('workforce'); // 'workforce' | 'burnout' | 'audit' | 'settings' for HR; 'dashboard' | 'calendar' | 'analytics' for Employee

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Initializing WorkPulse...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-slate-900 flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Workspace Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12 flex-1 w-full">
        {user.role === 'HR' ? (
          <HrDashboard activeTab={activeTab} />
        ) : (
          <EmployeeDashboard activeTab={activeTab} />
        )}
      </main>

      {/* Subtle Inline Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 mt-auto">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              WorkPulse Enterprise
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">Attendance & Workforce Management</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span>ACID Verified</span>
            <span>·</span>
            <span>Haversine GPS</span>
            <span>·</span>
            <span>Immutable Audit Trail</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
