import React from 'react';
import { X, TrendingUp, Plus, Edit2, Trash2, Calendar, FileText } from 'lucide-react';
import { formatINR, formatDateTime, getMonthName } from '../utils/formatters';

export default function IncomeListModal({
  isOpen,
  onClose,
  incomes = [],
  month,
  onOpenAddIncome,
  onOpenEditIncome,
  onDeleteIncome,
  isFamily = false,
  canManage = true
}) {
  if (!isOpen) return null;

  const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-backdrop-fade">
      <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {isFamily ? 'Family Income Entries' : 'Personal Income Entries'}
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-400">{getMonthName(month)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Pill & Add Trigger */}
        <div className="p-6 pb-2 shrink-0 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#1A2234] border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-400 dark:text-slate-400 font-semibold block">Total Monthly Income</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatINR(totalIncome)}
            </span>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAddIncome();
              }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Income</span>
            </button>
          )}
        </div>

        {/* Incomes List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {incomes.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <TrendingUp className="w-10 h-10 stroke-[1.5] mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No income entries recorded this month.</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Click "+ Add Income" to record salary, shares, or gifts!</p>
            </div>
          ) : (
            incomes.map((item) => (
              <div
                key={item.id || item._id}
                className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-3 group hover:border-emerald-200 dark:hover:border-emerald-500/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-sm font-bold text-base border border-transparent dark:border-emerald-800/40">
                    +
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-slate-900 dark:text-white block truncate">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-400">
                      <span>{formatDateTime(item.date)}</span>
                      {item.userName && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">• by {item.userName}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                    +{formatINR(item.amount)}
                  </span>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenEditIncome(item);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                        title="Edit Income"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteIncome(item.id || item._id)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                        title="Delete Income"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1A2234] text-right shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shadow-md transition-colors border border-transparent dark:border-slate-700"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
