import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  LogOut,
  ShieldCheck,
  Bell,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SettingsView({ onOpenBudgetModal }) {
  const { user, logout } = useAuth();
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPass.length < 4) {
      setMsg({ type: 'error', text: 'Password must be at least 4 characters.' });
      return;
    }

    try {
      setLoading(true);
      setMsg({ type: '', text: '' });
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          otp: 'DIRECT', // Direct authenticated session update
          newPassword: newPass
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password.');

      setMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 lg:pb-8 max-w-2xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Settings & Profile
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          Manage your account preferences and security settings
        </p>
      </div>

      {/* User Profile Card */}
      <div className="fintech-card p-6 sm:p-7 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border-2 border-white">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-400 border-2 border-white rounded-full flex items-center justify-center" />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">{user?.name}</h3>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full inline-block">
                @{user?.username}
              </span>
            </div>
            <button
              onClick={logout}
              className="mt-2 sm:mt-0 px-4 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-rose-100"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.email || 'No email linked'}</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Account</span>
            </span>
          </div>
        </div>
      </div>

      {/* Preferences & Quick Actions */}
      <div className="fintech-card p-6 space-y-4">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600" />
          <span>Alerts & Limits</span>
        </h4>
        <div className="divide-y divide-slate-100">
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-800 block">80% & 100% Budget Warning Banner</span>
              <span className="text-xs text-slate-400">Notifies when spending reaches high thresholds</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
              Active
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-800 block">Monthly Budget Configuration</span>
              <span className="text-xs text-slate-400">Update your target monthly expenditure limit</span>
            </div>
            <button
              type="button"
              onClick={onOpenBudgetModal}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs transition-colors"
            >
              Update Budget
            </button>
          </div>
        </div>
      </div>

      {/* Security & Password */}
      <div className="fintech-card p-6 space-y-4">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-600" />
          <span>Change Password</span>
        </h4>

        {msg.text && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              msg.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">New Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Save New Password'}
          </button>
        </form>
      </div>

    </div>
  );
}
