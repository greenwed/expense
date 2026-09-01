import React, { useState, useEffect } from 'react';
import { X, Wallet, Check, AlertCircle } from 'lucide-react';
import { formatINR, getMonthName } from '../utils/formatters';

export default function BudgetModal({
  isOpen,
  onClose,
  currentBudget = 0,
  month,
  onSave,
  isFamily = false,
  groupName = ''
}) {
  const [budgetAmount, setBudgetAmount] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setBudgetAmount(currentBudget > 0 ? String(currentBudget) : '');
    setError('');
  }, [currentBudget, isOpen]);

  const handlePreset = (val) => {
    setBudgetAmount(String(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const val = parseFloat(budgetAmount);
    if (isNaN(val) || val < 0) {
      setError('Please enter a valid non-negative budget amount.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave(val);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update monthly budget.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-backdrop-fade">
      <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isFamily ? 'Family Monthly Budget' : 'Personal Monthly Budget'}
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-400">For {getMonthName(month)}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Total Budget Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-600 dark:text-indigo-400 font-black text-xl">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0"
                required
                placeholder="e.g. 20000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xl font-black focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#1E2638] transition-all shadow-inner"
                autoFocus
              />
            </div>

            {/* Quick Budget Presets */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1">
              <span className="text-[11px] text-slate-400 dark:text-slate-400 font-semibold shrink-0">Presets:</span>
              {[5000, 10000, 25000, 50000, 100000].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => handlePreset(preset)}
                  className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#222C42] text-slate-700 dark:text-slate-200 font-bold transition-colors shrink-0 border border-transparent dark:border-slate-700/60"
                >
                  {formatINR(preset)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/50 text-indigo-900 dark:text-indigo-300 text-xs leading-relaxed space-y-1">
            <span className="font-bold block">💡 Target Spending Limit</span>
            <p className="text-slate-600 dark:text-slate-300">
              This budget sets your target spending threshold for {getMonthName(month)}. You will receive visual indicators at 80% and 100% consumption.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-indigo-500 dark:to-cyan-500 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{submitting ? 'Saving...' : 'Set Budget'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
