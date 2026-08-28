import React from 'react';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, User, Users, LogOut, Sparkles } from 'lucide-react';

export default function Navbar({ activeWorkspace, setActiveWorkspace, groupCount = 0 }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
              <IndianRupee className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">RupeeTrack</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ₹ INR
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Smart Personal & Family Expense Hub</p>
            </div>
          </div>

          {/* Workspace Switcher Tabs */}
          <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveWorkspace('personal')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeWorkspace === 'personal'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Personal</span>
            </button>

            <button
              onClick={() => setActiveWorkspace('family')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeWorkspace === 'family'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Family</span>
              {groupCount > 0 && (
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeWorkspace === 'family' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-300'
                }`}>
                  {groupCount}
                </span>
              )}
            </button>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-200">{user?.name}</span>
              <span className="text-xs text-emerald-400 font-mono">@{user?.username}</span>
            </div>
            
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700/60 hover:border-rose-500/40 transition-all flex items-center gap-1.5 text-xs font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
