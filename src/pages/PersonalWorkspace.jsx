import React, { useState, useMemo } from 'react';
import HeroBalanceCard from '../components/HeroBalanceCard';
import MoneySummaryCards from '../components/MoneySummaryCards';
import BudgetWarningBanner from '../components/BudgetWarningBanner';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Tag,
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

export default function PersonalWorkspace({
  user,
  month,
  data,
  loading,
  isAllTime,
  onToggleAllTime,
  onOpenManageIncome,
  onOpenAddExpense,
  onOpenEditExpense,
  onDeleteExpense
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const totalBalance = Number(data?.totalBalance !== undefined ? data.totalBalance : data?.remainingBalance) || 0;
  const monthlyIncome = Number(data?.monthlyIncome !== undefined ? data.monthlyIncome : data?.totalIncome) || 0;
  const monthlySpent = Number(data?.monthlySpent !== undefined ? data.monthlySpent : data?.totalSpent) || 0;
  const percentSpent = Number(data?.percentSpent) || 0;
  const isExceeding80 = Boolean(data?.isExceeding80);
  const isExceeding100 = Boolean(data?.isExceeding100);
  const expenses = useMemo(() => data?.expenses || [], [data]);
  const incomes = useMemo(() => data?.incomes || [], [data]);

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const matchSearch =
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.amount).includes(searchQuery);
      const matchCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [expenses, searchQuery, selectedCategory]);

  const groupedDays = useMemo(() => {
    return groupExpensesByDay(filteredExpenses);
  }, [filteredExpenses]);

  return (
    <div className="space-y-6 animate-fadeIn pb-24 lg:pb-8">
      
      {/* 1. Flagship Gradient Hero Balance Card (Shows Running Total Balance Regardless of Months) */}
      <HeroBalanceCard
        user={user}
        totalBalance={totalBalance}
        monthlyIncome={monthlyIncome}
        monthlySpent={monthlySpent}
        percentSpent={percentSpent}
        isExceeding80={isExceeding80}
        isExceeding100={isExceeding100}
      />

      {/* 2. "Your Money" Dual Metric Cards (Month Income & Month Expenses) */}
      <MoneySummaryCards
        totalIncome={monthlyIncome}
        totalSpent={monthlySpent}
        incomeCount={incomes.length}
        onOpenManageIncome={onOpenManageIncome}
        onOpenAddExpense={onOpenAddExpense}
        canManage={true}
      />

      {/* 3. Budget & Income Health Insight Banner (if user has set monthly income) */}
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

      {/* 4. Streamlined Time Scope Bar */}
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
      </div>

      {/* 5. Clean Transactions Feed */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Transactions
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {filteredExpenses.length} {isAllTime ? 'entries across all time' : `entries for ${getMonthName(month)}`}
            </span>
          </div>
        </div>

        {/* Search & Category Pills */}
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by description or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:border-indigo-500 shadow-sm transition-all"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            {Object.keys(CATEGORY_CONFIG).map((catKey) => {
              const conf = CATEGORY_CONFIG[catKey];
              const isSelected = selectedCategory === catKey;
              return (
                <button
                  type="button"
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
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
        </div>

        {/* Grouped Day Transactions Feed */}
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs font-bold">Loading transactions...</span>
          </div>
        ) : groupedDays.length === 0 ? (
          <div className="fintech-card p-8 sm:p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto shadow-inner">
              <Receipt className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h4 className="text-base font-bold text-slate-700">No Expenses Recorded</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'all'
                ? 'No expenses matched your search filters.'
                : `No expenses added for ${getMonthName(month)}. Tap "+ Add Expense" whenever you spend.`}
            </p>
            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                onClick={onOpenAddExpense}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 active:scale-95"
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
                
                {/* Day Header */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                  <span>{formattedDate}</span>
                  <span className="text-slate-600 font-extrabold">{formatINR(dayTotal)}</span>
                </div>

                {/* Day Cards */}
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
                              <span>• {formatDateTime(item.date).split(',')[1]}</span>
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm sm:text-base font-black text-slate-900">
                            -{formatINR(item.amount)}
                          </span>

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
