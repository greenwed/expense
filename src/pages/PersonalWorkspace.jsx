import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MonthSelector from '../components/MonthSelector';
import BudgetWarningBanner from '../components/BudgetWarningBanner';
import CategoryPieChart from '../components/CategoryPieChart';
import ExpenseModal from '../components/ExpenseModal';
import BudgetModal from '../components/BudgetModal';
import { formatINR, formatDateTime, CATEGORY_CONFIG, getCurrentMonthStr } from '../utils/formatters';
import {
  Plus,
  Wallet,
  ArrowUpRight,
  Sparkles,
  Edit2,
  Trash2,
  Search,
  Filter,
  Receipt,
  Utensils,
  ShoppingBag,
  Film,
  HeartPulse,
  Car,
  MoreHorizontal
} from 'lucide-react';

const ICON_MAP = {
  Utensils,
  ShoppingBag,
  Film,
  HeartPulse,
  Car,
  MoreHorizontal
};

export default function PersonalWorkspace() {
  const { apiFetch } = useAuth();
  const [month, setMonth] = useState(getCurrentMonthStr());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/personal/dashboard?month=${month}`);
      setData(res);
    } catch (err) {
      console.error('Failed to load personal dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [month]);

  // Handle Add / Edit Expense
  const handleSaveExpense = async (expensePayload) => {
    if (editingExpense) {
      const expId = editingExpense._id || editingExpense.id;
      await apiFetch(`/api/personal/expenses/${expId}`, {
        method: 'PUT',
        body: expensePayload
      });
    } else {
      await apiFetch('/api/personal/expenses', {
        method: 'POST',
        body: expensePayload
      });
    }
    await fetchDashboard();
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (expenseId, description) => {
    if (!window.confirm(`Delete entry "${description}"?`)) return;
    try {
      await apiFetch(`/api/personal/expenses/${expenseId}`, {
        method: 'DELETE'
      });
      await fetchDashboard();
    } catch (err) {
      alert('Failed to delete expense: ' + err.message);
    }
  };

  // Handle Update Budget
  const handleSaveBudget = async (newAmount) => {
    await apiFetch('/api/personal/budget', {
      method: 'POST',
      body: { month, amount: newAmount }
    });
    await fetchDashboard();
  };

  // Filter expenses
  const filteredExpenses = (data?.expenses || []).filter((exp) => {
    const matchesSearch =
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === 'All' || exp.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const budget = data?.budget || 0;
  const totalSpent = data?.totalSpent || 0;
  const remainingBalance = data?.remainingBalance || 0;
  const percentSpent = data?.percentSpent || 0;
  const isExceeding80 = data?.isExceeding80 || false;
  const isExceeding100 = data?.isExceeding100 || false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      
      {/* Top Header & Month Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Personal Workspace</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track daily expenses, set limits, and analyze your category breakdown.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <MonthSelector selectedMonth={month} onMonthChange={setMonth} />
          
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Warning Alert Banner (if spent >= 80% or > 100%) */}
      <BudgetWarningBanner
        budget={budget}
        totalSpent={totalSpent}
        isExceeding80={isExceeding80}
        isExceeding100={isExceeding100}
        percentSpent={percentSpent}
      />

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Total Budget Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Budget
            </span>
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
            >
              <Edit2 className="w-3 h-3" />
              <span>{budget > 0 ? 'Edit' : 'Set Budget'}</span>
            </button>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
            {formatINR(budget)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {budget === 0 ? 'No budget set for this month' : 'Theoretical monthly cap'}
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Spent
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2 tracking-tight">
            {formatINR(totalSpent)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            {budget > 0 ? (
              <span><strong>{percentSpent}%</strong> of monthly budget</span>
            ) : (
              <span>{data?.expenses?.length || 0} total entries</span>
            )}
          </div>
        </div>

        {/* Remaining Balance Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Remaining Balance
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
              remainingBalance < 0
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight ${
            remainingBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {formatINR(remainingBalance)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {remainingBalance < 0 ? (
              <span className="text-rose-400 font-semibold">Over budget by {formatINR(Math.abs(remainingBalance))}</span>
            ) : budget > 0 ? (
              <span>Available to spend</span>
            ) : (
              <span>Set a budget to calculate balance</span>
            )}
          </div>
        </div>

      </div>

      {/* Category Pie Chart Breakdown */}
      <CategoryPieChart
        categoryBreakdown={data?.categoryBreakdown || []}
        totalSpent={totalSpent}
      />

      {/* Expense Entries Table / List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        {/* Table Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <span>Monthly Expense Entries</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                {filteredExpenses.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              All entries for this month sorted by date. Click Edit or Delete to manage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Bar */}
            <div className="relative min-w-[180px]">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['All', 'Food', 'Shopping', 'Entertainment', 'Medical', 'Transport', 'Others'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg font-medium transition-all shrink-0 ${
                selectedCategoryFilter === cat
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Entries List */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Loading entries...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-medium">No expenses found matching your criteria</p>
            <p className="text-xs text-slate-600 mt-1">Click "+ Add Expense" above to log a new expense.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredExpenses.map((expense) => {
              const expId = expense._id || expense.id;
              const config = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.Others;
              const IconComponent = ICON_MAP[config.icon] || MoreHorizontal;

              return (
                <div
                  key={expId}
                  className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/20 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${config.color}15`,
                        color: config.color,
                        borderColor: `${config.color}30`
                      }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white truncate">
                          {expense.description}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.2 rounded-md font-semibold shrink-0"
                          style={{
                            backgroundColor: `${config.color}20`,
                            color: config.color
                          }}
                        >
                          {expense.category}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {formatDateTime(expense.date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                        {formatINR(expense.amount)}
                      </div>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingExpense(expense);
                          setIsExpenseModalOpen(true);
                        }}
                        title="Edit entry"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteExpense(expId, expense.description)}
                        title="Delete entry"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        initialData={editingExpense}
        title={editingExpense ? 'Edit Personal Expense' : 'Add Personal Expense'}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSave={handleSaveBudget}
        currentBudget={budget}
        month={month}
        isFamily={false}
      />

    </div>
  );
}
