import React, { useState, useMemo } from 'react';
import HeroBalanceCard from '../components/HeroBalanceCard';
import MoneySummaryCards from '../components/MoneySummaryCards';
import BudgetWarningBanner from '../components/BudgetWarningBanner';
import {
  Users,
  Plus,
  UserPlus,
  Settings,
  Tag,
  Edit2,
  Trash2,
  Receipt,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import {
  formatINR,
  formatDateTime,
  CATEGORY_CONFIG,
  groupExpensesByDay,
  getMonthName
} from '../utils/formatters';

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
  onOpenAddIncome,
  onOpenManageIncome,
  onOpenAddExpense,
  onOpenEditExpense,
  onDeleteExpense,
  onCarryForward
}) {
  const [carryingForward, setCarryingForward] = useState(false);
  const currentGroup = groups.find((g) => (g.id || g._id) === selectedGroupId);
  const userRole = currentGroup?.currentUserRole || groupData?.currentUserRole || 'member';
  const canManage = userRole === 'admin' || userRole === 'moderator';

  const totalIncome = Number(groupData?.totalIncome) || 0;
  const totalSpent = Number(groupData?.totalSpent) || 0;
  const openingBalance = Number(groupData?.openingBalance) || 0;
  const remainingBalance = Number(groupData?.remainingBalance) || 0;
  const percentSpent = Number(groupData?.percentSpent) || 0;
  const isExceeding80 = Boolean(groupData?.isExceeding80);
  const isExceeding100 = Boolean(groupData?.isExceeding100);
  const isAutoCarriedForward = Boolean(groupData?.isAutoCarriedForward);
  const carriedFromMonth = groupData?.carriedFromMonth;
  const expenses = useMemo(() => groupData?.expenses || [], [groupData]);
  const incomes = useMemo(() => groupData?.incomes || [], [groupData]);
  const members = useMemo(() => currentGroup?.members || [], [currentGroup]);

  const groupedDays = useMemo(() => {
    return groupExpensesByDay(expenses);
  }, [expenses]);

  const handleTriggerCarryForward = async () => {
    if (!onCarryForward) return;
    try {
      setCarryingForward(true);
      await onCarryForward();
    } finally {
      setCarryingForward(false);
    }
  };

  if (groups.length === 0) {
    return (
      <div className="fintech-card p-8 sm:p-12 text-center max-w-lg mx-auto my-8 space-y-4 animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-sm">
          <Users className="w-8 h-8 stroke-[1.75]" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900">
          No Family Groups Yet
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Create a collaborative group to manage shared household income, divide expenses, and track your family budget together.
        </p>
        <button
          type="button"
          onClick={onOpenCreateGroup}
          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 mx-auto"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={selectedGroupId || ''}
                onChange={(e) => onSelectGroup(e.target.value)}
                className="text-base font-extrabold text-slate-900 bg-transparent cursor-pointer focus:outline-none"
              >
                {groups.map((g) => (
                  <option key={g.id || g._id} value={g.id || g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                {userRole}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {members.length} member{members.length !== 1 ? 's' : ''} in this group
            </span>
          </div>
        </div>

        {/* Group Actions */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={onOpenCreateGroup}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Group</span>
          </button>
          <button
            type="button"
            onClick={onOpenInviteModal}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>
          <button
            type="button"
            onClick={onOpenMemberManagement}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Members</span>
          </button>
        </div>
      </div>

      {/* Flagship Hero Balance Card */}
      <HeroBalanceCard
        user={{ name: currentGroup?.name || 'Family Hub' }}
        totalIncome={totalIncome}
        totalSpent={totalSpent}
        openingBalance={openingBalance}
        remainingBalance={remainingBalance}
        percentSpent={percentSpent}
        isExceeding80={isExceeding80}
        isExceeding100={isExceeding100}
      />

      {/* "Your Money" Dual Metric Cards (Group Income & Group Expenses) */}
      <MoneySummaryCards
        totalIncome={totalIncome}
        totalSpent={totalSpent}
        incomeCount={incomes.length}
        onOpenManageIncome={onOpenManageIncome}
        canManage={true}
      />

      {/* Warning / Health Pill */}
      <BudgetWarningBanner
        isExceeding80={isExceeding80}
        isExceeding100={isExceeding100}
        percentSpent={percentSpent}
        totalSpent={totalSpent}
        totalIncome={totalIncome}
        remainingBalance={remainingBalance}
        onOpenAddIncome={onOpenAddIncome}
      />

      {/* Scope Switcher: Month vs All Time */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => onToggleAllTime && onToggleAllTime(false)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              !isAllTime
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{getMonthName(month)}</span>
          </button>
          
          <button
            type="button"
            onClick={() => onToggleAllTime && onToggleAllTime(true)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
              isAllTime
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>All Time</span>
          </button>
        </div>

        {/* Manual Carry Forward Action */}
        {!isAllTime && onCarryForward && canManage && (
          <button
            type="button"
            onClick={handleTriggerCarryForward}
            disabled={carryingForward}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
            title="Carry forward group expenses from previous month"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${carryingForward ? 'animate-spin' : ''}`} />
            <span>Carry Forward</span>
          </button>
        )}
      </div>

      {/* Auto Carry Forward Banner */}
      {isAutoCarriedForward && (
        <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 text-indigo-900 flex items-center gap-2.5 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold">Group Expenses Carried Forward: </span>
            <span className="text-indigo-700 font-medium">
              Automatically copied {expenses.length} shared expenses from {getMonthName(carriedFromMonth)}.
            </span>
          </div>
        </div>
      )}

      {/* Shared Household Transaction Feed */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Group Expenses
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {expenses.length} {isAllTime ? 'total entries across all time' : `entries for ${getMonthName(month)}`}
            </span>
          </div>
        </div>

        {groupedDays.length === 0 ? (
          <div className="fintech-card p-8 sm:p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto shadow-inner">
              <Receipt className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h4 className="text-base font-bold text-slate-700">No Expenses Recorded</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Any member can add shared household expenses for groceries, utilities, and dining.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={onOpenAddExpense}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Expense</span>
              </button>
              {!isAllTime && onCarryForward && canManage && (
                <button
                  type="button"
                  onClick={handleTriggerCarryForward}
                  disabled={carryingForward}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${carryingForward ? 'animate-spin' : ''}`} />
                  <span>Carry Forward</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedDays.map(({ date, formattedDate, dayTotal, items }) => (
              <div key={date} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                  <span>{formattedDate}</span>
                  <span className="text-slate-600 font-extrabold">{formatINR(dayTotal)}</span>
                </div>

                <div className="fintech-card divide-y divide-slate-100 overflow-hidden">
                  {items.map((item) => {
                    const conf = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Others;
                    return (
                      <div
                        key={item.id || item._id}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors group"
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
                            <span className="text-sm font-bold text-slate-900 block truncate">
                              {item.description}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
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
                          <span className="text-sm sm:text-base font-black text-slate-900">
                            -{formatINR(item.amount)}
                          </span>

                          {canManage && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onOpenEditExpense(item)}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteExpense(item.id || item._id)}
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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

    </div>
  );
}
