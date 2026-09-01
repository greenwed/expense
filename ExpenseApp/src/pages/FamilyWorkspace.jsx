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
  onOpenManageIncome,
  onOpenManageExpenses,
  onOpenAddExpense,
  onOpenEditExpense,
  onDeleteExpense
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
  const members = useMemo(() => currentGroup?.members || [], [currentGroup]);

  const groupedDays = useMemo(() => {
    return groupExpensesByDay(expenses);
  }, [expenses]);

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
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={selectedGroupId || ''}
                onChange={(e) => onSelectGroup(e.target.value)}
                className="text-base font-extrabold text-slate-900 dark:text-white bg-transparent cursor-pointer focus:outline-none dark:bg-[#131926]"
              >
                {groups.map((g) => (
                  <option key={g.id || g._id} value={g.id || g._id} className="dark:bg-[#131926] dark:text-white">
                    {g.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {userRole}
              </span>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-400">
              {members.length} member{members.length !== 1 ? 's' : ''} in this group
            </span>
          </div>
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
            onClick={onOpenMemberManagement}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#222C42] text-slate-700 dark:text-slate-200 font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors border border-slate-200/60 dark:border-slate-700/60"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Members</span>
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
      />

      {/* "Your Money" Dual Metric Cards (Group Month Income & Group Month Expenses) */}
      <MoneySummaryCards
        totalIncome={monthlyIncome}
        totalSpent={monthlySpent}
        incomeCount={incomes.length}
        expenseCount={expenses.length}
        onOpenManageIncome={onOpenManageIncome}
        onOpenManageExpenses={onOpenManageExpenses}
        canManage={true}
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

      {/* Shared Household Transaction Feed */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Group Expenses
            </h3>
            <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">
              {expenses.length} {isAllTime ? 'total entries across all time' : `entries for ${getMonthName(month)}`}
            </span>
          </div>
        </div>

        {groupedDays.length === 0 ? (
          <div className="fintech-card p-8 sm:p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-slate-50 dark:bg-[#1A2234] border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-500 mx-auto shadow-inner">
              <Receipt className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">No Expenses Recorded</h4>
            <p className="text-xs text-slate-400 dark:text-slate-400 max-w-sm mx-auto">
              Any member can add shared household expenses for groceries, utilities, and dining.
            </p>
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
                    const conf = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Others;
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
                            <Tag className="w-4 h-4" />
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
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
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

    </div>
  );
}
