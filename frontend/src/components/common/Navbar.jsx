import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut,
  Clock,
  Building2,
  Calendar,
  Sparkles,
  Activity,
  History,
  Settings,
} from 'lucide-react';
import { AppLogo } from './AppLogo';

export function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, isHR } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = time.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Brand & Workspace Title */}
        <div className="flex items-center gap-2.5">
          <AppLogo className="w-8 h-8 shrink-0 drop-shadow-2xs" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 tracking-tight">
              WorkPulse
            </span>
            <span className="text-slate-300 text-xs">/</span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Workforce Management
            </span>
          </div>
        </div>

        {/* Clean Nav Tabs with low-chroma styling */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-lg border border-slate-200">
          {isHR ? (
            <>
              <button
                onClick={() => setActiveTab('workforce')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'workforce'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-300'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-slate-600" />
                Workforce Ledger
              </button>
              <button
                onClick={() => setActiveTab('burnout')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'burnout'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-300'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                Burnout & Integrity
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'audit'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-300'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <History className="w-3.5 h-3.5 text-slate-600" />
                Audit Logs
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-300'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-slate-600" />
                System Settings
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-300'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-slate-600" />
                Shift Console
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-300'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                Attendance Log
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-300'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-slate-600" />
                Productivity Trends
              </button>
            </>
          )}
        </nav>

        {/* User Info, Clock & Logout on the far right */}
        <div className="flex items-center gap-3">
          {/* Subtle Live Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-mono text-slate-600 border border-slate-200">
            <span className="font-semibold text-slate-800">{formattedTime}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">{formattedDate}</span>
          </div>

          {/* User Avatar Pill */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="text-left leading-none pr-1">
              <span className="text-xs font-medium text-slate-900 block">
                {user?.fullName}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {isHR ? 'HR Admin' : user?.department || 'Employee'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-md text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
