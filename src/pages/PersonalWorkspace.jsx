import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  Utensils,
  ShoppingBag,
  Film,
  HeartPulse,
  Car,
  MoreHorizontal,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import HeroBalanceCard from '../components/HeroBalanceCard';
import MoneySummaryCards from '../components/MoneySummaryCards';
import BudgetWarningBanner from '../components/BudgetWarningBanner';
import {
  formatINR,
  formatDateTime,
  formatDayHeader,
  CATEGORY_CONFIG
} from '../utils/formatters';

const ICON_MAP = {
  Food: Utensils,
  Shopping: ShoppingBag,
  Entertainment: Film,
  Medical: HeartPulse,
  Transport: Car,
  Others: MoreHorizontal
};

export default function PersonalWorkspace({
  user,
  month,
  data,
  loading,
  onOpenMonthSelector,
  onOpenBudgetModal,
  onOpenAddExpense,
  onOpenEditExpense,
  onDeleteExpense
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const budget = data?.budget || 0;
  const totalSpent = data?.totalSpent || 0;
  const remainingBalance = data?.remainingBalance || 0;
  const isExceeding80 = data?.isExceeding80 || false;
  const isExceeding100 = data?.isExceeding100 || false;
  const expenses = data?.expenses || [];

  // Filter expenses by search query & category
  const filteredExpenses = expenses.filter((e) => {
    const matchCat = selectedCategory === 'All' || e.category === selectedCategory;
    const matchQuery =
      !searchQuery ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(e.amount).includes(searchQuery);
    return matchCat && matchQuery;
  });

  // Group filtered expenses by Date (day-wise)
  const groupedExpenses = filteredExpenses.reduce((groups, exp) => {
    const dateKey = exp.date ? exp.date.split('T')[0] : 'Unknown';
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(exp);
    return groups;
  }, {});

  return (
    <div className="space-y-6 animate-fadeIn pb-24 lg:pb-8">
      
      {/* Top Grid: Hero Card & Money Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (Span 7 on Desktop) */}
        <div className="lg:col-span-7 space-y-5">
          <HeroBalanceCard
            user={user}
            month={month}
            balance={remainingBalance}
            budget={budget}
            totalSpent={totalSpent}
            isExceeding80={isExceeding80}
            isExceeding100={isExceeding100}
            onOpenMonthSelector={onOpenMonthSelector}
            onOpenBudgetModal={onOpenBudgetModal}
          />

          <MoneySummaryCards
            budget={budget}
            totalSpent={totalSpent}
            onEditBudget={onOpenBudgetModal}
            canEditBudget={true}
          />

          <BudgetWarningBanner
            budget={budget}
            totalSpent={totalSpent}
            remainingBalance={remainingBalance}
            isExceeding80={isExceeding80}
            isExceeding100={isExceeding100}
            onOpenBudgetModal={onOpenBudgetModal}
          />
        </div>

        {/* Right Column / Transactions List (Span 5 on Desktop) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Section Header */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Transactions</h3>
              <span className="text-xs text-slate-400">{filteredExpenses.length} entries this month</span>
            </div>
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Entry</span>
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search description or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {['All', ...Object.keys(CATEGORY_CONFIG)].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions Grouped List */}
          {Object.keys(groupedExpenses).length === 0 ? (
            <div className="fintech-card p-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-2">
                <TrendingDown className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-700 block">No Transactions Found</span>
              <span className="text-xs text-slate-400 max-w-xs block mt-0.5">
                {searchQuery || selectedCategory !== 'All'
                  ? 'No matching expenses for your search filters.'
                  : 'Click "+ Add Entry" to record your daily spending.'}
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedExpenses).map(([dateKey, items]) => {
                const dayTotal = items.reduce((sum, i) => sum + Number(i.amount || 0), 0);

                return (
                  <div key={dateKey} className="space-y-2">
                    
                    {/* Day Group Header */}
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1 pt-1">
                      <span>{formatDayHeader(dateKey)}</span>
                      <span className="text-slate-600 font-semibold">{formatINR(dayTotal)}</span>
                    </div>

                    {/* Day Items */}
                    <div className="space-y-2">
                      {items.map((item) => {
                        const conf = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Others;
                        const Icon = ICON_MAP[item.category] || MoreHorizontal;

                        return (
                          <div
                            key={item.id || item._id}
                            className="fintech-card fintech-card-hover p-3.5 sm:p-4 flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                                style={{ backgroundColor: `${conf.color}15`, color: conf.color }}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-sm font-bold text-slate-900 block truncate leading-tight">
                                  {item.description}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                                    style={{ backgroundColor: `${conf.color}15`, color: conf.color }}
                                  >
                                    {conf.name}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {formatDateTime(item.date).split(',')[1]}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Amount & Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm sm:text-base font-extrabold text-rose-600 block">
                                - {formatINR(item.amount)}
                              </span>

                              <div className="hidden group-hover:flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => onOpenEditExpense(item)}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  aria-label="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteExpense(item.id || item._id)}
                                  className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  aria-label="Delete"
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
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
