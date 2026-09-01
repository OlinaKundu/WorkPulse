import React, { useState, useEffect } from 'react';
import { Coffee, Utensils, Users, Pause, Play, X, Clock, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export function BreakTrackerModal({ isOpen, onClose, activeBreak, onBreakUpdated }) {
  const [breakType, setBreakType] = useState('Lunch');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    if (activeBreak && activeBreak.breakStart) {
      const updateElapsed = () => {
        const start = new Date(activeBreak.breakStart).getTime();
        const now = new Date().getTime();
        setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
      };
      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeBreak]);

  if (!isOpen) return null;

  const formatElapsed = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartBreak = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/breaks/start', { breakType });
      onBreakUpdated();
    } catch (err) {
      setError(err.message || 'Failed to start break');
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/breaks/end', {});
      onBreakUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to end break');
    } finally {
      setLoading(false);
    }
  };

  const breakTypes = [
    { id: 'Lunch', label: 'Lunch Break', icon: Utensils, duration: '45m standard', desc: 'Standard shift meal interval' },
    { id: 'Coffee', label: 'Coffee / Refreshment', icon: Coffee, duration: '15m standard', desc: 'Short interval break' },
    { id: 'Meeting', label: 'Internal Meeting', icon: Users, duration: 'Variable', desc: 'Cross-functional session' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Shift Break Tracker</h3>
              <p className="text-xs text-slate-500">Duration is deducted from gross shift hours</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Active Break State */}
        {activeBreak ? (
          <div className="text-center py-6 px-4 bg-amber-50/50 rounded-xl border border-amber-200 mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
              {activeBreak.breakType} in Progress
            </div>

            <div className="text-4xl font-bold font-mono text-slate-900 tracking-tight my-2">
              {formatElapsed(elapsedSeconds)}
            </div>

            <p className="text-xs text-slate-500 font-mono mt-1">
              Started at {new Date(activeBreak.breakStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>

            <button
              onClick={handleEndBreak}
              disabled={loading}
              className="mt-5 w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {loading ? (
                <span>Concluding Break...</span>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>End Break & Resume Shift</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Select Break Type */
          <div className="space-y-3">
            <div className="space-y-2">
              {breakTypes.map((type) => {
                const IconComponent = type.icon;
                const isSelected = breakType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setBreakType(type.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100 border-slate-400 text-slate-900 shadow-2xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'
                        }`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{type.label}</p>
                        <p className="text-[11px] text-slate-500">{type.desc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {type.duration}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span>
                Net calculation formula: <code className="text-slate-800 font-mono font-medium">Net = Gross Shift - Breaks</code>
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartBreak}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Starting...</span>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Start {breakType} Break</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
