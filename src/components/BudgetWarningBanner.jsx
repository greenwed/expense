import React from 'react';
import { AlertTriangle, AlertOctagon, TrendingUp } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function BudgetWarningBanner({ budget, totalSpent, isExceeding80, isExceeding100, percentSpent }) {
  if (!budget || budget <= 0 || !isExceeding80) {
    return null;
  }

  const isOverBudget = isExceeding100 || totalSpent > budget;
  const overAmount = totalSpent - budget;
  const remaining = budget - totalSpent;

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition-all shadow-lg ${
        isOverBudget
          ? 'bg-gradient-to-r from-rose-950/80 to-rose-900/40 border-rose-500/50 text-rose-100 shadow-rose-950/40'
          : 'bg-gradient-to-r from-amber-950/80 to-amber-900/40 border-amber-500/50 text-amber-100 shadow-amber-950/40'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl mt-0.5 ${
              isOverBudget ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isOverBudget ? (
              <AlertOctagon className="w-6 h-6 animate-pulse text-rose-400" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-base tracking-tight flex items-center gap-2">
              {isOverBudget ? 'Critical Alert: Budget Exceeded!' : 'Budget Warning: 80% Threshold Reached'}
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isOverBudget ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/30 text-amber-300'
              }`}>
                {percentSpent}% Spent
              </span>
            </h4>
            <p className="text-sm mt-1 opacity-90 leading-relaxed">
              {isOverBudget ? (
                <>
                  You have spent <strong className="text-white">{formatINR(totalSpent)}</strong> against your monthly budget of{' '}
                  <strong className="text-white">{formatINR(budget)}</strong>. You are currently{' '}
                  <strong className="text-rose-300 underline font-semibold">{formatINR(overAmount)} over budget</strong>.
                </>
              ) : (
                <>
                  You have consumed <strong className="text-white">{percentSpent}%</strong> of your monthly limit ({formatINR(totalSpent)} spent out of {formatINR(budget)}). Only{' '}
                  <strong className="text-amber-300 font-semibold">{formatINR(remaining)} remaining</strong> for the rest of this month.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Meter */}
      <div className="mt-3.5 pt-3 border-t border-white/10">
        <div className="w-full bg-slate-900/60 rounded-full h-2.5 overflow-hidden border border-white/10 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverBudget ? 'bg-rose-500' : 'bg-amber-400'
            }`}
            style={{ width: `${Math.min(percentSpent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
