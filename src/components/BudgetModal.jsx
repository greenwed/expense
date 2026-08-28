import React, { useState, useEffect } from 'react';
import { X, IndianRupee, Check, Sparkles } from 'lucide-react';
import { getMonthName } from '../utils/formatters';

export default function BudgetModal({ isOpen, onClose, onSave, currentBudget = 0, month, isFamily = false }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setAmount(currentBudget > 0 ? String(currentBudget) : '');
    setError('');
  }, [currentBudget, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      setError('Please enter a valid positive budget amount.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave(numAmount);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update budget.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-400" />
              {isFamily ? 'Set Group Monthly Budget' : 'Set Personal Monthly Budget'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Budget limit for <span className="text-emerald-300 font-semibold">{getMonthName(month)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Monthly Limit (₹)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400 font-bold text-xl">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="100"
                required
                placeholder="e.g. 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xl font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-slate-600"
                autoFocus
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div>
            <span className="block text-xs text-slate-400 mb-2">Common Presets:</span>
            <div className="grid grid-cols-4 gap-2">
              {[5000, 10000, 25000, 50000].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setAmount(String(val))}
                  className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  ₹{val.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed">
            💡 <strong>Theoretical Tracker:</strong> This budget is for planning purposes and is not linked to any real bank. You can increase or decrease this limit anytime.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
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
