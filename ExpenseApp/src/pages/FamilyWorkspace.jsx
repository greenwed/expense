import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import HeroBalanceCard from '../components/HeroBalanceCard';
import BudgetWarningBanner from '../components/BudgetWarningBanner';
import FamilyGroupSettingsModal from '../components/FamilyGroupSettingsModal';
import {
  Users,
  Plus,
  UserPlus,
  Settings,
  Tag,
  Edit2,
  Trash2,
  Receipt,
  Calendar,
  Layers,
  User,
  ChevronDown,
  X,
  Check
} from 'lucide-react';
import {
  formatINR,
  formatDateTime,
  CATEGORY_CONFIG,
  groupExpensesByDay,
  getMonthName
} from '../utils/formatters';
import { useCategories } from '../context/CategoryContext';

export default function FamilyWorkspace({
  user,
  month,
  groups = [],
  selectedGroupId,
  onSelectGroup,
  groupData,
  isAllTime,
  onToggleAllTime,
  onOpenCreateGroup,
  onOpenRenameGroup,
  onOpenInviteModal,
  onOpenMemberManagement,
  onOpenManageIncome,
  onOpenManageExpenses,
  onOpenAddExpense,
  onOpenEditExpense,
  onDeleteExpense,
  onDeleteGroup,
  onAddMemberByEmail,
  onUpdateRole,
  onRemoveMember,
  onRegenerateToken,
  onUpdateGroupName
}) {
  const currentGroup = groups.find((g) => (g.id || g._id) === selectedGroupId);
  const userRole = currentGroup?.currentUserRole || groupData?.currentUserRole || 'member';
  const canManage = userRole === 'admin' || userRole === 'moderator';

  const totalBalance = Number(groupData?.totalBalance !== undefined ? groupData.totalBalance : groupData?.remainingBalance) || 0;
  const monthlyIncome = Number(groupData?.monthlyIncome !== undefined ? groupData.monthlyIncome : groupData?.totalIncome) || 0;
  const monthlySpent = Number(groupData?.monthlySpent !== undefined ? groupData.monthlySpent : groupData?.totalSpent) || 0;
  const percentSpent = Number(groupData?.percentSpent) || 0;
  const isExceeding80 = Boolean(groupData?.isExceeding80);
  const isExceeding100 = Boolean(groupData?.isExceeding100);
  const expenses = useMemo(() => groupData?.expenses || [], [groupData]);
  const incomes = useMemo(() => groupData?.incomes || [], [groupData]);

  const { getCategoryList, getCategoryMeta, fetchGroupCategories } = useCategories();

  // Selected member filter state (only for Family tab)
  const [selectedMemberId, setSelectedMemberId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupCategories(selectedGroupId);
    }
  }, [selectedGroupId, fetchGroupCategories]);

  const groupCategoryList = useMemo(() => {
    return getCategoryList(selectedGroupId);
  }, [getCategoryList, selectedGroupId]);
  
  // Custom themed popups state (replaces native OS dialog on Android/Web)
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMemberModalOpen(false);
        setIsGroupModalOpen(false);
        setIsGroupSettingsOpen(false);
      }
    };
    if (isMemberModalOpen || isGroupModalOpen || isGroupSettingsOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isMemberModalOpen, isGroupModalOpen, isGroupSettingsOpen]);

  // Reset member and category filter when switching groups
  useEffect(() => {
    setSelectedMemberId('all');
    setSelectedCategory('all');
  }, [selectedGroupId]);

  // Aggregate all members from group definition and historical expenses
  const members = useMemo(() => {
    const list = [...(currentGroup?.members || [])];
    expenses.forEach((exp) => {
      const expUserId = String(exp.userId || exp.user_id || '');
      if (expUserId && !list.some((m) => String(m.userId || m.id || m._id) === expUserId)) {
        list.push({
          userId: expUserId,
          name: exp.userName || exp.user_name || 'Member',
          username: exp.userUsername || exp.user_username || '',
          role: 'member'
        });
      }
    });
    return list;
  }, [currentGroup, expenses]);

  const selectedMember = useMemo(() => {
    if (!selectedMemberId || selectedMemberId === 'all') return null;
    return members.find((m) => String(m.userId || m.id || m._id) === String(selectedMemberId));
  }, [members, selectedMemberId]);

  // Filter expenses based on selected group member and category
  const filteredExpenses = useMemo(() => {
    let result = expenses;
    if (selectedMemberId && selectedMemberId !== 'all') {
      const targetId = String(selectedMemberId);
      const targetUsername = selectedMember?.username ? String(selectedMember.username).toLowerCase() : '';
      const targetName = selectedMember?.name ? String(selectedMember.name).toLowerCase() : '';

      result = result.filter((item) => {
        const itemUserId = String(item.userId || item.user_id || '');
        if (itemUserId && itemUserId === targetId) return true;

        const itemUsername = String(item.userUsername || item.user_username || '').toLowerCase();
        if (targetUsername && itemUsername === targetUsername) return true;

        const itemUserName = String(item.userName || item.user_name || '').toLowerCase();
        if (targetName && itemUserName === targetName) return true;

        return false;
      });
    }

    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter(item => item.category === selectedCategory);
    }

    return result;
  }, [expenses, selectedMemberId, selectedMember, selectedCategory]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const groupedDays = useMemo(() => {
    return groupExpensesByDay(filteredExpenses);
  }, [filteredExpenses]);

  if (groups.length === 0) {
    return (
      <div className="fintech-card p-8 sm:p-12 text-center max-w-lg mx-auto my-8 space-y-4 animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto shadow-sm">
          <Users className="w-8 h-8 stroke-[1.75]" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
          No Family Groups Yet
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          Create a collaborative group to manage shared household income, divide expenses, and track your family budget together.
        </p>
        <button
          type="button"
          onClick={onOpenCreateGroup}
          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-indigo-500 dark:to-cyan-500 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 mx-auto active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Your First Group</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-24 lg:pb-8">
      
      {/* Group Selector & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#131926] p-4 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm transition-colors">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(true)}
                  className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-left transition-all hover:opacity-80 active:scale-98 cursor-pointer"
                  title="View or switch family groups"
                >
                  <span>{currentGroup?.name || 'Family Hub'}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {userRole}
                </span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-400">
                {members.length} member{members.length !== 1 ? 's' : ''} in this group
              </span>
            </div>
          </div>

          {/* Group Settings Button (Top Right where red circle was marked!) */}
          <button
            type="button"
            onClick={() => setIsGroupSettingsOpen(true)}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1A2234] dark:hover:bg-[#222C42] text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 border border-slate-200/60 dark:border-slate-700/60 shadow-sm shrink-0 sm:hidden"
            title="Group Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Group Actions */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={onOpenCreateGroup}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#222C42] text-slate-700 dark:text-slate-200 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors border border-slate-200/60 dark:border-slate-700/60"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Group</span>
          </button>
          <button
            type="button"
            onClick={onOpenInviteModal}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors border border-indigo-100 dark:border-indigo-800/60"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>
          <button
            type="button"
            onClick={() => setIsGroupSettingsOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#222C42] text-slate-700 dark:text-slate-200 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors border border-slate-200/60 dark:border-slate-700/60"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
          {/* Desktop Settings Button */}
          <button
            type="button"
            onClick={() => setIsGroupSettingsOpen(true)}
            className="hidden sm:flex w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#222C42] text-slate-700 dark:text-slate-200 items-center justify-center transition-colors border border-slate-200/60 dark:border-slate-700/60 shrink-0"
            title="Group Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Flagship Hero Balance Card */}
      <HeroBalanceCard
        user={{ name: currentGroup?.name || 'Family Hub' }}
        totalBalance={totalBalance}
        monthlyIncome={monthlyIncome}
        monthlySpent={monthlySpent}
        percentSpent={percentSpent}
        isExceeding80={isExceeding80}
        isExceeding100={isExceeding100}
        onOpenManageIncome={onOpenManageIncome}
        onOpenManageExpenses={onOpenManageExpenses}
      />

      {/* Warning / Health Pill */}
      {monthlyIncome > 0 && (
        <BudgetWarningBanner
          isExceeding80={isExceeding80}
          isExceeding100={isExceeding100}
          percentSpent={percentSpent}
          totalSpent={monthlySpent}
          totalIncome={monthlyIncome}
          remainingBalance={monthlyIncome - monthlySpent}
        />
      )}

      {/* Scope Switcher: Month vs All Time */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-[#131926] p-1 rounded-2xl border border-transparent dark:border-slate-800">
          <button
            type="button"
            onClick={() => onToggleAllTime && onToggleAllTime(false)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              !isAllTime
                ? 'bg-white dark:bg-[#1E2638] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
            <span>{getMonthName(month)}</span>
          </button>
          
          <button
            type="button"
            onClick={() => onToggleAllTime && onToggleAllTime(true)}
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
      </div>

      {/* Shared Household Transaction Feed with Member Filter Option */}
      <div className="space-y-4 pt-1">
        
        {/* Header & Group Member Filter Control (Right Aligned in Header) */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Group Expenses
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-400 font-medium block truncate">
              {filteredExpenses.length}{' '}
              {selectedMemberId !== 'all'
                ? `entries by ${selectedMember?.name || 'Member'}`
                : isAllTime
                ? 'total entries across all time'
                : `entries for ${getMonthName(month)}`}
            </span>
          </div>

          {/* Group Member Filter Button (Custom Themed Modal Trigger) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsMemberModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                selectedMemberId !== 'all'
                  ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700/80 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-500/20'
                  : 'bg-white dark:bg-[#131926] hover:bg-slate-50 dark:hover:bg-[#1A2234] border-slate-200/90 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 shadow-sm'
              }`}
              title="Filter expenses by group member"
            >
              <User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span className="truncate max-w-[130px] sm:max-w-none">
                {selectedMemberId === 'all'
                  ? `All Members (${members.length})`
                  : `${selectedMember?.name || 'Member'}${selectedMemberId === String(user?._id || user?.id) ? ' (You)' : ''}`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {selectedMemberId !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedMemberId('all')}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#1A2234] hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Reset to all members"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Group Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1E2638]'
            }`}
          >
            All
          </button>
          {groupCategoryList.map((catKey) => {
            const conf = getCategoryMeta(catKey, selectedGroupId);
            const isSelected = selectedCategory === catKey;
            return (
              <button
                type="button"
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'text-white shadow-sm'
                    : 'bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1E2638]'
                }`}
                style={{
                  backgroundColor: isSelected ? conf.color : undefined
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isSelected ? '#FFFFFF' : conf.color }}
                />
                <span>{conf.name}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Indicator Banner when a specific member is filtered */}
        {selectedMemberId !== 'all' && (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/50 text-xs animate-fadeIn">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
              <span className="text-indigo-800 dark:text-indigo-200 font-semibold truncate">
                Filtered by: <strong className="font-black">{selectedMember?.name || 'Member'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="font-extrabold text-indigo-900 dark:text-indigo-100">
                {formatINR(filteredTotal)}
              </span>
              <button
                type="button"
                onClick={() => setSelectedMemberId('all')}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 underline"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {groupedDays.length === 0 ? (
          <div className="fintech-card p-8 sm:p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-slate-50 dark:bg-[#1A2234] border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-500 mx-auto shadow-inner">
              <Receipt className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">
              {selectedMemberId !== 'all'
                ? `No Expenses by ${selectedMember?.name || 'This Member'}`
                : 'No Expenses Recorded'}
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-400 max-w-sm mx-auto">
              {selectedMemberId !== 'all'
                ? `No shared expenses found for ${selectedMember?.name || 'this member'} in ${isAllTime ? 'all time' : getMonthName(month)}.`
                : 'Any member can add shared household expenses for groceries, utilities, and dining.'}
            </p>
            {selectedMemberId !== 'all' ? (
              <div className="flex items-center justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedMemberId('all')}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#222C42] text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
                >
                  View All Member Expenses
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center pt-1">
                <button
                  type="button"
                  onClick={onOpenAddExpense}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-indigo-500 dark:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add Expense</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedDays.map(({ date, formattedDate, dayTotal, items }) => (
              <div key={date} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-400 px-1">
                  <span>{formattedDate}</span>
                  <span className="text-slate-600 dark:text-slate-300 font-extrabold">{formatINR(dayTotal)}</span>
                </div>

                <div className="fintech-card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  {items.map((item) => {
                    const conf = getCategoryMeta(item.category, selectedGroupId);
                    const Icon = conf.IconComponent || Tag;
                    return (
                      <div
                        key={item.id || item._id}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                            style={{
                              backgroundColor: `${conf.color}15`,
                              color: conf.color
                            }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-bold text-slate-900 dark:text-white block truncate">
                              {item.description}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-400">
                              <span
                                className="font-semibold px-2 py-0.5 rounded-md"
                                style={{
                                  backgroundColor: `${conf.color}10`,
                                  color: conf.color
                                }}
                              >
                                {conf.name}
                              </span>
                              <span>• by {item.userName || 'Member'}</span>
                              <span>• {formatDateTime(item.date).split(',')[1]}</span>
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                            -{formatINR(item.amount)}
                          </span>

                          {canManage && (
                            <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onOpenEditExpense(item)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteExpense(item.id || item._id)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                                title="Delete"
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= CUSTOM THEMED MEMBER SELECTION MODAL ================= */}
      {isMemberModalOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-backdrop-fade">
          {/* Click backdrop to close */}
          <div className="fixed inset-0" onClick={() => setIsMemberModalOpen(false)} />

          <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-modal-pop">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Filter by Member
                  </h3>
                  <span className="text-xs text-slate-400 dark:text-slate-400">
                    {members.length} member{members.length !== 1 ? 's' : ''} in {currentGroup?.name || 'group'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Options List */}
            <div className="p-5 space-y-2 overflow-y-auto">
              
              {/* Option 1: All Members */}
              <button
                type="button"
                onClick={() => {
                  setSelectedMemberId('all');
                  setIsMemberModalOpen(false);
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all ${
                  selectedMemberId === 'all'
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 border-2 border-indigo-500 dark:border-indigo-600 shadow-sm'
                    : 'bg-slate-50/70 dark:bg-[#1A2234] hover:bg-slate-100 dark:hover:bg-[#222C42] border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    selectedMemberId === 'all'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'bg-white dark:bg-[#111726] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-sm font-bold block ${
                      selectedMemberId === 'all' ? 'text-indigo-900 dark:text-white' : 'text-slate-900 dark:text-white'
                    }`}>
                      All Members ({members.length})
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400">
                      Show all group expenses combined
                    </span>
                  </div>
                </div>

                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                  selectedMemberId === 'all'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {selectedMemberId === 'all' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>

              {/* Individual Members */}
              {members.map((m) => {
                const mId = String(m.userId || m.id || m._id);
                const isSelected = selectedMemberId === mId;
                const isSelf = String(user?._id || user?.id) === mId;

                return (
                  <button
                    key={mId}
                    type="button"
                    onClick={() => {
                      setSelectedMemberId(mId);
                      setIsMemberModalOpen(false);
                    }}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 border-2 border-indigo-500 dark:border-indigo-600 shadow-sm'
                        : 'bg-slate-50/70 dark:bg-[#1A2234] hover:bg-slate-100 dark:hover:bg-[#222C42] border border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                          : 'bg-white dark:bg-[#111726] text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {m.name ? m.name[0].toUpperCase() : 'M'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold truncate ${
                            isSelected ? 'text-indigo-900 dark:text-white' : 'text-slate-900 dark:text-white'
                          }`}>
                            {m.name || 'Member'}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-mono block truncate">
                          @{m.username || 'member'} • {m.role || 'member'}
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
        </div>,
        document.body
      )}

      {/* ================= CUSTOM THEMED GROUP SWITCHER MODAL ================= */}
      {isGroupModalOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-backdrop-fade">
          {/* Click backdrop to close */}
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
                    Family Groups
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
              {/* Groups List */}
              <div className="space-y-2">
                {groups.map((g) => {
                  const gId = g.id || g._id;
                  const isSelected = (selectedGroupId || '') === gId;
                  return (
                    <button
                      key={gId}
                      type="button"
                      onClick={() => {
                        onSelectGroup(gId);
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
                            {(g.members || []).length} member{(g.members || []).length !== 1 ? 's' : ''}
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

              {/* Informative banner if only 1 group exists */}
              {groups.length === 1 && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-200 text-xs leading-relaxed">
                  You are currently viewing <strong className="font-bold text-indigo-700 dark:text-indigo-300">{currentGroup?.name}</strong>. Create another group below to switch between different family groups.
                </div>
              )}
            </div>

            {/* Modal Footer / Create New Group Action */}
            <div className="p-4 bg-slate-50 dark:bg-[#0D121F] border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsGroupModalOpen(false);
                  if (onOpenCreateGroup) onOpenCreateGroup();
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create New Family Group</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Family Group Settings Modal */}
      <FamilyGroupSettingsModal
        isOpen={isGroupSettingsOpen}
        onClose={() => setIsGroupSettingsOpen(false)}
        group={currentGroup}
        currentUser={user}
        onUpdateGroupName={onUpdateGroupName || onOpenRenameGroup}
        onAddMemberByEmail={onAddMemberByEmail}
        onUpdateRole={onUpdateRole}
        onRemoveMember={onRemoveMember}
        onRegenerateToken={onRegenerateToken}
        onDeleteGroup={onDeleteGroup}
      />

    </div>
  );
}
