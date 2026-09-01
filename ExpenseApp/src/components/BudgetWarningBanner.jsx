import React from 'react';
import { AlertTriangle, AlertCircle, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function BudgetWarningBanner({
  isExceeding80,
  isExceeding100,
  percentSpent = 0,
  totalSpent = 0,
  totalIncome = 0,
  remainingBalance = 0,
  onOpenAddIncome
}) {
  if (totalIncome === 0) {
    return (
      <div className="rounded-2xl p-4 bg-slate-900 text-white flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-100 block">
              Set Your Monthly Income Stream
            </span>
            <span className="text-[11px] text-slate-400">
              Add income (salary, shares, gifts) to unlock automated budget health tracking.
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenAddIncome}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shrink-0 shadow-md transition-all active:scale-95"
        >
          + Add Income
        </button>
      </div>
    );
  }

  if (isExceeding100) {
    return (
      <div className="rounded-2xl p-4 bg-rose-500 text-white flex items-center gap-3 shadow-lg shadow-rose-500/20 animate-pulse">
        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-extrabold text-white">
            Over Income Alert ({percentSpent}%)
          </h4>
          <p className="text-[11px] text-rose-100 font-medium leading-tight mt-0.5">
            Total expenses ({formatINR(totalSpent)}) have exceeded your total income ({formatINR(totalIncome)}) by {formatINR(Math.abs(remainingBalance))}.
          </p>
        </div>
      </div>
    );
  }

  if (isExceeding80) {
    return (
      <div className="rounded-2xl p-4 bg-amber-500 text-white flex items-center gap-3 shadow-lg shadow-amber-500/20">
        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-extrabold text-white">
            High Spending Warning ({percentSpent}% of Income)
          </h4>
          <p className="text-[11px] text-amber-100 font-medium leading-tight mt-0.5">
            You have spent over 80% of your income. Only {formatINR(remainingBalance)} remaining.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-200 block">
            Spending Well Within Income
          </span>
          <span className="text-[11px] text-slate-400">
            {formatINR(remainingBalance)} ({100 - percentSpent}% of income) remaining to spend.
          </span>
        </div>
      </div>
      <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-xl shrink-0">
        {percentSpent}% Used
      </span>
    </div>
  );
}
