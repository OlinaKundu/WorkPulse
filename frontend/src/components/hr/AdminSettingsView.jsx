import React, { useState, useEffect } from 'react';
import {
  Building2,
  Mail,
  Users,
  MapPin,
  Compass,
  KeyRound,
  Server,
  Send,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function AdminSettingsView({ onSettingsChanged }) {
  const { user: currentUser } = useAuth();

  // --- Office Settings State ---
  const [officeAddress, setOfficeAddress] = useState('');
  const [officeLat, setOfficeLat] = useState(12.971598);
  const [officeLon, setOfficeLon] = useState(77.594562);
  const [officeRadius, setOfficeRadius] = useState(200);
  const [officeLoading, setOfficeLoading] = useState(false);
  const [officeSuccess, setOfficeSuccess] = useState('');
  const [officeError, setOfficeError] = useState('');

  // --- Email Settings State ---
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [senderName, setSenderName] = useState('WorkPulse HR');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailTestResult, setEmailTestResult] = useState(null);

  // --- Employee Management State ---
  const [employees, setEmployees] = useState([]);
  const [confirmUser, setConfirmUser] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [empSuccess, setEmpSuccess] = useState('');
  const [empError, setEmpError] = useState('');

  const loadAllSettings = async () => {
    try {
      const [officeRes, emailRes, empRes] = await Promise.all([
        api.get('/admin/settings/office'),
        api.get('/admin/settings/email'),
        api.get('/users/employees'),
      ]);

      if (officeRes.data) {
        setOfficeAddress(officeRes.data.address || '');
        setOfficeLat(officeRes.data.latitude || 12.971598);
        setOfficeLon(officeRes.data.longitude || 77.594562);
        setOfficeRadius(officeRes.data.radiusMeters || 200);
      }

      if (emailRes.data) {
        setSmtpUser(emailRes.data.smtpUser || '');
        setSmtpPass(emailRes.data.smtpPass || '');
        setSenderName(emailRes.data.senderName || 'WorkPulse HR');
        setSmtpHost(emailRes.data.smtpHost || 'smtp.gmail.com');
        setSmtpPort(emailRes.data.smtpPort || 587);
      }

      if (empRes.data) {
        setEmployees(empRes.data);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  useEffect(() => {
    loadAllSettings();
  }, []);

  // --- GPS Auto Detect ---
  const handleDetectGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOfficeLat(parseFloat(pos.coords.latitude.toFixed(6)));
          setOfficeLon(parseFloat(pos.coords.longitude.toFixed(6)));
          setOfficeSuccess('GPS coordinates captured from current device.');
        },
        (err) => {
          setOfficeError('Could not detect GPS location. Please check browser permissions.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setOfficeError('Geolocation is not supported by your browser.');
    }
  };

  // --- Save Office Settings ---
  const handleSaveOffice = async (e) => {
    e.preventDefault();
    setOfficeError('');
    setOfficeSuccess('');
    setOfficeLoading(true);

    try {
      await api.put('/admin/settings/office', {
        address: officeAddress,
        latitude: parseFloat(officeLat),
        longitude: parseFloat(officeLon),
        radiusMeters: parseFloat(officeRadius),
      });
      setOfficeSuccess('Office location and geofence parameters updated.');
      if (onSettingsChanged) onSettingsChanged();
    } catch (err) {
      setOfficeError(err.message || 'Failed to save office settings.');
    } finally {
      setOfficeLoading(false);
    }
  };

  // --- Save Email Settings ---
  const handleSaveEmail = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');
    setEmailTestResult(null);
    setEmailLoading(true);

    try {
      await api.put('/admin/settings/email', {
        smtpUser: smtpUser.trim(),
        smtpPass: smtpPass.trim(),
        senderName: senderName.trim(),
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort),
      });
      setEmailSuccess('Company email configuration saved.');
      if (onSettingsChanged) onSettingsChanged();
    } catch (err) {
      setEmailError(err.message || 'Failed to save email settings.');
    } finally {
      setEmailLoading(false);
    }
  };

  // --- Send Test Email ---
  const handleSendTestEmail = async () => {
    setEmailError('');
    setEmailSuccess('');
    setEmailTestResult(null);
    setEmailTesting(true);

    try {
      await api.put('/admin/settings/email', {
        smtpUser: smtpUser.trim(),
        smtpPass: smtpPass.trim(),
        senderName: senderName.trim(),
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort),
      });

      const res = await api.post('/admin/settings/email/test', {
        targetEmail: smtpUser.trim(),
      });
      setEmailTestResult({
        type: 'success',
        text: res.message || 'Test email dispatched successfully!',
        previewUrl: res.previewUrl,
      });
    } catch (err) {
      setEmailTestResult({
        type: 'error',
        text: err.message || 'Failed to dispatch test email. Please check your Gmail App Password.',
      });
    } finally {
      setEmailTesting(false);
    }
  };

  // --- Delete User Account ---
  const handleDeleteUser = async (userToDelete) => {
    setEmpError('');
    setEmpSuccess('');
    setDeletingId(userToDelete.id);

    try {
      const res = await api.delete(`/admin/users/${userToDelete.id}`, {
        reason: deleteReason.trim() || 'Employee account removed by HR Administrator',
      });
      setEmpSuccess(res.message || 'Account deleted permanently.');
      setConfirmUser(null);
      setDeleteReason('');
      loadAllSettings();
      if (onSettingsChanged) onSettingsChanged();
    } catch (err) {
      setEmpError(err.message || 'Failed to delete account.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          System Administration & Preferences
        </div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight mt-1">
          Organization Settings & Management
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-normal">
          Configure office GPS perimeters, automated company email dispatch, and manage staff access.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: Office Location & Geofencing */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Office Location & Geofence</h3>
                  <p className="text-xs text-slate-500">Calculates Haversine geodesic check-in distances</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDetectGPS}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              >
                <Compass className="w-3.5 h-3.5 text-slate-600" />
                <span>Auto-Detect GPS</span>
              </button>
            </div>

            {officeError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{officeError}</span>
              </div>
            )}

            {officeSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{officeSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveOffice} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Office Name / Postal Address
                </label>
                <input
                  type="text"
                  required
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                  placeholder="e.g. Corporate HQ, 4th Floor, Tech Hub Tower"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:border-slate-800 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Latitude (°N)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={officeLat}
                    onChange={(e) => setOfficeLat(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:bg-white focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Longitude (°E)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={officeLon}
                    onChange={(e) => setOfficeLon(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:bg-white focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Geofence Allowed Radius (Meters)
                </label>
                <input
                  type="number"
                  min="20"
                  max="5000"
                  required
                  value={officeRadius}
                  onChange={(e) => setOfficeRadius(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:bg-white focus:border-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1 font-normal">
                  Check-ins farther than this distance will be automatically tagged as <strong className="text-amber-800 font-medium">Remote</strong>.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={officeLoading}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {officeLoading ? 'Saving...' : 'Save Office Location'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* CARD 2: Company Email & Notifications */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Company Email & SMTP</h3>
                  <p className="text-xs text-slate-500">Automated employee notification dispatch</p>
                </div>
              </div>
            </div>

            {/* Quick Gmail Guide */}
            <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800">
              <span className="font-semibold">Gmail Setup: </span>
              <span className="text-[11px] text-slate-600">
                Generate a 16-character code at{' '}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-medium text-slate-900 hover:text-slate-700 inline-flex items-center gap-0.5"
                >
                  Google App Passwords <ExternalLink className="w-2.5 h-2.5" />
                </a>.
              </span>
            </div>

            {emailError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{emailError}</span>
              </div>
            )}

            {emailSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{emailSuccess}</span>
              </div>
            )}

            {emailTestResult && (
              <div className={`mb-4 p-3 rounded-lg text-xs flex flex-col gap-1 border ${
                emailTestResult.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <div className="flex items-center gap-2 font-medium">
                  {emailTestResult.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{emailTestResult.text}</span>
                </div>
                {emailTestResult.previewUrl && (
                  <a
                    href={emailTestResult.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-[11px] font-mono text-slate-900 mt-1 inline-flex items-center gap-1"
                  >
                    <span>View Delivered Email Web Preview</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            <form onSubmit={handleSaveEmail} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Gmail Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="company.hr@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:bg-white focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google App Password (16 chars)
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="abcd efgh ijkl mnop"
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:bg-white focus:border-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SMTP Host / Port
                  </label>
                  <input
                    type="text"
                    value={`${smtpHost}:${smtpPort}`}
                    disabled
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={emailTesting || !smtpUser}
                  className="px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <Send className={`w-3.5 h-3.5 ${emailTesting ? 'animate-bounce' : ''}`} />
                  <span>{emailTesting ? 'Testing...' : 'Send Test Email'}</span>
                </button>

                <button
                  type="submit"
                  disabled={emailLoading}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {emailLoading ? 'Saving...' : 'Save Email Setup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* CARD 3: Employee Accounts Management & Deletion */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Registered Staff Directory & Accounts</h3>
              <p className="text-xs text-slate-500">View registered employees and permanently terminate accounts</p>
            </div>
          </div>

          <span className="text-xs text-slate-600 font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            Total Staff: <strong>{employees.length}</strong>
          </span>
        </div>

        {empError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{empError}</span>
          </div>
        )}

        {empSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{empSuccess}</span>
          </div>
        )}

        {/* Confirmation Banner */}
        {confirmUser && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-3">
            <div className="flex items-start gap-2 text-rose-800 font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                Confirm Permanent Account Deletion for <strong>{confirmUser.fullName}</strong> ({confirmUser.email})
              </div>
            </div>
            <p className="text-[11px] text-rose-700">
              This will permanently delete this employee account, their shift logs, and break records. An immutable audit record will be logged.
            </p>
            <input
              type="text"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Enter deletion reason (e.g. Contract ended, Resigned)"
              className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmUser(null)}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(confirmUser)}
                disabled={deletingId === confirmUser.id}
                className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {deletingId === confirmUser.id ? 'Deleting...' : 'Confirm & Delete Permanently'}
              </button>
            </div>
          </div>
        )}

        {/* Staff Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Leave Balance</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => {
                const isSelf = emp.id === currentUser?.id || emp.email === currentUser?.email;
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{emp.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{emp.email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{emp.department?.name || 'General'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${emp.role === 'HR' ? 'bg-slate-100 text-slate-800 border border-slate-300' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                      {emp.leaveBalance} Days
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isSelf ? (
                        <span className="text-[11px] text-slate-400 italic">Current User</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmUser(emp);
                            setEmpError('');
                            setEmpSuccess('');
                          }}
                          className="px-2.5 py-1 rounded-md bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-300 hover:border-rose-300 text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
