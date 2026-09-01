import React from 'react';
import { Bell, ArrowDownRight, TrendingUp, IndianRupee } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function HeroBalanceCard({
  user,
  totalBalance,
  remainingBalance = 0,
  monthlyIncome,
  totalIncome = 0,
  monthlySpent,
  totalSpent = 0,
  percentSpent = 0,
  isExceeding80 = false,
  isExceeding100 = false
}) {
  const avatarLetter = (user?.name || user?.username || 'U')[0].toUpperCase();
  const displayBalance = totalBalance !== undefined ? totalBalance : remainingBalance;
  const displayIncome = monthlyIncome !== undefined ? monthlyIncome : totalIncome;
  const displaySpent = monthlySpent !== undefined ? monthlySpent : totalSpent;

  return (
    <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-700 dark:from-[#121828] dark:via-[#1A2238] dark:to-[#0F1422] dark:border dark:border-indigo-500/25 text-white p-6 sm:p-7 shadow-2xl shadow-indigo-600/30 dark:shadow-black/50 transition-all">
      
      {/* Decorative Ambient Glass Elements */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 dark:bg-indigo-500/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-indigo-900/30 dark:bg-cyan-500/10 blur-2xl pointer-events-none" />

      {/* Top Bar inside Card */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-6">
        
        {/* User Info & Avatar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/20 flex items-center justify-center font-black text-lg text-white shadow-inner">
              {avatarLetter}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-indigo-700 dark:border-[#121828]" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-indigo-200 dark:text-indigo-300 uppercase tracking-wider block">
              Hello,
            </span>
            <h2 className="text-base font-extrabold text-white tracking-tight leading-tight">
              {user?.name || user?.username || 'Explorer'}
            </h2>
          </div>
        </div>

        {/* Right Spend Indicator */}
        <div className="flex items-center gap-2">
          {displayIncome > 0 && (
            <span className="text-xs font-extrabold text-indigo-100 dark:text-indigo-200 bg-white/15 dark:bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/15 dark:border-white/10 shadow-sm">
              {percentSpent}% Spent
            </span>
          )}

          <div className="relative w-9 h-9 rounded-2xl bg-white/15 dark:bg-white/10 border border-white/20 dark:border-white/10 flex items-center justify-center text-white backdrop-blur-md">
            <Bell className="w-4 h-4" />
            {(isExceeding80 || isExceeding100) && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            )}
            {(isExceeding80 || isExceeding100) && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </div>
        </div>

      </div>

      {/* Main Total Balance Hero Section (Running Balance Regardless of Months) */}
      <div className="relative z-10 space-y-1">
        <span className="text-xs font-bold text-indigo-200 dark:text-indigo-300 uppercase tracking-wider block">
          Total Balance
        </span>

        <div className="flex items-baseline gap-2">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {formatINR(displayBalance)}
          </h1>
        </div>

        {/* Breakdown Stats */}
        <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-indigo-100 dark:text-slate-300 flex-wrap">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-300 dark:text-emerald-400" />
            <span>Month Income: {formatINR(displayIncome)}</span>
          </span>
          <span className="text-indigo-300 dark:text-slate-500">•</span>
          <span className="flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-300 dark:text-rose-400" />
            <span>Month Spent: {formatINR(displaySpent)}</span>
          </span>
        </div>
      </div>

    </div>
  );
}
