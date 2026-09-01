import React from 'react';
import { X, ArrowDownRight, TrendingUp } from 'lucide-react';

export default function QuickAddModal({
  isOpen,
  onClose,
  onSelectAddExpense,
  onSelectAddIncome
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-backdrop-fade">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      
      <div className="relative bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-t-[32px] sm:rounded-[32px] w-full max-w-sm p-6 shadow-2xl space-y-4 animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add New Entry</h3>
            <p className="text-xs text-slate-400 dark:text-slate-400">Choose what you would like to record</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2 Clear Options */}
        <div className="grid grid-cols-1 gap-3 pt-1">
          
          {/* Option 1: Add Expense */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectAddExpense();
            }}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1A2234] hover:bg-rose-50/60 dark:hover:bg-rose-950/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-800 flex items-center gap-3.5 transition-all text-left group active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50 flex items-center justify-center shrink-0 shadow-sm transition-colors">
              <ArrowDownRight className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 block">
                Add Expense
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-400 font-medium block">
                Food, shopping, rent, bills & transport
              </span>
            </div>
          </button>

          {/* Option 2: Add Income */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectAddIncome();
            }}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1A2234] hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-800 flex items-center gap-3.5 transition-all text-left group active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center shrink-0 shadow-sm transition-colors">
              <TrendingUp className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 block">
                Add Income
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-400 font-medium block">
                Salary, share dividends, rental, gifts
              </span>
            </div>
          </button>

        </div>

      </div>
    </div>
  );
}
