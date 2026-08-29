import React from 'react';
import { Wallet, ArrowDownRight, Edit3, ChevronRight, Info } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function MoneySummaryCards({
  budget = 0,
  totalSpent = 0,
  onEditBudget,
  canEditBudget = true
}) {
  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-bold text-slate-800 tracking-tight">Your Money</h3>
          <Info className="w-3.5 h-3.5 text-slate-400" />
        </div>
        {canEditBudget && (
          <button
            type="button"
            onClick={onEditBudget}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
          >
            <span>Set Budget</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dual Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        
        {/* Card 1: Total Budget */}
        <div 
          onClick={canEditBudget ? onEditBudget : undefined}
          className={`fintech-card fintech-card-hover p-4 sm:p-5 flex flex-col justify-between ${canEditBudget ? 'cursor-pointer' : ''}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
            {canEditBudget && (
              <span className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 transition-colors">
                <Edit3 className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              Monthly Budget
            </span>
            <span className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight block truncate">
              {formatINR(budget)}
            </span>
          </div>
        </div>

        {/* Card 2: Total Spent */}
        <div className="fintech-card fintech-card-hover p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
              Spent
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              Total Expenses
            </span>
            <span className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight block truncate">
              {formatINR(totalSpent)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
