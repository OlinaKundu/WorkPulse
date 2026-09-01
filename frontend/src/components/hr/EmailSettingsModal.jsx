import React, { useState, useEffect } from 'react';
import { Mail, KeyRound, Server, Send, CheckCircle2, AlertCircle, X, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';

export function EmailSettingsModal({ isOpen, onClose, onSettingsUpdated }) {
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [senderName, setSenderName] = useState('WorkPulse HR');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    async function loadSettings() {
      if (!isOpen) return;
      setError('');
      setSuccessMsg('');
      setTestResult(null);
      try {
        const res = await api.get('/admin/settings/email');
        if (res.data) {
          setSmtpUser(res.data.smtpUser || '');
          setSmtpPass(res.data.smtpPass || '');
          setSenderName(res.data.senderName || 'WorkPulse HR');
          setSmtpHost(res.data.smtpHost || 'smtp.gmail.com');
          setSmtpPort(res.data.smtpPort || 587);
        }
      } catch (err) {
        console.error('Error fetching email settings:', err);
      }
    }
    loadSettings();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setTestResult(null);
    setLoading(true);

    try {
      const res = await api.put('/admin/settings/email', {
        smtpUser: smtpUser.trim(),
        smtpPass: smtpPass.trim(),
        senderName: senderName.trim(),
        smtpHost: smtpHost.trim(),
        smtpPort: Number(smtpPort),
      });
      setSuccessMsg(res.message || 'Email settings saved successfully!');
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err) {
      setError(err.message || 'Failed to save email settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    setError('');
    setSuccessMsg('');
    setTestResult(null);
    setTesting(true);

    try {
      // First auto-save if credentials were typed
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
      setTestResult({
        type: 'success',
        text: res.message || 'Test email dispatched successfully!',
        previewUrl: res.previewUrl,
      });
    } catch (err) {
      setTestResult({
        type: 'error',
        text: err.message || 'Failed to dispatch test email. Please check your Gmail App Password.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Company Email & Notification Settings
              </h3>
              <p className="text-xs text-slate-500">
                Configure company Gmail for automated staff notifications
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gmail Setup Instructions Box */}
        <div className="mb-5 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-1.5">
          <div className="font-semibold flex items-center gap-1.5">
            <span>ℹ️ How to get your Google App Password:</span>
          </div>
          <ol className="list-decimal pl-4 space-y-1 text-[11px] text-indigo-900/90">
            <li>Ensure <strong>2-Step Verification</strong> is enabled on your Google Account.</li>
            <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="font-semibold underline inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-800">Google App Passwords <ExternalLink className="w-2.5 h-2.5" /></a>.</li>
            <li>Create an app named <strong>WorkPulse</strong> and paste the generated 16-character code below.</li>
          </ol>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {testResult && (
          <div className={`mb-4 p-3 rounded-lg text-xs flex flex-col gap-1 border ${
            testResult.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <div className="flex items-center gap-2 font-medium">
              {testResult.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{testResult.text}</span>
            </div>
            {testResult.previewUrl && (
              <a
                href={testResult.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="underline text-[11px] font-mono text-indigo-600 mt-1 inline-flex items-center gap-1"
              >
                <span>View Delivered Email Web Preview</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Company Gmail / Sender Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="company.hr@gmail.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 font-mono transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Google App Password (16 characters) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                placeholder="abcd efgh ijkl mnop"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 font-mono transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Do not use your regular Gmail password. Use a 16-character App Password.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Sender Display Name
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. WorkPulse HR Team"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                SMTP Server Host
              </label>
              <div className="relative">
                <Server className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                SMTP Port
              </label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSendTest}
              disabled={testing || !smtpUser}
              className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${testing ? 'animate-bounce' : ''}`} />
              <span>{testing ? 'Sending Test...' : 'Send Test Email'}</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Email Configuration'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
