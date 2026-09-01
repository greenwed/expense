import React from 'react';
import { X, ArrowDownRight, Plus, Edit2, Trash2, Tag, Receipt } from 'lucide-react';
import { formatINR, formatDateTime, getMonthName, CATEGORY_CONFIG } from '../utils/formatters';

export default function ExpenseListModal({
  isOpen,
  onClose,
  expenses = [],
  month,
  onOpenAddExpense,
  onOpenEditExpense,
  onDeleteExpense,
  isFamily = false,
  canManage = true
}) {
  if (!isOpen) return null;

  const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-backdrop-fade">
      <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/40 flex items-center justify-center shadow-sm">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {isFamily ? 'Family Expense Entries' : 'Personal Expense Entries'}
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
        <div className="p-6 pb-4 shrink-0 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#1A2234] border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-400 dark:text-slate-400 font-semibold block">Total Monthly Expenses</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {formatINR(totalSpent)}
            </span>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAddExpense();
              }}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-indigo-500 dark:to-cyan-500 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Expense</span>
            </button>
          )}
        </div>

        {/* Expenses List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {expenses.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <Receipt className="w-10 h-10 stroke-[1.5] mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No expense entries recorded this month.</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Click "+ Add Expense" to record daily expenses!</p>
            </div>
          ) : (
            expenses.map((item) => {
              const conf = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Others;
              return (
                <div
                  key={item.id || item._id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-3 group hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{
                        backgroundColor: `${conf.color}15`,
                        color: conf.color
                      }}
                    >
                      <Tag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block truncate">
                        {item.description}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-400 flex-wrap">
                        <span
                          className="font-semibold px-2 py-0.5 rounded-md text-[10px]"
                          style={{
                            backgroundColor: `${conf.color}15`,
                            color: conf.color
                          }}
                        >
                          {conf.name}
                        </span>
                        <span>{formatDateTime(item.date)}</span>
                        {item.userName && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">• by {item.userName}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      -{formatINR(item.amount)}
                    </span>

                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenEditExpense(item);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(item.id || item._id)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
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
