import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, ArrowRight, IndianRupee, Calendar, FileText, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SettleUpModal({
  isOpen,
  onClose,
  onSettled,
  friends = [],
  groups = [],
  initialPayeeId = null,
  initialPayerId = null,
  suggestedAmount = 0
}) {
  const { apiFetch, user } = useAuth();
  const [mounted, setMounted] = useState(false);

  const currentUserId = String(user?._id || user?.id || '');

  const [payerId, setPayerId] = useState(initialPayerId || currentUserId);
  const [payeeId, setPayeeId] = useState(initialPayeeId || (friends[0]?.friendId || ''));
  const [amount, setAmount] = useState(suggestedAmount > 0 ? String(suggestedAmount) : '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('Settled via UPI');
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Candidate users: current user + all friends
  const allUsers = useMemo(() => {
    const list = [
      {
        userId: currentUserId,
        name: user?.name || 'You',
        username: user?.username || '',
        avatarColor: '#6366F1'
      }
    ];

    friends.forEach(f => {
      const fId = String(f.friendId || f.userId || f.id);
      if (fId && fId !== currentUserId) {
        list.push({
          userId: fId,
          name: f.friendName || f.name,
          username: f.friendUsername || f.username,
          avatarColor: f.avatarColor || '#8B5CF6'
        });
      }
    });

    return list;
  }, [friends, currentUserId, user]);

  useEffect(() => {
    if (isOpen) {
      setPayerId(initialPayerId || currentUserId);
      setPayeeId(initialPayeeId || (friends[0]?.friendId || ''));
      setAmount(suggestedAmount > 0 ? String(suggestedAmount) : '');
      setDate(new Date().toISOString().slice(0, 10));
      setNote('Settled via UPI');
      setGroupId('');
      setError('');
    }
  }, [isOpen, initialPayeeId, initialPayerId, suggestedAmount, currentUserId, friends]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const payer = allUsers.find(u => u.userId === payerId) || { userId: currentUserId, name: 'You' };
  const payee = allUsers.find(u => u.userId === payeeId) || { userId: payeeId, name: 'Friend' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid settlement amount.');
      return;
    }
    if (payerId === payeeId) {
      setError('Payer and Payee cannot be the same person.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await apiFetch('/api/split/settle', {
        method: 'POST',
        body: JSON.stringify({
          groupId: groupId || null,
          payerId,
          payerName: payer.name,
          payeeId,
          payeeName: payee.name,
          amount: parsedAmount,
          date,
          note: note.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record settlement.');
      }

      if (onSettled) onSettled(data.settlement);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record settlement.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-backdrop-fade">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Settle Up
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-400">
                Record a payment & clear debts
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Payment Flow Visual Card: Who pays who */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex-1 text-center">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
                Payer (Paid)
              </span>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full text-xs font-bold p-2 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              >
                {allUsers.map(u => (
                  <option key={u.userId} value={u.userId}>
                    {u.name} {u.userId === currentUserId ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-4">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="flex-1 text-center">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
                Payee (Received)
              </span>
              <select
                value={payeeId}
                onChange={(e) => setPayeeId(e.target.value)}
                className="w-full text-xs font-bold p-2 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              >
                {allUsers.map(u => (
                  <option key={u.userId} value={u.userId}>
                    {u.name} {u.userId === currentUserId ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Amount Paid
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-600 dark:text-emerald-400 font-black text-lg">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 text-base font-extrabold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Payment Method / Quick Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Payment Method & Note
            </label>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {['UPI / GPay', 'Cash', 'Bank Transfer'].map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setNote(`Settled via ${method}`)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    note.includes(method)
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-[#1A2234] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Paid via UPI / GPay"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          {/* Date & Optional Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Group (Optional)
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="">Direct Settlement</option>
                {groups.map(g => (
                  <option key={g.id || g._id} value={g.id || g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !amount || Number(amount) <= 0}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{loading ? 'Recording Settlement...' : 'Record Payment & Settle'}</span>
          </button>
        </form>

      </div>
    </div>,
    document.body
  );
}
