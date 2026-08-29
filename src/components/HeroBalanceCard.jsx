import React from 'react';
import { IndianRupee, Bell, ChevronDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatINR, getMonthName } from '../utils/formatters';

export default function HeroBalanceCard({
  user,
  month,
  balance = 0,
  budget = 0,
  totalSpent = 0,
  isExceeding80 = false,
  isExceeding100 = false,
  onOpenMonthSelector,
  onOpenBudgetModal,
  isFamily = false,
  groupName = ''
}) {
  const percentSpent = budget > 0 ? ((totalSpent / budget) * 100).toFixed(0) : 0;

  return (
    <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 text-white p-6 sm:p-8 shadow-xl shadow-indigo-500/25">
      
      {/* Subtle Background Glow Rings */}
      <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />

      {/* Top Header inside Card */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-6">
        
        {/* Left: User Avatar & Greetings */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-white text-base shadow-inner border border-white/30">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-purple-600 rounded-full" />
          </div>
          <div>
            <span className="text-white/70 text-xs font-medium block">
              {isFamily ? 'Family Group' : 'Welcome back,'}
            </span>
            <span className="text-white font-bold text-sm sm:text-base leading-tight block truncate max-w-[140px] sm:max-w-[200px]">
              {isFamily ? groupName || 'Family Hub' : user?.name || 'User'}
            </span>
          </div>
        </div>

        {/* Center/Right: Month Selector Chip */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMonthSelector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-xs font-semibold text-white border border-white/20 transition-all shadow-sm"
          >
            <span>{getMonthName(month)}</span>
            <ChevronDown className="w-3.5 h-3.5 text-white/80" />
          </button>

          {/* Alert Status Bell */}
          <div className="relative">
            <div className={`p-2 rounded-full backdrop-blur-md border ${
              isExceeding80
                ? 'bg-rose-500/30 border-rose-300 text-rose-200 animate-pulse'
                : 'bg-white/15 border-white/20 text-white/90'
            }`}>
              <Bell className="w-4 h-4" />
            </div>
            {isExceeding80 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-400 rounded-full ring-2 ring-purple-600" />
            )}
          </div>
        </div>

      </div>

      {/* Main Balance Display */}
      <div className="relative z-10 text-center py-2 sm:py-4">
        <span className="text-white/80 text-xs sm:text-sm font-semibold tracking-wider uppercase block mb-1">
          {isFamily ? 'Group Remaining Balance' : 'Current Balance'}
        </span>
        <div className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1 drop-shadow-md">
          <span>{formatINR(balance)}</span>
        </div>

        {/* Status Subtitle */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium text-white/90 border border-white/20">
          {isExceeding100 ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>Budget exceeded by {formatINR(Math.abs(balance))}</span>
            </>
          ) : isExceeding80 ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>{percentSpent}% of monthly budget spent</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              <span>{budget > 0 ? `${100 - percentSpent}% remaining to spend` : 'Set a budget to track limits'}</span>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
