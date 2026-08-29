import React from 'react';
import { AlertTriangle, Sparkles, TrendingUp, ChevronRight, ShieldAlert } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function BudgetWarningBanner({
  budget = 0,
  totalSpent = 0,
  remainingBalance = 0,
  isExceeding80 = false,
  isExceeding100 = false,
  onOpenBudgetModal
}) {
  if (budget <= 0) return null;

  const percentSpent = ((totalSpent / budget) * 100).toFixed(0);

  if (isExceeding100) {
    return (
      <div className="rounded-2xl bg-rose-950/90 border border-rose-500/40 p-4 text-white shadow-xl shadow-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block">
              Budget Limit Exceeded!
            </span>
            <p className="text-xs text-rose-200">
              You have spent <strong>{formatINR(totalSpent)}</strong> ({percentSpent}% of {formatINR(budget)} budget).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenBudgetModal}
          className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          Increase Budget
        </button>
      </div>
    );
  }

  if (isExceeding80) {
    return (
      <div className="rounded-2xl bg-amber-950/80 border border-amber-500/40 p-4 text-white shadow-xl shadow-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
              80% Warning Threshold Reached
            </span>
            <p className="text-xs text-amber-200">
              You have used <strong>{percentSpent}%</strong> of your monthly budget. Only {formatINR(remainingBalance)} remaining.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenBudgetModal}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          Adjust Budget
        </button>
      </div>
    );
  }

  // Normal / Safe Insight Pill (matching Screen 1 "Your insight is ready")
  return (
    <div className="rounded-2xl bg-slate-900 text-white p-3.5 px-4 shadow-lg border border-slate-800 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="text-xs text-slate-300 font-medium">
          Budget is on track • <strong>{formatINR(remainingBalance)}</strong> available this month
        </span>
      </div>
      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
        {percentSpent}% Used
      </span>
    </div>
  );
}
