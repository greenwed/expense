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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      
      <div className="relative bg-white border border-slate-200/80 rounded-t-[32px] sm:rounded-[32px] w-full max-w-sm p-6 shadow-2xl space-y-4 animate-slideUp">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Add New Entry</h3>
            <p className="text-xs text-slate-400">Choose what you would like to record</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
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
            className="p-4 rounded-2xl bg-slate-50 hover:bg-violet-50/60 border border-slate-200/80 hover:border-violet-300 flex items-center gap-3.5 transition-all text-left group active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 group-hover:bg-rose-100 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-sm transition-colors">
              <ArrowDownRight className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 group-hover:text-violet-900 block">
                Add Expense
              </span>
              <span className="text-xs text-slate-400 font-medium block">
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
            className="p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 flex items-center gap-3.5 transition-all text-left group active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm transition-colors">
              <TrendingUp className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-900 block">
                Add Income
              </span>
              <span className="text-xs text-slate-400 font-medium block">
                Salary, share dividends, rental, gifts
              </span>
            </div>
          </button>

        </div>

      </div>
    </div>
  );
}
