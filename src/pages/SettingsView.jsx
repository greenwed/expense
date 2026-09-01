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
  AlertCircle,
  Eye,
  EyeOff,
  BookOpen,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function SettingsView({ onOpenBudgetModal, onOpenUserGuide, onOpenQuickTour }) {
  const { user, logout, getFullUrl } = useAuth();
  const { theme, setTheme, isDark } = useTheme();

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const resolveUrl = (endpoint) => {
    return getFullUrl ? getFullUrl(endpoint) : endpoint;
  };

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
      const res = await fetch(resolveUrl('/api/auth/reset-password'), {
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
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Settings & Preferences
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
          Manage your appearance, budgets, help guides, and security
        </p>
      </div>

      {/* User Profile Card */}
      <div className="fintech-card p-6 sm:p-7 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 dark:from-indigo-500 dark:to-cyan-500 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20 border-2 border-white dark:border-slate-800">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-400 border-2 border-white dark:border-[#131926] rounded-full flex items-center justify-center" />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{user?.name}</h3>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full inline-block">
                @{user?.username}
              </span>
            </div>
            <button
              onClick={logout}
              className="mt-2 sm:mt-0 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-rose-100 dark:border-rose-900/40"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.email || 'No email linked'}</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Account</span>
            </span>
          </div>
        </div>
      </div>

      {/* 🌙 Appearance & Theme (Day / Night Mode) */}
      <div className="fintech-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            {isDark ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span>Appearance & Theme</span>
          </h4>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 capitalize">
            {theme === 'system' ? (isDark ? 'Auto (Night)' : 'Auto (Day)') : theme === 'dark' ? 'Night Mode' : 'Day Mode'}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Select Day Mode or sleek high-contrast Night Mode customized for effortless reading in the dark.
        </p>

        {/* 3-Option Segmented Control */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-[#1A2234] rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          
          {/* Day / Light Mode */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              theme === 'light'
                ? 'bg-white text-amber-600 shadow-md scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Day</span>
          </button>

          {/* Night / Dark Mode */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              theme === 'dark'
                ? 'bg-[#121826] text-indigo-400 shadow-md scale-[1.02] border border-indigo-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Night</span>
          </button>

          {/* System Default */}
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              theme === 'system'
                ? 'bg-white dark:bg-[#121826] text-indigo-600 dark:text-indigo-400 shadow-md scale-[1.02] dark:border dark:border-indigo-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Auto</span>
          </button>
        </div>
      </div>

      {/* Preferences & Quick Actions */}
      <div className="fintech-card p-6 space-y-4">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Alerts & Limits</span>
        </h4>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">80% & 100% Budget Warning Banner</span>
              <span className="text-xs text-slate-400 dark:text-slate-400">Notifies when spending reaches high thresholds</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-800/40">
              Active
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Monthly Budget Configuration</span>
              <span className="text-xs text-slate-400 dark:text-slate-400">Update your target monthly expenditure limit</span>
            </div>
            <button
              type="button"
              onClick={onOpenBudgetModal}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-bold text-xs transition-colors border border-indigo-100 dark:border-indigo-800/60"
            >
              Update Budget
            </button>
          </div>
        </div>
      </div>

      {/* Help & User Guide */}
      <div className="fintech-card p-6 space-y-4">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>User Guide & Support</span>
        </h4>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="py-3 flex items-center justify-between gap-3">
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">RupeeTrack User Guide</span>
              <span className="text-xs text-slate-400 dark:text-slate-400">Complete handbook, metrics explanation, and feature documentation</span>
            </div>
            <button
              type="button"
              onClick={onOpenUserGuide}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 border border-indigo-100 dark:border-indigo-800/60"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Open Guide</span>
            </button>
          </div>

          <div className="py-3 flex items-center justify-between gap-3">
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Quick App Tour</span>
              <span className="text-xs text-slate-400 dark:text-slate-400">Replay the interactive step-by-step app walkthrough</span>
            </div>
            <button
              type="button"
              onClick={onOpenQuickTour}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#222C42] text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 border border-slate-200/60 dark:border-slate-700/60"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Start Tour</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security & Password */}
      <div className="fintech-card p-6 space-y-4">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Change Password</span>
        </h4>

        {msg.text && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              msg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
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
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full pl-4 pr-11 py-2.5 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                tabIndex={-1}
                title={showNewPass ? 'Hide password' : 'Show password'}
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPass ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full pl-4 pr-11 py-2.5 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                tabIndex={-1}
                title={showConfirmPass ? 'Hide password' : 'Show password'}
              >
                {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-indigo-500 dark:to-cyan-500 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Save New Password'}
          </button>
        </form>
      </div>

    </div>
  );
}
