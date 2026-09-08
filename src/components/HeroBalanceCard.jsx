import React from 'react';
import { Bell, ArrowDownRight, TrendingUp, IndianRupee, ChevronRight } from 'lucide-react';
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
  isExceeding100 = false,
  onOpenManageIncome,
  onOpenManageExpenses
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

        {/* Dual Metric Cards inside Hero Card (Symmetrical Income & Expense Managers) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 pt-3 sm:pt-4">
          
          {/* Card 1: Month Income Box */}
          <div
            onClick={onOpenManageIncome}
            className="group relative overflow-hidden rounded-2xl p-3 sm:p-4 bg-white/10 hover:bg-white/20 active:bg-white/25 dark:bg-white/5 dark:hover:bg-white/10 dark:active:bg-white/15 border border-white/20 dark:border-white/10 backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-[0.98] shadow-sm flex flex-col justify-between"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenManageIncome && onOpenManageIncome()}
            title="View and manage income entries"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-400/20 dark:bg-emerald-500/20 border border-emerald-300/30 dark:border-emerald-400/30 flex items-center justify-center text-emerald-300 dark:text-emerald-400 shadow-inner">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 dark:bg-emerald-500/20 text-emerald-200 dark:text-emerald-300 border border-emerald-400/30 flex items-center gap-0.5 group-hover:bg-emerald-400/30 transition-colors">
                Manage
                <ChevronRight className="w-2.5 h-2.5 opacity-80 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <div>
              <span className="text-[11px] sm:text-xs font-semibold text-indigo-100/80 dark:text-indigo-200/80 block mb-0.5">
                Month Income
              </span>
              <span className="text-base sm:text-xl font-black text-white tracking-tight block truncate">
                {formatINR(displayIncome)}
              </span>
            </div>
          </div>

          {/* Card 2: Month Spent Box */}
          <div
            onClick={onOpenManageExpenses}
            className="group relative overflow-hidden rounded-2xl p-3 sm:p-4 bg-white/10 hover:bg-white/20 active:bg-white/25 dark:bg-white/5 dark:hover:bg-white/10 dark:active:bg-white/15 border border-white/20 dark:border-white/10 backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-[0.98] shadow-sm flex flex-col justify-between"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenManageExpenses && onOpenManageExpenses()}
            title="View and manage expense entries"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-400/20 dark:bg-rose-500/20 border border-rose-300/30 dark:border-rose-400/30 flex items-center justify-center text-rose-300 dark:text-rose-400 shadow-inner">
                <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-400/20 dark:bg-rose-500/20 text-rose-200 dark:text-rose-300 border border-rose-400/30 flex items-center gap-0.5 group-hover:bg-rose-400/30 transition-colors">
                Manage
                <ChevronRight className="w-2.5 h-2.5 opacity-80 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <div>
              <span className="text-[11px] sm:text-xs font-semibold text-indigo-100/80 dark:text-indigo-200/80 block mb-0.5">
                Month Spent
              </span>
              <span className="text-base sm:text-xl font-black text-white tracking-tight block truncate">
                {formatINR(displaySpent)}
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
