import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Receipt,
  Calendar,
  Tag,
  User,
  Users,
  Check,
  Percent,
  Calculator,
  Equal,
  Sparkles,
  AlertCircle,
  ChevronDown,
  Utensils,
  Car,
  Zap,
  Film,
  ShoppingBag,
  Plane,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_CONFIG } from '../utils/formatters';

const CATEGORIES = [
  'Food',
  'Transport',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Travel',
  'Others'
];

const ICON_MAP = {
  Food: Utensils,
  Transport: Car,
  Utilities: Zap,
  Entertainment: Film,
  Shopping: ShoppingBag,
  Travel: Plane,
  Others: MoreHorizontal
};

const CATEGORY_COLORS = {
  Food: '#0EA5E9',
  Transport: '#3B82F6',
  Utilities: '#F59E0B',
  Entertainment: '#8B5CF6',
  Shopping: '#F97316',
  Travel: '#10B981',
  Others: '#6B7280'
};

function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  icon: LeadingIcon
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between gap-2 hover:bg-slate-100/80 dark:hover:bg-[#20293D] transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      >
        <div className="flex items-center gap-2 truncate">
          {selected?.avatarColor && (
            <div
              className="w-5 h-5 rounded-lg text-white font-bold text-[10px] flex items-center justify-center shrink-0"
              style={{ backgroundColor: selected.avatarColor }}
            >
              {selected.label ? selected.label[0].toUpperCase() : 'M'}
            </div>
          )}
          {selected?.icon && !selected?.avatarColor && (
            React.createElement(selected.icon, {
              className: 'w-4 h-4 shrink-0',
              style: { color: selected.color || '#6366F1' }
            })
          )}
          {LeadingIcon && !selected?.icon && !selected?.avatarColor && (
            <LeadingIcon className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <span className="truncate">{selected?.label || placeholder}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-56 overflow-y-auto rounded-2xl bg-white dark:bg-[#151C2C] border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 space-y-1 animate-fadeIn">
            {options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1F273B]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.avatarColor && (
                      <div
                        className="w-5 h-5 rounded-lg text-white font-bold text-[10px] flex items-center justify-center shrink-0"
                        style={{ backgroundColor: opt.avatarColor }}
                      >
                        {opt.label ? opt.label[0].toUpperCase() : 'M'}
                      </div>
                    )}
                    {opt.icon && !opt.avatarColor && (
                      React.createElement(opt.icon, {
                        className: 'w-4 h-4 shrink-0',
                        style: { color: opt.color || '#6366F1' }
                      })
                    )}
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function AddSplitExpenseModal({
  isOpen,
  onClose,
  onExpenseAdded,
  onExpenseUpdated,
  groups = [],
  friends = [],
  initialGroupId = null,
  editingExpense = null
}) {
  const { apiFetch, user } = useAuth();
  const [mounted, setMounted] = useState(false);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || '');
  const [payerId, setPayerId] = useState('');
  const [splitMethod, setSplitMethod] = useState('equal'); // 'equal' | 'exact' | 'percentage'

  // Participant IDs participating in this split
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
  // Custom exact share amounts { [userId]: number }
  const [exactShares, setExactShares] = useState({});
  // Custom percentage shares { [userId]: number }
  const [percentShares, setPercentShares] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentUserId = String(user?._id || user?.id || '');

  // Determine eligible candidates based on group selection
  const eligibleMembers = useMemo(() => {
    if (selectedGroupId) {
      const g = groups.find(grp => String(grp.id || grp._id) === String(selectedGroupId));
      if (g && g.members && g.members.length > 0) {
        return g.members.map(m => ({
          userId: String(m.userId || m.id || m._id),
          name: m.name || m.friendName || 'Member',
          username: m.username || m.friendUsername || '',
          avatarColor: m.avatarColor || '#6366F1'
        }));
      }
    }

    // Default: current user + all friends
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
          name: f.friendName || f.name || 'Friend',
          username: f.friendUsername || f.username || '',
          avatarColor: f.avatarColor || '#8B5CF6'
        });
      }
    });

    return list;
  }, [selectedGroupId, groups, friends, currentUserId, user]);

  // Reset/initialize when modal opens or group changes
  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        setDescription(editingExpense.description || '');
        setAmount(String(editingExpense.amount || ''));
        setCategory(editingExpense.category || 'Food');
        setDate(editingExpense.date ? editingExpense.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
        setSelectedGroupId(editingExpense.groupId || initialGroupId || '');
        setPayerId(String(editingExpense.payerId || currentUserId));
        setSplitMethod(editingExpense.splitMethod || 'equal');

        if (editingExpense.participants && editingExpense.participants.length > 0) {
          const pIds = editingExpense.participants.map(p => String(p.userId || p.id));
          setSelectedParticipantIds(pIds);

          const exact = {};
          const perc = {};
          editingExpense.participants.forEach(p => {
            const uid = String(p.userId || p.id);
            exact[uid] = Number(p.shareAmount) || 0;
            perc[uid] = Number(p.percentage) || 0;
          });
          setExactShares(exact);
          setPercentShares(perc);
        }
      } else {
        setDescription('');
        setAmount('');
        setCategory('Food');
        setDate(new Date().toISOString().slice(0, 10));
        setSelectedGroupId(initialGroupId || (groups[0]?.id || groups[0]?._id || ''));
        setPayerId(currentUserId);
        setSplitMethod('equal');
      }
      setError('');
    }
  }, [isOpen, initialGroupId, groups, currentUserId, editingExpense]);

  // When eligible members change, select all by default and distribute shares
  useEffect(() => {
    if (eligibleMembers.length > 0) {
      const allIds = eligibleMembers.map(m => m.userId);
      setSelectedParticipantIds(allIds);

      // Default equal exact shares & percentages
      const count = allIds.length;
      const parsedAmt = Number(amount) || 0;
      const baseShare = count > 0 ? Math.round((parsedAmt / count) * 100) / 100 : 0;
      const basePercent = count > 0 ? Math.round((100 / count) * 10) / 10 : 0;

      const initExact = {};
      const initPercent = {};
      allIds.forEach(id => {
        initExact[id] = baseShare;
        initPercent[id] = basePercent;
      });
      setExactShares(initExact);
      setPercentShares(initPercent);
    }
  }, [eligibleMembers]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const toggleParticipant = (uId) => {
    setSelectedParticipantIds(prev => {
      if (prev.includes(uId)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter(id => id !== uId);
      } else {
        return [...prev, uId];
      }
    });
  };

  const parsedAmount = Number(amount) || 0;
  const activeParticipants = eligibleMembers.filter(m => selectedParticipantIds.includes(m.userId));
  const activeCount = activeParticipants.length;

  // Exact split validation
  const exactSum = useMemo(() => {
    return selectedParticipantIds.reduce((sum, id) => sum + (Number(exactShares[id]) || 0), 0);
  }, [selectedParticipantIds, exactShares]);

  const exactDiff = Math.round((parsedAmount - exactSum) * 100) / 100;
  const isExactBalanced = Math.abs(exactDiff) < 0.05;
  const isExactValid = isExactBalanced && parsedAmount > 0;

  // Percentage split validation
  const percentSum = useMemo(() => {
    return selectedParticipantIds.reduce((sum, id) => sum + (Number(percentShares[id]) || 0), 0);
  }, [selectedParticipantIds, percentShares]);

  const percentDiff = Math.round((100 - percentSum) * 10) / 10;
  const isPercentBalanced = Math.abs(percentDiff) < 0.05;
  const isPercentValid = isPercentBalanced && parsedAmount > 0;

  const groupOptions = useMemo(() => [
    { value: '', label: 'Direct Friend Split (No Group)', icon: Users },
    ...groups.map(g => ({
      value: String(g.id || g._id),
      label: g.name,
      sublabel: `${(g.members || []).length} members`,
      icon: Users
    }))
  ], [groups]);

  const payerOptions = useMemo(() => {
    return eligibleMembers.map(m => ({
      value: m.userId,
      label: `${m.name}${m.userId === currentUserId ? ' (You)' : ''}`,
      sublabel: m.username ? `@${m.username}` : '',
      avatarColor: m.avatarColor || '#6366F1'
    }));
  }, [eligibleMembers, currentUserId]);

  const categoryOptions = useMemo(() => {
    return CATEGORIES.map(cat => ({
      value: cat,
      label: cat,
      icon: ICON_MAP[cat] || MoreHorizontal,
      color: CATEGORY_COLORS[cat] || '#8B5CF6'
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please enter an expense description.');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid expense amount.');
      return;
    }
    if (activeCount === 0) {
      setError('At least one participant must be included in the split.');
      return;
    }

    if (splitMethod === 'exact' && !isExactValid) {
      setError(`Exact amounts must sum to ₹${parsedAmount.toFixed(2)} (currently ₹${exactSum.toFixed(2)}).`);
      return;
    }

    if (splitMethod === 'percentage' && !isPercentValid) {
      setError(`Percentages must sum to 100% (currently ${percentSum}%).`);
      return;
    }

    const payer = eligibleMembers.find(m => m.userId === payerId) || {
      userId: currentUserId,
      name: user?.name || 'You'
    };

    let participantsPayload = [];

    if (splitMethod === 'equal') {
      const baseShare = Math.floor((parsedAmount / activeCount) * 100) / 100;
      const remainder = Math.round((parsedAmount - (baseShare * activeCount)) * 100) / 100;

      participantsPayload = activeParticipants.map((p, idx) => ({
        userId: p.userId,
        name: p.name,
        shareAmount: idx === 0 ? baseShare + remainder : baseShare
      }));
    } else if (splitMethod === 'exact') {
      participantsPayload = activeParticipants.map(p => ({
        userId: p.userId,
        name: p.name,
        shareAmount: Number(exactShares[p.userId]) || 0
      }));
    } else if (splitMethod === 'percentage') {
      participantsPayload = activeParticipants.map(p => {
        const pct = Number(percentShares[p.userId]) || 0;
        return {
          userId: p.userId,
          name: p.name,
          percentage: pct,
          shareAmount: Math.round(((pct / 100) * parsedAmount) * 100) / 100
        };
      });
    }

    try {
      setLoading(true);
      setError('');

      const endpoint = editingExpense
        ? `/api/split/expenses/${editingExpense.id || editingExpense._id}`
        : '/api/split/expenses';
      const method = editingExpense ? 'PUT' : 'POST';

      const data = await apiFetch(endpoint, {
        method,
        body: JSON.stringify({
          groupId: selectedGroupId || null,
          payerId: payer.userId,
          payerName: payer.name,
          amount: parsedAmount,
          description: description.trim(),
          category,
          date,
          splitMethod,
          participants: participantsPayload
        })
      });

      if (editingExpense) {
        if (onExpenseUpdated) onExpenseUpdated(data?.expense);
        if (onExpenseAdded) onExpenseAdded(data?.expense);
      } else {
        if (onExpenseAdded) onExpenseAdded(data?.expense);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save split expense.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-backdrop-fade">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 dark:from-indigo-500 dark:to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingExpense ? 'Edit Split Expense' : 'Add Split Expense'}
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-400">
                {editingExpense ? 'Update amount, split method or shares' : 'Divide costs with friends or groups'}
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

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Description & Amount Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dinner, Groceries, Uber"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Amount
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Group & Who Paid Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Group
              </label>
              <CustomDropdown
                value={selectedGroupId}
                onChange={setSelectedGroupId}
                options={groupOptions}
                icon={Users}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Who Paid?
              </label>
              <CustomDropdown
                value={payerId}
                onChange={setPayerId}
                options={payerOptions}
                icon={User}
              />
            </div>
          </div>

          {/* Category & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Category
              </label>
              <CustomDropdown
                value={category}
                onChange={setCategory}
                options={categoryOptions}
                icon={Tag}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          {/* ================= 3 SPLIT METHODS TABS ================= */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Split Method
              </label>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                {activeCount} member{activeCount !== 1 ? 's' : ''} sharing
              </span>
            </div>

            {/* 3 Pills: Equal | Exact | Percentage */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-[#1A2234] rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setSplitMethod('equal')}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  splitMethod === 'equal'
                    ? 'bg-white dark:bg-[#111726] text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Equal className="w-3.5 h-3.5" />
                <span>Equal</span>
              </button>
              <button
                type="button"
                onClick={() => setSplitMethod('exact')}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  splitMethod === 'exact'
                    ? 'bg-white dark:bg-[#111726] text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Exact ₹</span>
              </button>
              <button
                type="button"
                onClick={() => setSplitMethod('percentage')}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  splitMethod === 'percentage'
                    ? 'bg-white dark:bg-[#111726] text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Percent %</span>
              </button>
            </div>

            {/* Validation Feedback for Exact and Percentage */}
            {splitMethod === 'exact' && (
              <div className={`p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between border ${
                parsedAmount <= 0
                  ? 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  : isExactBalanced
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : exactDiff > 0
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
              }`}>
                <span>Total: ₹{exactSum.toFixed(2)} / ₹{parsedAmount.toFixed(2)}</span>
                <span>
                  {parsedAmount <= 0
                    ? 'Enter expense amount first'
                    : isExactBalanced
                      ? '✓ Balanced'
                      : exactDiff > 0
                        ? `Remaining: ₹${exactDiff.toFixed(2)}`
                        : `Over by: ₹${Math.abs(exactDiff).toFixed(2)}`}
                </span>
              </div>
            )}

            {splitMethod === 'percentage' && (
              <div className={`p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between border ${
                isPercentBalanced
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : percentDiff > 0
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
              }`}>
                <span>Total: {percentSum.toFixed(1)}% / 100%</span>
                <span>
                  {isPercentBalanced
                    ? '✓ 100% Balanced'
                    : percentDiff > 0
                      ? `Needs ${percentDiff.toFixed(1)}% more`
                      : `Over by ${Math.abs(percentDiff).toFixed(1)}%`}
                </span>
              </div>
            )}

            {/* Single member hint if user has no friends in direct split */}
            {eligibleMembers.length === 1 && !selectedGroupId && (
              <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/40 flex items-start gap-2.5 text-xs text-indigo-950 dark:text-indigo-200">
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Splitting alone?</span>
                  <span className="text-slate-600 dark:text-slate-300">
                    You are currently the only person in this direct split. Add friends using <strong>+ Add Friend</strong> or create a <strong>Split Group</strong> to share expenses with others!
                  </span>
                </div>
              </div>
            )}

            {/* Participants list with inputs per split method */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {eligibleMembers.map(m => {
                const isChecked = selectedParticipantIds.includes(m.userId);
                const isSelf = m.userId === currentUserId;

                // For Equal method:
                const equalShare = activeCount > 0 ? (parsedAmount / activeCount).toFixed(2) : '0.00';

                return (
                  <div
                    key={m.userId}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isChecked
                        ? 'bg-slate-50/90 dark:bg-[#1A2234] border-slate-200/90 dark:border-slate-700/80 shadow-xs'
                        : 'opacity-50 bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800'
                    }`}
                  >
                    {/* Member Info + Checkbox */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleParticipant(m.userId)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                          isChecked
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div
                        className="w-7 h-7 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0"
                        style={{ backgroundColor: m.avatarColor || '#6366F1' }}
                      >
                        {m.name ? m.name[0].toUpperCase() : 'M'}
                      </div>

                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                          {m.name} {isSelf ? '(You)' : ''}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">
                          @{m.username || 'member'}
                        </span>
                      </div>
                    </div>

                    {/* Method Specific Share Control */}
                    {isChecked && (
                      <div className="shrink-0 flex items-center gap-2">
                        {splitMethod === 'equal' && (
                          <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                            ₹{equalShare}
                          </span>
                        )}

                        {splitMethod === 'exact' && (
                          <div className="relative w-24">
                            <span className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                              ₹
                            </span>
                            <input
                              type="number"
                              step="any"
                              value={exactShares[m.userId] !== undefined ? exactShares[m.userId] : ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setExactShares(prev => ({ ...prev, [m.userId]: val }));
                              }}
                              className="w-full pl-5 pr-2 py-1 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-700 text-xs font-bold text-right text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder="0"
                            />
                          </div>
                        )}

                        {splitMethod === 'percentage' && (
                          <div className="flex items-center gap-1.5">
                            <div className="relative w-18">
                              <input
                                type="number"
                                step="any"
                                value={percentShares[m.userId] !== undefined ? percentShares[m.userId] : ''}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setPercentShares(prev => ({ ...prev, [m.userId]: val }));
                                }}
                                className="w-full pl-2 pr-5 py-1 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-700 text-xs font-bold text-right text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="0"
                              />
                              <span className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                                %
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono w-14 text-right">
                              ₹{((Number(percentShares[m.userId] || 0) / 100) * parsedAmount).toFixed(0)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading || !parsedAmount || !description.trim() || (splitMethod === 'exact' && !isExactValid) || (splitMethod === 'percentage' && !isPercentValid)}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            {editingExpense ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4 stroke-[3]" />}
            <span>{loading ? 'Saving...' : editingExpense ? 'Save Changes' : 'Add Split Expense'}</span>
          </button>
        </form>

      </div>
    </div>,
    document.body
  );
}
