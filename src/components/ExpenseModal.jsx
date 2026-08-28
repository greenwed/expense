import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, IndianRupee, Tag, FileText, Check } from 'lucide-react';
import { CATEGORY_CONFIG, formatINR } from '../utils/formatters';

const CATEGORIES = ['Food', 'Shopping', 'Entertainment', 'Medical', 'Transport', 'Others'];

export default function ExpenseModal({ isOpen, onClose, onSave, initialData = null, title = 'Add Expense' }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setCategory(initialData.category || 'Food');
      setDescription(initialData.description || '');
      if (initialData.date) {
        const d = new Date(initialData.date);
        // Format to YYYY-MM-DDTHH:mm for datetime-local input
        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setDateTime(localIso);
      } else {
        setNow();
      }
    } else {
      setAmount('');
      setCategory('Food');
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
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!description || description.trim().length === 0) {
      setError('Description is mandatory.');
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
        category,
        description: description.trim(),
        date: new Date(dateTime).toISOString()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save expense entry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            {title}
          </h3>
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

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Expense Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400 font-bold text-lg">
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
                className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-lg font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-slate-600"
                autoFocus
              />
            </div>
            {/* Quick Add Chips */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-slate-500 font-medium">Quick add:</span>
              {[100, 500, 1000, 2000].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleAddPreset(val)}
                  className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors font-medium"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Category *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const config = CATEGORY_CONFIG[cat];
                const isSelected = category === cat;
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm shadow-emerald-500/20'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description Field (Mandatory) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description (Mandatory) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Weekly grocery, Starbucks coffee, Metro card recharge"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder:text-slate-600"
            />
          </div>

          {/* Date & Time Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Date & Time *
              </label>
              <button
                type="button"
                onClick={setNow}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <Clock className="w-3 h-3" />
                <span>Use Current Time</span>
              </button>
            </div>
            <input
              type="datetime-local"
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors cursor-pointer"
            />
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
              <span>{submitting ? 'Saving...' : initialData ? 'Update Entry' : 'Add Entry'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
