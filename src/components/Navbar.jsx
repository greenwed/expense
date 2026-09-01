import React from 'react';
import {
  IndianRupee,
  Home,
  PieChart,
  Users,
  Settings,
  Plus,
  TrendingUp,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMonthName } from '../utils/formatters';

export default function Navbar({
  activeTab = 'home',
  onChangeTab,
  month,
  onOpenMonthSelector,
  onOpenAddExpense,
  onOpenAddIncome
}) {
  const { user } = useAuth();

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'report', label: 'Report', icon: PieChart },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <header 
      className="sticky top-0 z-30 bg-white/95 dark:bg-[#0E1320]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-6">
            <div 
              onClick={() => onChangeTab('home')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 dark:from-indigo-500 dark:to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 dark:shadow-indigo-500/10 group-hover:scale-105 transition-transform">
                <IndianRupee className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight block leading-tight">
                  RupeeTrack
                </span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 block -mt-0.5">
                  Follow your spending
                </span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-[#131926] p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onChangeTab(t.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-white dark:bg-[#1E2638] text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Single Month Selector Chip (Desktop & Tablet) */}
            <button
              type="button"
              onClick={onOpenMonthSelector}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#131926] hover:bg-slate-100 dark:hover:bg-[#1E2638] border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
              <span>{getMonthName(month)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
            </button>

            {/* Desktop + Income Button */}
            <button
              type="button"
              onClick={onOpenAddIncome}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-2xl border border-emerald-200 dark:border-emerald-800/50 transition-all active:scale-95"
            >
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
              <span>+ Income</span>
            </button>

            {/* Desktop + Add Expense CTA */}
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-indigo-500 dark:to-cyan-500 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Expense</span>
            </button>

            {/* User Pill / Settings Trigger */}
            <button
              type="button"
              onClick={() => onChangeTab('settings')}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl bg-slate-50 dark:bg-[#131926] border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 dark:from-indigo-500 dark:to-cyan-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="hidden md:inline text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[90px] truncate">
                {user?.name || 'User'}
              </span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
