import React, { useState, useMemo } from 'react';
import HeroBalanceCard from '../components/HeroBalanceCard';
import MoneySummaryCards from '../components/MoneySummaryCards';
import BudgetWarningBanner from '../components/BudgetWarningBanner';
import {
  Users,
  Plus,
  TrendingUp,
  UserPlus,
  Settings,
  Shield,
  Tag,
  Edit2,
  Trash2,
  Receipt,
  ChevronDown,
  Layers
} from 'lucide-react';
import {
  formatINR,
  formatDateTime,
  CATEGORY_CONFIG,
  groupExpensesByDay
} from '../utils/formatters';

export default function FamilyWorkspace({
  user,
  month,
  groups = [],
  selectedGroupId,
  onSelectGroup,
  groupData,
  onOpenCreateGroup,
  onOpenRenameGroup,
  onOpenInviteModal,
  onOpenMemberManagement,
  onOpenAddIncome,
  onOpenManageIncome,
  onOpenAddExpense,
  onOpenEditExpense,
  onDeleteExpense,
  onOpenMonthSelector
}) {
  const currentGroup = groups.find((g) => (g.id || g._id) === selectedGroupId);
  const userRole = currentGroup?.currentUserRole || groupData?.currentUserRole || 'member';
  const canManage = userRole === 'admin' || userRole === 'moderator';

  const totalIncome = Number(groupData?.totalIncome) || 0;
  const totalSpent = Number(groupData?.totalSpent) || 0;
  const remainingBalance = Number(groupData?.remainingBalance) || 0;
  const percentSpent = Number(groupData?.percentSpent) || 0;
  const isExceeding80 = Boolean(groupData?.isExceeding80);
  const isExceeding100 = Boolean(groupData?.isExceeding100);
  const expenses = useMemo(() => groupData?.expenses || [], [groupData]);
  const incomes = useMemo(() => groupData?.incomes || [], [groupData]);
  const members = useMemo(() => currentGroup?.members || [], [currentGroup]);

  const groupedDays = useMemo(() => {
    return groupExpensesByDay(expenses);
  }, [expenses]);

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
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Group</span>
          </button>
          <button
            type="button"
            onClick={onOpenInviteModal}
            className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>
          <button
            type="button"
            onClick={onOpenMemberManagement}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Members</span>
          </button>
        </div>
      </div>

      {/* Flagship Hero Balance Card */}
      <HeroBalanceCard
        user={{ name: currentGroup?.name || 'Family Hub' }}
        month={month}
        totalIncome={totalIncome}
        totalSpent={totalSpent}
        remainingBalance={remainingBalance}
        percentSpent={percentSpent}
        onOpenMonthSelector={onOpenMonthSelector}
        onOpenAddIncome={onOpenAddIncome}
        isExceeding80={isExceeding80}
        isExceeding100={isExceeding100}
      />

      {/* "Your Money" Dual Metric Cards (Group Income & Group Expenses) */}
      <MoneySummaryCards
        totalIncome={totalIncome}
        totalSpent={totalSpent}
        incomeCount={incomes.length}
        onOpenAddIncome={onOpenAddIncome}
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

      {/* Shared Household Transaction Feed */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Group Expenses
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Shared household spending for {month}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddIncome}
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs flex items-center gap-1.5 border border-emerald-200/70 transition-all active:scale-95"
            >
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
              <span>+ Add Income</span>
            </button>
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Expense</span>
            </button>
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
                            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                            style={{
                              backgroundColor: `${conf.color}15`,
                              color: conf.color
                            }}
                          >
                            <Tag className="w-5 h-5" />
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
