import React, { useState, useEffect } from 'react';
import { X, Clock, Check, TrendingUp, Sparkles } from 'lucide-react';
import { formatINR } from '../utils/formatters';

const SUGGESTIONS = ['Salary', 'Stock Dividend', 'Gift', 'Freelance', 'Rental Income', 'Bonus', 'Interest'];

export default function IncomeModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  title = 'Add Income Entry',
  isFamily = false
}) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setDescription(initialData.description || '');
      if (initialData.date) {
        const d = new Date(initialData.date);
        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setDateTime(localIso);
      } else {
        setNow();
      }
    } else {
      setAmount('');
      setDescription('');
      setNow();
    }
    setError('');
  }, [initialData, isOpen]);

  const setNow = () => {
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setDateTime(localIso);
  };

  const handleAddPreset = (val) => {
    const current = Number(amount) || 0;
    setAmount(String(current + val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid income amount greater than 0.');
      return;
    }

    if (!description || description.trim().length === 0) {
      setError('Income description is mandatory (e.g. Salary, Share, Gift).');
      return;
    }

    if (!dateTime) {
      setError('Please select a date and time.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        amount: numAmount,
        description: description.trim(),
        date: new Date(dateTime).toISOString()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save income entry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-backdrop-fade">
      <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{title}</h3>
              <span className="text-xs text-slate-400 dark:text-slate-400">
                {isFamily ? 'Record shared family income' : 'Record personal income'}
              </span>
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
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Income Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-600 dark:text-emerald-400 font-extrabold text-xl">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xl font-black focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-[#1E2638] transition-all shadow-inner"
                autoFocus
              />
            </div>
            {/* Quick Add Chips */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
              <span className="text-[11px] text-slate-400 dark:text-slate-400 font-semibold shrink-0">Quick add:</span>
              {[1000, 5000, 10000, 25000, 50000].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleAddPreset(val)}
                  className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#1A2234] hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-200 font-bold transition-colors shrink-0 border border-transparent dark:border-slate-700/60"
                >
                  +{formatINR(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description (Mandatory) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly Salary, Stock Dividend, Birthday Gift"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-[#1E2638] transition-colors"
            />
            {/* Quick Suggestions Chips */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[11px] text-slate-400 dark:text-slate-400 font-semibold">Suggestions:</span>
              {SUGGESTIONS.map((sug) => (
                <button
                  type="button"
                  key={sug}
                  onClick={() => setDescription(sug)}
                  className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#222C42] text-slate-700 dark:text-slate-200 font-medium transition-colors border border-transparent dark:border-slate-700/60"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Date & Time *
              </label>
              <button
                type="button"
                onClick={setNow}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Use Current Time</span>
              </button>
            </div>
            <input
              type="datetime-local"
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-[#1E2638] transition-colors cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{submitting ? 'Saving...' : initialData ? 'Update Income' : 'Add Income'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
