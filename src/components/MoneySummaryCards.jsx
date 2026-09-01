import React from 'react';
import { TrendingUp, ArrowDownRight, ChevronRight, Info } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function MoneySummaryCards({
  totalIncome = 0,
  totalSpent = 0,
  incomeCount = 0,
  expenseCount = 0,
  onOpenManageIncome,
  onOpenManageExpenses,
  canManage = true
}) {
  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 tracking-tight">Your Money</h3>
          <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
        </div>
        {canManage && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenManageIncome}
              className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-0.5 transition-colors"
            >
              <span>{incomeCount} Income{incomeCount !== 1 ? 's' : ''}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Dual Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        
        {/* Card 1: Total Income (Opens Personal/Family Income Entries Modal) */}
        <div 
          onClick={canManage ? onOpenManageIncome : undefined}
          className={`fintech-card fintech-card-hover p-4 sm:p-5 flex flex-col justify-between ${canManage ? 'cursor-pointer active:scale-[0.98]' : ''}`}
          role={canManage ? 'button' : undefined}
          title="Manage Income Entries"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            {canManage && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-0.5">
                Manage
              </span>
            )}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Total Income
            </span>
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight block truncate">
              {formatINR(totalIncome)}
            </span>
          </div>
        </div>

        {/* Card 2: Total Expenses (Opens Personal/Family Expense Entries Modal) */}
        <div 
          onClick={canManage ? onOpenManageExpenses : undefined}
          className={`fintech-card fintech-card-hover p-4 sm:p-5 flex flex-col justify-between ${canManage ? 'cursor-pointer active:scale-[0.98]' : ''}`}
          role={canManage ? 'button' : undefined}
          title="Manage Expense Entries"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-800/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            {canManage && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-100 dark:border-rose-800/50 flex items-center gap-0.5">
                Manage
              </span>
            )}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Total Spent
            </span>
            <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight block truncate">
              {formatINR(totalSpent)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
