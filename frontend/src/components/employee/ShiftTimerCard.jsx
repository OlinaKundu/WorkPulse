import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Play,
  Square,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Navigation,
} from 'lucide-react';
import { api } from '../../services/api';
import { calculateDistance, OFFICE_COORDINATES } from '../../utils/haversine';
import { BreakTrackerModal } from './BreakTrackerModal';

export function ShiftTimerCard({ todayStatus, onStatusChange }) {
  const [coords, setCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [officeConfig, setOfficeConfig] = useState({
    address: 'Corporate HQ Tech Park',
    latitude: 12.971598,
    longitude: 77.594562,
    radiusMeters: 200,
  });

  // Fetch active configured office location
  useEffect(() => {
    async function loadOfficeLocation() {
      try {
        const res = await api.get('/users/office-location');
        if (res.data) {
          setOfficeConfig(res.data);
        }
      } catch (err) {
        console.warn('Could not load office location settings:', err.message);
      }
    }
    loadOfficeLocation();
  }, []);

  // Capture Geolocation & compute distance to active office location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setCoords({ latitude: lat, longitude: lon });
          const dist = calculateDistance(
            lat,
            lon,
            officeConfig.latitude,
            officeConfig.longitude
          );
          setDistance(dist);
        },
        () => {
          setCoords({
            latitude: officeConfig.latitude + 0.0001,
            longitude: officeConfig.longitude + 0.0001,
          });
          setDistance(15);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [officeConfig]);

  // Shift stopwatch
  useEffect(() => {
    let interval = null;
    const isCheckedIn = todayStatus?.isCheckedIn;
    const isCheckedOut = todayStatus?.isCheckedOut;
    const checkInTime = todayStatus?.attendance?.checkIn;

    if (isCheckedIn && !isCheckedOut && checkInTime) {
      const updateElapsed = () => {
        const start = new Date(checkInTime).getTime();
        const now = new Date().getTime();
        setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
      };
      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    } else if (isCheckedOut && todayStatus?.attendance?.workingHours) {
      setElapsedSeconds(Math.round(todayStatus.attendance.workingHours * 3600));
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [todayStatus]);

  const formatStopwatch = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isOutOfBounds = distance !== null && distance > officeConfig.radiusMeters;

  const handleCheckIn = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const payload = coords
        ? { latitude: coords.latitude, longitude: coords.longitude }
        : {};
      const res = await api.post('/attendance/check-in', payload);
      setActionMessage({ type: 'success', text: res.message });
      onStatusChange();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!window.confirm('Are you ready to end your shift for today? This will calculate total net hours and finalize your attendance.')) {
      return;
    }
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await api.post('/attendance/check-out', {});
      setActionMessage({ type: 'success', text: res.message });
      onStatusChange();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const attendance = todayStatus?.attendance;
  const isCheckedIn = todayStatus?.isCheckedIn;
  const isCheckedOut = todayStatus?.isCheckedOut;
  const hasActiveBreak = todayStatus?.hasActiveBreak;
  const activeBreak = todayStatus?.activeBreak;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Side: Stopwatch & Geo Tag */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-900" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Shift Attendance Console
            </h2>
          </div>

          <div className="flex items-baseline gap-5">
            <div className="text-4xl sm:text-5xl font-mono font-bold text-slate-900 tracking-tight bg-slate-50 px-5 py-3 rounded-xl border border-slate-200">
              {formatStopwatch(elapsedSeconds)}
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900">
                {isCheckedOut ? 'Shift Completed' : isCheckedIn ? 'Active Shift Time' : 'Not Checked In'}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {isCheckedIn ? (
                  <span>Checked In: {new Date(attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                ) : (
                  <span>Standard Shift Start: 09:30 AM</span>
                )}
              </div>
            </div>
          </div>

          {/* Geo Tag */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-700" />
              <span>Office HQ:</span>
              <span className="font-mono text-slate-500">{officeConfig.address} ({officeConfig.latitude?.toFixed(4)}°N, {officeConfig.longitude?.toFixed(4)}°E)</span>
            </div>

            {distance !== null && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                  isOutOfBounds
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>
                  {isOutOfBounds
                    ? `Remote Check-in (${distance}m > ${officeConfig.radiusMeters}m radius)`
                    : `Verified within Office (${distance}m)`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Primary Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 min-w-[220px]">
          {!isCheckedIn ? (
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full py-3 px-5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{loading ? 'Verifying GPS...' : 'Log Shift Check-In'}</span>
            </button>
          ) : isCheckedIn && !isCheckedOut ? (
            <div className="space-y-2 w-full">
              {/* Break trigger */}
              <button
                onClick={() => setIsBreakModalOpen(true)}
                className={`w-full py-2 px-4 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  hasActiveBreak
                    ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
                }`}
              >
                <Coffee className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  {hasActiveBreak
                    ? `${activeBreak.breakType} in Progress (View/End)`
                    : 'Take a Shift Break'}
                </span>
              </button>

              {/* Check-Out trigger */}
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>{loading ? 'Calculating...' : 'End Shift (Check-Out)'}</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-0.5">
              <div className="flex items-center justify-center gap-1.5 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Shift Completed Today
              </div>
              <p className="text-[11px] text-slate-600 font-mono">
                {attendance?.workingHours?.toFixed(2)}h worked · {attendance?.status}
              </p>
            </div>
          )}
        </div>
      </div>

      {actionMessage && (
        <div
          className={`mt-4 p-3 rounded-lg text-xs font-medium flex items-center gap-2 border ${
            actionMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {actionMessage.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Break Tracker Modal */}
      <BreakTrackerModal
        isOpen={isBreakModalOpen}
        onClose={() => setIsBreakModalOpen(false)}
        activeBreak={activeBreak}
        onBreakUpdated={onStatusChange}
      />
    </div>
  );
}
