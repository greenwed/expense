import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Plus,
  Receipt,
  UserPlus,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  Scale,
  Sparkles,
  ArrowRight,
  Check,
  Share2,
  Tag,
  DollarSign,
  Calendar,
  Layers,
  Search,
  Settings,
  ChevronDown,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
  Utensils,
  Car,
  Zap,
  Film,
  ShoppingBag,
  Plane,
  HeartPulse,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  formatINR,
  formatDateTime,
  formatDateOnly,
  getMonthName,
  getCurrentMonthStr
} from '../utils/formatters';

import AddSplitExpenseModal from '../components/AddSplitExpenseModal';
import CreateSplitGroupModal from '../components/CreateSplitGroupModal';
import AddFriendModal from '../components/AddFriendModal';
import SettleUpModal from '../components/SettleUpModal';
import SplitGroupSettingsModal from '../components/SplitGroupSettingsModal';
import { useBackButton } from '../context/BackHandlerContext';

const CATEGORY_ICON_MAP = {
  Food: Utensils,
  Transport: Car,
  Utilities: Zap,
  Entertainment: Film,
  Shopping: ShoppingBag,
  Travel: Plane,
  Medical: HeartPulse,
  Others: MoreHorizontal
};

const CATEGORY_COLOR_MAP = {
  Food: '#0EA5E9',
  Transport: '#6366F1',
  Utilities: '#F59E0B',
  Entertainment: '#8B5CF6',
  Shopping: '#F97316',
  Travel: '#10B981',
  Medical: '#10B981',
  Others: '#6B7280'
};

export default function SplitWorkspace({ month: propMonth }) {
  const { apiFetch, user } = useAuth();
  const currentMonth = propMonth || getCurrentMonthStr();

  const [mounted, setMounted] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [isAllTime, setIsAllTime] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('all');
  const [activeSubTab, setActiveSubTab] = useState('expenses'); // 'expenses' | 'friends' | 'activity'

  const [data, setData] = useState({
    summary: { totalOwedToYou: 0, totalYouOwe: 0, netBalance: 0 },
    groups: [],
    friends: [],
    recentActivities: []
  });
  const [groupDetailsData, setGroupDetailsData] = useState(null);
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedGroupForExpense, setSelectedGroupForExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [settleTarget, setSettleTarget] = useState({ payerId: null, payeeId: null, amount: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAnyModalOpen = Boolean(
    isGroupModalOpen ||
    isGroupSettingsOpen ||
    isAddExpenseOpen ||
    isCreateGroupOpen ||
    isAddFriendOpen ||
    isSettleUpOpen
  );

  useBackButton(() => {
    if (isGroupSettingsOpen) {
      setIsGroupSettingsOpen(false);
      return true;
    }
    if (isGroupModalOpen) {
      setIsGroupModalOpen(false);
      return true;
    }
    if (isSettleUpOpen) {
      setIsSettleUpOpen(false);
      return true;
    }
    if (isAddExpenseOpen) {
      setIsAddExpenseOpen(false);
      setEditingExpense(null);
      return true;
    }
    if (isAddFriendOpen) {
      setIsAddFriendOpen(false);
      return true;
    }
    if (isCreateGroupOpen) {
      setIsCreateGroupOpen(false);
      return true;
    }
  }, isAnyModalOpen, 15);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/split/dashboard');
      if (res) {
        setData(res);
        // Default selectedGroupId to the first group if not set
        if (!selectedGroupId && res.groups && res.groups.length > 0) {
          setSelectedGroupId(res.groups[0].id || res.groups[0]._id);
        } else if (!selectedGroupId && (!res.groups || res.groups.length === 0)) {
          setSelectedGroupId('all');
        }
      }
    } catch (err) {
      console.error('Failed to load split dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, selectedGroupId]);

  const fetchSelectedGroupDetails = useCallback(async (gId) => {
    if (!gId || gId === 'all') {
      setGroupDetailsData(null);
      try {
        const expRes = await apiFetch('/api/split/expenses?groupId=all');
        if (expRes?.expenses) {
          setAllExpenses(expRes.expenses);
        }
      } catch (err) {
        console.error('Failed to fetch all split expenses:', err);
      }
      return;
    }

    try {
      const res = await apiFetch(`/api/split/groups/${gId}`);
      if (res) {
        setGroupDetailsData(res);
      }
    } catch (err) {
      console.error('Failed to load split group details:', err);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchSelectedGroupDetails(selectedGroupId);
    }
  }, [selectedGroupId, fetchSelectedGroupDetails]);

  const currentUserId = String(user?._id || user?.id || '');
  const { summary, groups, friends, recentActivities } = data;

  // Selected Group details & members
  const selectedGroup = useMemo(() => {
    if (!selectedGroupId || selectedGroupId === 'all') return null;
    return groupDetailsData?.group || groups.find(g => String(g.id || g._id) === String(selectedGroupId)) || null;
  }, [selectedGroupId, groupDetailsData, groups]);

  const currentGroupMembers = useMemo(() => {
    if (!selectedGroup) return [];
    return selectedGroup.members || [];
  }, [selectedGroup]);

  // Balance Metrics computation
  const { owedToYou, youOwe, netBalance } = useMemo(() => {
    if (selectedGroupId && selectedGroupId !== 'all' && selectedGroup) {
      const members = selectedGroup.members || [];
      let positive = 0;
      let negative = 0;

      members.forEach(m => {
        const mId = String(m.userId || m.id || m._id);
        if (mId !== currentUserId) {
          const bal = Number(m.netWithCurrentUser || 0);
          if (bal > 0) positive += bal;
          else if (bal < 0) negative += Math.abs(bal);
        }
      });

      const net = positive - negative;
      return {
        owedToYou: Math.round(positive * 100) / 100,
        youOwe: Math.round(negative * 100) / 100,
        netBalance: Math.round(net * 100) / 100
      };
    }

    return {
      owedToYou: summary?.totalOwedToYou || 0,
      youOwe: summary?.totalYouOwe || 0,
      netBalance: summary?.netBalance || 0
    };
  }, [selectedGroupId, selectedGroup, currentUserId, summary]);

  // Selected group role of current user
  const userRole = useMemo(() => {
    if (!selectedGroup) return 'MEMBER';
    if (selectedGroup.createdBy && String(selectedGroup.createdBy) === currentUserId) {
      return 'CREATOR';
    }
    return 'MEMBER';
  }, [selectedGroup, currentUserId]);

  // Raw split expenses for selected view
  const rawExpenses = useMemo(() => {
    if (selectedGroupId && selectedGroupId !== 'all') {
      return groupDetailsData?.expenses || [];
    }
    return allExpenses.length > 0 ? allExpenses : [];
  }, [selectedGroupId, groupDetailsData, allExpenses]);

  // Filtered Expenses by Month, Search, and Member
  const filteredExpenses = useMemo(() => {
    let result = rawExpenses;

    // 1. Month filter (if !isAllTime)
    if (!isAllTime && currentMonth) {
      result = result.filter(e => {
        const dateStr = String(e.date || e.createdAt || '');
        return dateStr.slice(0, 7) === currentMonth;
      });
    }

    // 2. Member filter
    if (selectedMemberId && selectedMemberId !== 'all') {
      const targetId = String(selectedMemberId);
      result = result.filter(e => {
        const isPayer = String(e.payerId) === targetId;
        const isParticipant = (e.participants || []).some(p => String(p.userId || p.id) === targetId);
        return isPayer || isParticipant;
      });
    }

    // 3. Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(e => {
        const desc = (e.description || '').toLowerCase();
        const amt = String(e.amount || '');
        const cat = (e.category || '').toLowerCase();
        const payer = (e.payerName || '').toLowerCase();
        return desc.includes(query) || amt.includes(query) || cat.includes(query) || payer.includes(query);
      });
    }

    return result;
  }, [rawExpenses, isAllTime, currentMonth, selectedMemberId, searchQuery]);

  // Quick trigger to settle up with a specific friend or group debt
  const handleSettleWithFriend = (friend) => {
    const fId = String(friend.friendId || friend.userId || friend.id);
    const net = friend.netBalance || 0;

    if (net < 0) {
      setSettleTarget({
        payerId: currentUserId,
        payeeId: fId,
        amount: Math.abs(net)
      });
    } else {
      setSettleTarget({
        payerId: fId,
        payeeId: currentUserId,
        amount: Math.abs(net)
      });
    }
    setIsSettleUpOpen(true);
  };

  // Delete expense handler
  const handleDeleteExpense = async (expId) => {
    if (!window.confirm('Are you sure you want to delete this split expense?')) return;
    try {
      await apiFetch(`/api/split/expenses/${expId}`, { method: 'DELETE' });
      if (selectedGroupId && selectedGroupId !== 'all') {
        fetchSelectedGroupDetails(selectedGroupId);
      }
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to delete split expense.');
    }
  };

  // Group Settings Handlers
  const handleUpdateGroupName = async (newName) => {
    if (!selectedGroup) return;
    const gId = selectedGroup.id || selectedGroup._id;
    await apiFetch(`/api/split/groups/${gId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: newName })
    });
    await fetchSelectedGroupDetails(gId);
    fetchDashboardData();
  };

  const handleAddMemberToGroup = async (identifier) => {
    if (!selectedGroup) return;
    const gId = selectedGroup.id || selectedGroup._id;
    const body = {};
    if (identifier.includes('@') && identifier.includes('.')) {
      body.email = identifier;
    } else if (identifier.startsWith('@')) {
      body.username = identifier.replace(/^@/, '');
    } else {
      body.userId = identifier;
    }
    const res = await apiFetch(`/api/split/groups/${gId}/members`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    await fetchSelectedGroupDetails(gId);
    fetchDashboardData();
    return res;
  };

  const handleRemoveMemberFromGroup = async (targetUserId) => {
    if (!selectedGroup) return;
    const gId = selectedGroup.id || selectedGroup._id;
    await apiFetch(`/api/split/groups/${gId}/members/${targetUserId}`, {
      method: 'DELETE'
    });
    await fetchSelectedGroupDetails(gId);
    fetchDashboardData();
  };

  const handleDeleteGroup = async (groupId) => {
    await apiFetch(`/api/split/groups/${groupId}`, {
      method: 'DELETE'
    });
    const remaining = groups.filter(g => String(g.id || g._id) !== String(groupId));
    setSelectedGroupId(remaining.length > 0 ? (remaining[0].id || remaining[0]._id) : 'all');
    fetchDashboardData();
  };

  const groupDisplayName = selectedGroup ? selectedGroup.name : (selectedGroupId === 'all' ? 'All Splits Overview' : 'Split Hub');

  return (
    <div className="space-y-6 animate-fadeIn pb-24 lg:pb-8 max-w-5xl mx-auto">
      
      {/* ================= 1. SPLIT GROUP HEADER BAR ================= */}
      <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#131926] p-3.5 sm:p-4 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base shadow-sm shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(true)}
                className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-left transition-all hover:opacity-80 active:scale-98 cursor-pointer truncate"
                title="Switch split group"
              >
                <span className="truncate">{groupDisplayName}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider shrink-0">
                {selectedGroupId === 'all' ? 'ALL SPLITS' : userRole}
              </span>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-400 block truncate">
              {selectedGroup
                ? `${currentGroupMembers.length} member${currentGroupMembers.length !== 1 ? 's' : ''} in this group`
                : `${groups.length} group${groups.length !== 1 ? 's' : ''} • ${friends.length} friend${friends.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {/* Group Actions: + New Split & Settings Gear */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreateGroupOpen(true)}
            className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#222C42] text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-200/60 dark:border-slate-700/60 active:scale-95 shadow-sm"
            title="Create New Split Group"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden xs:inline sm:inline">New Split</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              if (!selectedGroup && groups.length > 0) {
                setSelectedGroupId(groups[0].id || groups[0]._id);
              }
              setIsGroupSettingsOpen(true);
            }}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1A2234] dark:hover:bg-[#222C42] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
            title="Split Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ================= 2. FLAGSHIP HERO BALANCE CARD ================= */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-700 dark:from-[#121828] dark:via-[#1A2238] dark:to-[#0F1422] dark:border dark:border-indigo-500/25 text-white p-6 sm:p-7 shadow-2xl shadow-indigo-600/30 dark:shadow-black/50 transition-all">
        {/* Decorative Ambient Glass Elements */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 dark:bg-indigo-500/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-indigo-900/30 dark:bg-cyan-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Top Bar inside Card: Pill and Action Buttons */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-extrabold text-indigo-100 dark:text-indigo-200 bg-white/15 dark:bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/20 dark:border-white/10 tracking-wider uppercase">
              {selectedGroup?.name || 'Shared Expenses Hub'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSettleTarget({ payerId: null, payeeId: null, amount: 0 });
                  setIsSettleUpOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs shadow-md shadow-emerald-900/20 flex items-center gap-1 active:scale-95 transition-all"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Settle Up</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setSelectedGroupForExpense(selectedGroupId && selectedGroupId !== 'all' ? selectedGroupId : null);
                  setIsAddExpenseOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white text-indigo-700 hover:bg-white/90 dark:bg-white/15 dark:text-white font-extrabold text-xs shadow-md flex items-center gap-1 active:scale-95 transition-all border border-white/20"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>

          {/* Main Net Balance Hero Section */}
          <div className="space-y-1 pt-1">
            <span className="text-xs font-bold text-indigo-200 dark:text-indigo-300 uppercase tracking-wider block">
              Net Balance
            </span>
            <div className="flex items-baseline gap-2">
              <h1 className={`text-3xl sm:text-4xl font-black tracking-tight font-mono ${
                netBalance > 0
                  ? 'text-emerald-300 dark:text-emerald-400'
                  : netBalance < 0
                  ? 'text-rose-300 dark:text-rose-400'
                  : 'text-white'
              }`}>
                {(netBalance > 0 ? '+' : netBalance < 0 ? '-' : '') + formatINR(Math.abs(netBalance))}
              </h1>
            </div>
            <span className="text-[11px] text-indigo-100/75 dark:text-indigo-200/75 block">
              {netBalance > 0
                ? 'Overall in credit • Others owe you'
                : netBalance < 0
                ? 'Overall in debit • Outstanding debts to settle'
                : 'All clear • Perfectly balanced'}
            </span>
          </div>

          {/* Dual Symmetrical Metric Cards inside Hero Card */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 pt-2">
            
            {/* Box 1: You Are Owed */}
            <div
              onClick={() => {
                setSettleTarget({ payerId: null, payeeId: currentUserId, amount: owedToYou });
                setIsSettleUpOpen(true);
              }}
              className="group relative overflow-hidden rounded-2xl p-3 sm:p-4 bg-white/10 hover:bg-white/20 active:bg-white/25 dark:bg-white/5 dark:hover:bg-white/10 dark:active:bg-white/15 border border-white/20 dark:border-white/10 backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-[0.98] shadow-sm flex flex-col justify-between"
              role="button"
              tabIndex={0}
              title="You Are Owed - Click to Settle"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-400/20 dark:bg-emerald-500/20 border border-emerald-300/30 dark:border-emerald-400/30 flex items-center justify-center text-emerald-300 dark:text-emerald-400 shadow-inner">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 dark:bg-emerald-500/20 text-emerald-200 dark:text-emerald-300 border border-emerald-400/30 flex items-center gap-0.5 group-hover:bg-emerald-400/30 transition-colors">
                  Manage
                  <ChevronRight className="w-2.5 h-2.5 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <div>
                <span className="text-[11px] sm:text-xs font-semibold text-indigo-100/80 dark:text-indigo-200/80 block mb-0.5">
                  You Are Owed
                </span>
                <span className="text-base sm:text-xl font-black text-white tracking-tight block truncate font-mono">
                  {formatINR(owedToYou)}
                </span>
              </div>
            </div>

            {/* Box 2: You Owe */}
            <div
              onClick={() => {
                setSettleTarget({ payerId: currentUserId, payeeId: null, amount: youOwe });
                setIsSettleUpOpen(true);
              }}
              className="group relative overflow-hidden rounded-2xl p-3 sm:p-4 bg-white/10 hover:bg-white/20 active:bg-white/25 dark:bg-white/5 dark:hover:bg-white/10 dark:active:bg-white/15 border border-white/20 dark:border-white/10 backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-[0.98] shadow-sm flex flex-col justify-between"
              role="button"
              tabIndex={0}
              title="You Owe - Click to Settle"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-400/20 dark:bg-rose-500/20 border border-rose-300/30 dark:border-rose-400/30 flex items-center justify-center text-rose-300 dark:text-rose-400 shadow-inner">
                  <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-400/20 dark:bg-rose-500/20 text-rose-200 dark:text-rose-300 border border-rose-400/30 flex items-center gap-0.5 group-hover:bg-rose-400/30 transition-colors">
                  Manage
                  <ChevronRight className="w-2.5 h-2.5 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
              <div>
                <span className="text-[11px] sm:text-xs font-semibold text-indigo-100/80 dark:text-indigo-200/80 block mb-0.5">
                  You Owe
                </span>
                <span className="text-base sm:text-xl font-black text-white tracking-tight block truncate font-mono">
                  {formatINR(youOwe)}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ================= 3. NET STATUS ALERT BANNER ================= */}
      {netBalance > 0 ? (
        <div className="p-4 rounded-3xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 dark:border-emerald-800/60 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              In Credit Position
            </h4>
            <p className="text-xs text-emerald-700/90 dark:text-emerald-400 mt-0.5">
              You are owed <strong>{formatINR(owedToYou)}</strong> net in {groupDisplayName}. Members owe you money.
            </p>
          </div>
        </div>
      ) : netBalance < 0 ? (
        <div className="p-4 rounded-3xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/20 dark:border-rose-800/60 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase tracking-wider">
              Outstanding Debt
            </h4>
            <p className="text-xs text-rose-700/90 dark:text-rose-400 mt-0.5">
              You owe <strong>{formatINR(youOwe)}</strong> net in {groupDisplayName}. Settle up to clear balances.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-3xl bg-indigo-500/10 dark:bg-indigo-950/30 border border-indigo-500/20 dark:border-indigo-800/40 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
              All Settled Up
            </h4>
            <p className="text-xs text-indigo-700/90 dark:text-indigo-400 mt-0.5">
              All shared balances are completely settled in {groupDisplayName}.
            </p>
          </div>
        </div>
      )}

      {/* ================= 4. SCOPE & SUB-TAB NAVIGATION ================= */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Month vs All Time */}
        <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-[#131926] p-1 rounded-2xl border border-transparent dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsAllTime(false)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              !isAllTime
                ? 'bg-white dark:bg-[#1E2638] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
            <span>{getMonthName(currentMonth)}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsAllTime(true)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              isAllTime
                ? 'bg-white dark:bg-[#1E2638] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
            <span>All Time</span>
          </button>
        </div>

        {/* View Switcher: Expenses | Friends | Activity */}
        <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-[#131926] p-1 rounded-2xl border border-transparent dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSubTab('expenses')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'expenses'
                ? 'bg-white dark:bg-[#1E2638] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Expenses ({filteredExpenses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('friends')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'friends'
                ? 'bg-white dark:bg-[#1E2638] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Friends ({friends.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('activity')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'activity'
                ? 'bg-white dark:bg-[#1E2638] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Activity</span>
          </button>
        </div>
      </div>

      {/* ================= 5. TRANSACTIONS SECTION (EXPENSES TAB) ================= */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-4">
          
          {/* Header & Controls Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                Transactions
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                {filteredExpenses.length} {filteredExpenses.length === 1 ? 'entry' : 'entries'} for {isAllTime ? 'All Time' : getMonthName(currentMonth)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setSelectedGroupForExpense(selectedGroupId && selectedGroupId !== 'all' ? selectedGroupId : null);
                setIsAddExpenseOpen(true);
              }}
              className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-1.5 active:scale-95 transition-all self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Expense</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by description, amount, category, or payer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#131926] text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-xs"
            />
          </div>

          {/* Member Filter Pills */}
          {currentGroupMembers.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedMemberId('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedMemberId === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-[#1A2234] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#20293D]'
                }`}
              >
                All Members ({currentGroupMembers.length})
              </button>

              {currentGroupMembers.map(m => {
                const mId = String(m.userId || m.id || m._id);
                const isSelected = selectedMemberId === mId;
                const isSelf = mId === currentUserId;

                return (
                  <button
                    key={mId}
                    type="button"
                    onClick={() => setSelectedMemberId(mId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-[#1A2234] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#20293D]'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0"
                      style={{ backgroundColor: m.avatarColor || '#6366F1' }}
                    >
                      {m.name ? m.name[0].toUpperCase() : 'M'}
                    </div>
                    <span>{m.name} {isSelf ? '(You)' : ''}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Split Transactions List */}
          {filteredExpenses.length === 0 ? (
            <div className="fintech-card p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto shadow-sm">
                <Receipt className="w-7 h-7 stroke-[1.75]" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                No Transactions Found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                {searchQuery
                  ? 'No split transactions match your search filter.'
                  : `No expenses recorded for ${isAllTime ? 'all time' : getMonthName(currentMonth)}. Add one to get started!`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setSelectedGroupForExpense(selectedGroupId && selectedGroupId !== 'all' ? selectedGroupId : null);
                  setIsAddExpenseOpen(true);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-indigo-500/20 transition-all inline-flex items-center justify-center gap-1.5 mx-auto active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add First Split Expense</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredExpenses.map((e) => {
                const eId = e.id || e._id;
                const isPayer = String(e.payerId) === currentUserId;
                const myParticipant = (e.participants || []).find(p => String(p.userId || p.id) === currentUserId);
                const myShare = Number(myParticipant?.shareAmount) || 0;
                const totalAmt = Number(e.amount) || 0;
                const canModify = String(e.createdBy || e.payerId) === currentUserId;

                // User lent or borrowed share
                const amountLent = isPayer ? Math.max(0, totalAmt - myShare) : 0;
                const isUserInvolved = isPayer || Boolean(myParticipant);

                const CategoryIcon = CATEGORY_ICON_MAP[e.category] || MoreHorizontal;
                const categoryColor = CATEGORY_COLOR_MAP[e.category] || '#6366F1';

                return (
                  <div
                    key={eId}
                    className="p-4 rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Category Icon */}
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs shrink-0"
                        style={{
                          backgroundColor: `${categoryColor}18`,
                          color: categoryColor,
                          border: `1px solid ${categoryColor}30`
                        }}
                      >
                        <CategoryIcon className="w-5 h-5 stroke-[2]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                            {e.description}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold shrink-0">
                            {e.category || 'Others'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-400 truncate">
                          <span>{isPayer ? 'You paid' : `${e.payerName} paid`}</span>
                          <span>•</span>
                          <span>{formatDateOnly(e.date || e.createdAt)}</span>
                          <span>•</span>
                          <span className="font-mono font-medium">Total {formatINR(totalAmt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Balance Share Tag & Action Controls */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        {isPayer ? (
                          amountLent > 0 ? (
                            <div>
                              <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 block">
                                +{formatINR(amountLent)}
                              </span>
                              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block">
                                you lent
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 block">
                                {formatINR(totalAmt)}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                your expense
                              </span>
                            </div>
                          )
                        ) : myShare > 0 ? (
                          <div>
                            <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400 block">
                              -{formatINR(myShare)}
                            </span>
                            <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 block">
                              you borrowed
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs font-medium text-slate-400 block">
                              Not involved
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Edit / Delete (Creator / Payer Only) */}
                      {canModify && (
                        <div className="flex items-center gap-1 pl-1 border-l border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedGroupForExpense(e.groupId || selectedGroupId);
                              setEditingExpense(e);
                              setIsAddExpenseOpen(true);
                            }}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                            title="Edit expense"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(eId)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            title="Delete expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= 6. SUB-TAB 2: FRIENDS VIEW ================= */}
      {activeSubTab === 'friends' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              Friends & Direct Balances
            </h3>
            <button
              type="button"
              onClick={() => setIsAddFriendOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Friend</span>
            </button>
          </div>

          {friends.length === 0 ? (
            <div className="fintech-card p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto shadow-sm">
                <UserPlus className="w-7 h-7 stroke-[1.75]" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                No Friends Connected Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Add friends by registered email address or username to track pairwise balances and settle debts.
              </p>
              <button
                type="button"
                onClick={() => setIsAddFriendOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-indigo-500/20 transition-all inline-flex items-center justify-center gap-1.5 mx-auto active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Your First Friend</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {friends.map(f => {
                const fId = String(f.friendId || f.userId || f.id);
                const net = Number(f.netBalance) || 0;

                return (
                  <div
                    key={fId}
                    className="p-4 rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0"
                        style={{ backgroundColor: f.avatarColor || '#6366F1' }}
                      >
                        {f.friendName ? f.friendName[0].toUpperCase() : 'F'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white block truncate">
                          {f.friendName}
                        </span>
                        <span className="text-xs text-slate-400 font-mono block truncate">
                          @{f.friendUsername || 'friend'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className={`text-xs font-black font-mono block ${
                          net > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : net < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-400 dark:text-slate-400'
                        }`}>
                          {net > 0 ? `owes you ${formatINR(net)}` : net < 0 ? `you owe ${formatINR(Math.abs(net))}` : 'settled up'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {net !== 0 ? 'Outstanding balance' : 'All clear'}
                        </span>
                      </div>

                      {net !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSettleWithFriend(f)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all active:scale-95"
                        >
                          Settle
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= 7. SUB-TAB 3: ACTIVITY LOG ================= */}
      {activeSubTab === 'activity' && (
        <div className="space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Full Split History</span>
            </h3>

            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No activity recorded yet. Add an expense or settle up to start building history!
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((act, idx) => {
                  const isExpense = (act.type || '').includes('expense');
                  const isSettlement = (act.type || '').includes('settle');

                  return (
                    <div
                      key={act.id || idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3"
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isExpense
                          ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                          : isSettlement
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {isExpense ? <Receipt className="w-4 h-4" /> : isSettlement ? <Check className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {act.userName || 'Member'}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatDateTime(act.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {act.type === 'expense_added' && (
                            <>
                              added <strong className="text-slate-900 dark:text-white">"{act.details?.description}"</strong> for <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{formatINR(act.details?.amount)}</strong>
                            </>
                          )}
                          {act.type === 'settlement_recorded' && (
                            <>
                              recorded payment of <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatINR(act.details?.amount)}</strong> ({act.details?.payerName} → {act.details?.payeeName})
                            </>
                          )}
                          {act.type === 'group_created' && (
                            <>
                              created new split group <strong className="text-slate-900 dark:text-white">"{act.details?.groupName}"</strong>
                            </>
                          )}
                          {act.type === 'friend_added' && (
                            <>
                              connected with friend <strong className="text-slate-900 dark:text-white">@{act.details?.friendUsername}</strong>
                            </>
                          )}
                          {act.type === 'expense_deleted' && (
                            <>
                              removed expense <strong className="text-slate-900 dark:text-white">"{act.details?.description}"</strong> ({formatINR(act.details?.amount)})
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 8. SWITCH SPLIT GROUP MODAL ================= */}
      {isGroupModalOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-backdrop-fade">
          <div className="fixed inset-0" onClick={() => setIsGroupModalOpen(false)} />

          <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-modal-pop">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Split Groups
                  </h3>
                  <span className="text-xs text-slate-400 dark:text-slate-400">
                    {groups.length} group{groups.length !== 1 ? 's' : ''} available
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-3 overflow-y-auto">
              
              {/* Option: All Splits Overview */}
              <button
                type="button"
                onClick={() => {
                  setSelectedGroupId('all');
                  setIsGroupModalOpen(false);
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all ${
                  selectedGroupId === 'all'
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 border-2 border-indigo-500 dark:border-indigo-600 shadow-sm'
                    : 'bg-slate-50/70 dark:bg-[#1A2234] hover:bg-slate-100 dark:hover:bg-[#222C42] border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                    selectedGroupId === 'all'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'bg-white dark:bg-[#111726] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}>
                    <Scale className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold truncate ${
                        selectedGroupId === 'all' ? 'text-indigo-900 dark:text-white' : 'text-slate-900 dark:text-white'
                      }`}>
                        All Splits Overview
                      </span>
                      {selectedGroupId === 'all' && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-400 block truncate">
                      Aggregate across all groups & friends
                    </span>
                  </div>
                </div>

                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                  selectedGroupId === 'all'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {selectedGroupId === 'all' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>

              {/* Group List */}
              <div className="space-y-2">
                {groups.map((g) => {
                  const gId = g.id || g._id;
                  const isSelected = String(selectedGroupId) === String(gId);
                  const net = Number(g.netBalance) || 0;

                  return (
                    <button
                      key={gId}
                      type="button"
                      onClick={() => {
                        setSelectedGroupId(gId);
                        setIsGroupModalOpen(false);
                      }}
                      className={`w-full p-3.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 border-2 border-indigo-500 dark:border-indigo-600 shadow-sm'
                          : 'bg-slate-50/70 dark:bg-[#1A2234] hover:bg-slate-100 dark:hover:bg-[#222C42] border border-slate-200/60 dark:border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                            : 'bg-white dark:bg-[#111726] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold truncate ${
                              isSelected ? 'text-indigo-900 dark:text-white' : 'text-slate-900 dark:text-white'
                            }`}>
                              {g.name}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 shrink-0">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 dark:text-slate-400 block truncate">
                            {(g.members || []).length} member{(g.members || []).length !== 1 ? 's' : ''} • {net > 0 ? `+${formatINR(net)}` : net < 0 ? `-${formatINR(Math.abs(net))}` : 'Settled'}
                          </span>
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer / Create New Group Action */}
            <div className="p-4 bg-slate-50 dark:bg-[#0D121F] border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsGroupModalOpen(false);
                  setIsCreateGroupOpen(true);
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create New Split Group</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ================= 9. SPLIT GROUP SETTINGS MODAL ================= */}
      {selectedGroup && (
        <SplitGroupSettingsModal
          isOpen={isGroupSettingsOpen}
          onClose={() => setIsGroupSettingsOpen(false)}
          group={selectedGroup}
          currentUser={user}
          friends={friends}
          onUpdateGroupName={handleUpdateGroupName}
          onAddMember={handleAddMemberToGroup}
          onRemoveMember={handleRemoveMemberFromGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      )}

      {/* ================= 10. OTHER MODALS ================= */}

      {/* Add / Edit Split Expense Modal */}
      <AddSplitExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        onExpenseAdded={() => {
          if (selectedGroupId && selectedGroupId !== 'all') {
            fetchSelectedGroupDetails(selectedGroupId);
          }
          fetchDashboardData();
        }}
        onExpenseUpdated={() => {
          if (selectedGroupId && selectedGroupId !== 'all') {
            fetchSelectedGroupDetails(selectedGroupId);
          }
          fetchDashboardData();
        }}
        groups={groups}
        friends={friends}
        initialGroupId={selectedGroupForExpense}
        editingExpense={editingExpense}
      />

      {/* Create Split Group Modal */}
      <CreateSplitGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={(newGroup) => {
          fetchDashboardData();
          if (newGroup) {
            setSelectedGroupId(newGroup.id || newGroup._id);
          }
        }}
        friends={friends}
      />

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
        onFriendAdded={() => {
          fetchDashboardData();
        }}
        existingFriends={friends}
      />

      {/* Settle Up Modal */}
      <SettleUpModal
        isOpen={isSettleUpOpen}
        onClose={() => setIsSettleUpOpen(false)}
        onSettled={() => {
          if (selectedGroupId && selectedGroupId !== 'all') {
            fetchSelectedGroupDetails(selectedGroupId);
          }
          fetchDashboardData();
        }}
        friends={friends}
        groups={groups}
        initialPayerId={settleTarget.payerId}
        initialPayeeId={settleTarget.payeeId}
        suggestedAmount={settleTarget.amount}
      />

    </div>
  );
}
