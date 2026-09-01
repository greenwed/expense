import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  Award,
  PiggyBank,
  ArrowDownRight,
  Filter,
  RefreshCw,
  Users,
  User
} from 'lucide-react';
import CategoryPieChart from '../components/CategoryPieChart';
import { useAuth } from '../context/AuthContext';
import { formatINR, getMonthName, CATEGORY_CONFIG, formatDateOnly } from '../utils/formatters';

export default function ReportView({
  personalData,
  familyData,
  month,
  onSelectMonth,
  onOpenMonthSelector,
  onBackToHome,
  groups = [],
  selectedGroupId
}) {
  const { apiFetch } = useAuth();

  // Report Scope: 'personal' | 'family' (Keeps user on the Report page!)
  const [reportType, setReportType] = useState('personal');
  const [activeGroupId, setActiveGroupId] = useState(selectedGroupId || (groups[0]?.id || groups[0]?._id));

  // Date Filter Mode: 'monthly' | 'custom'
  const [filterMode, setFilterMode] = useState('monthly');

  // Custom Date Range State
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstDayOfMonthStr = `${month}-01`;
  const [startDate, setStartDate] = useState(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState('this_month');

  // Fetched Report Data state
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const prevY = m === 1 ? y - 1 : y;
    const prevM = m === 1 ? 12 : m - 1;
    const newMonth = `${prevY}-${String(prevM).padStart(2, '0')}`;
    onSelectMonth && onSelectMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [y, m] = month.split('-').map(Number);
    const nextY = m === 12 ? y + 1 : y;
    const nextM = m === 12 ? 1 : m + 1;
    const newMonth = `${nextY}-${String(nextM).padStart(2, '0')}`;
    onSelectMonth && onSelectMonth(newMonth);
  };

  // Quick Range Presets
  const handleApplyPreset = (preset) => {
    setActivePreset(preset);
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    if (preset === 'this_month') {
      const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      setStartDate(start);
      setEndDate(today);
    } else if (preset === 'last_7_days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().slice(0, 10));
      setEndDate(today);
    } else if (preset === 'last_30_days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().slice(0, 10));
      setEndDate(today);
    } else if (preset === 'last_3_months') {
      const d = new Date();
      d.setMonth(d.getMonth() - 3);
      setStartDate(d.toISOString().slice(0, 10));
      setEndDate(today);
    } else if (preset === 'year_to_date') {
      const start = `${now.getFullYear()}-01-01`;
      setStartDate(start);
      setEndDate(today);
    }
  };

  // Fetch Report Data from API
  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      let url = '';

      if (reportType === 'personal') {
        if (filterMode === 'custom') {
          url = `/api/personal/dashboard?startDate=${startDate}&endDate=${endDate}`;
        } else {
          url = `/api/personal/dashboard?month=${month}`;
        }
      } else {
        const targetGroup = activeGroupId || selectedGroupId || (groups[0]?.id || groups[0]?._id);
        if (!targetGroup) {
          setReportData(null);
          setLoading(false);
          return;
        }
        if (filterMode === 'custom') {
          url = `/api/family/groups/${targetGroup}/dashboard?startDate=${startDate}&endDate=${endDate}`;
        } else {
          url = `/api/family/groups/${targetGroup}/dashboard?month=${month}`;
        }
      }

      if (url) {
        const res = await apiFetch(url);
        setReportData(res);
      }
    } catch (err) {
      console.error('Failed to fetch report analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [reportType, filterMode, startDate, endDate, month, activeGroupId, selectedGroupId, groups, apiFetch]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Robust category breakdown extraction
  const categories = useMemo(() => {
    if (reportData?.categories && Array.isArray(reportData.categories) && reportData.categories.length > 0) {
      return reportData.categories;
    }
    if (reportData?.categoryBreakdown && Array.isArray(reportData.categoryBreakdown) && reportData.categoryBreakdown.length > 0) {
      return reportData.categoryBreakdown;
    }
    if (reportData?.expenses && Array.isArray(reportData.expenses)) {
      const totals = {};
      Object.keys(CATEGORY_CONFIG).forEach((cat) => { totals[cat] = 0; });
      let total = 0;
      reportData.expenses.forEach((e) => {
        const amt = Number(e.amount) || 0;
        total += amt;
        const cat = CATEGORY_CONFIG[e.category] ? e.category : 'Others';
        totals[cat] = (totals[cat] || 0) + amt;
      });
      return Object.keys(CATEGORY_CONFIG).map((cat) => ({
        category: cat,
        amount: totals[cat] || 0,
        percentage: total > 0 ? Number(((totals[cat] / total) * 100).toFixed(1)) : 0
      }));
    }
    return Object.keys(CATEGORY_CONFIG).map((cat) => ({ category: cat, amount: 0, percentage: 0 }));
  }, [reportData]);

  const totalSpent = Number(reportData?.totalSpent !== undefined ? reportData.totalSpent : reportData?.monthlySpent) || 0;
  const totalIncome = Number(reportData?.totalIncome !== undefined ? reportData.totalIncome : reportData?.monthlyIncome) || 0;
  const totalBalance = Number(reportData?.totalBalance !== undefined ? reportData.totalBalance : reportData?.remainingBalance) || 0;

  // Find top category with highest spending
  const topCategory = useMemo(() => {
    const activeCats = categories.filter((c) => Number(c.amount) > 0);
    if (activeCats.length === 0) return null;
    return [...activeCats].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  }, [categories]);

  return (
    <div className="space-y-6 animate-fadeIn pb-24 lg:pb-8">
      
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4">
        
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="w-10 h-10 rounded-2xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/40 transition-all active:scale-95 shrink-0"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Report & Analytics
              </h2>
              <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                {filterMode === 'monthly'
                  ? `Report for ${getMonthName(month)}`
                  : `Custom range: ${formatDateOnly(startDate)} - ${formatDateOnly(endDate)}`}
              </span>
            </div>
          </div>

          {/* Personal vs Family Scope Switcher */}
          <div className="flex bg-slate-200/70 dark:bg-[#131926] p-1 rounded-2xl border dark:border-slate-800">
            <button
              type="button"
              onClick={() => setReportType('personal')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                reportType === 'personal'
                  ? 'bg-white dark:bg-[#1E2638] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Personal</span>
            </button>
            <button
              type="button"
              onClick={() => setReportType('family')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                reportType === 'family'
                  ? 'bg-white dark:bg-[#1E2638] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Family</span>
            </button>
          </div>
        </div>

        {/* Date Filter & Month Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#131926] p-3 sm:p-4 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm transition-colors">
          
          {/* Mode Switcher: Monthly vs Custom Range */}
          <div className="flex bg-slate-100 dark:bg-[#1A2234] p-1 rounded-2xl shrink-0 border border-slate-200/60 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setFilterMode('monthly')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filterMode === 'monthly'
                  ? 'bg-white dark:bg-[#121826] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('custom')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filterMode === 'custom'
                  ? 'bg-white dark:bg-[#121826] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* When in Monthly Mode: Interactive Month Navigation (< Month >) */}
          {filterMode === 'monthly' && (
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-[#1A2234] hover:bg-slate-100 dark:hover:bg-[#222C42] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors active:scale-95"
                title="Previous Month"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenMonthSelector}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1A2234] hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800/60 text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{getMonthName(month)}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-[#1A2234] hover:bg-slate-100 dark:hover:bg-[#222C42] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors active:scale-95"
                title="Next Month"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Family Group Selector if viewing family report */}
          {reportType === 'family' && groups.length > 1 && (
            <div className="flex items-center gap-2">
              <select
                value={activeGroupId || selectedGroupId || ''}
                onChange={(e) => setActiveGroupId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                {groups.map((g) => (
                  <option key={g.id || g._id} value={g.id || g._id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

        </div>

      </div>

      {/* Custom Date Range Controls Panel */}
      {filterMode === 'custom' && (
        <div className="bg-white dark:bg-[#131926] p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4 animate-fadeIn transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Select Date Range</span>
            </span>
            {loading && (
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Refreshing...</span>
              </span>
            )}
          </div>

          {/* Quick Preset Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'this_month', label: 'This Month' },
              { id: 'last_7_days', label: 'Last 7 Days' },
              { id: 'last_30_days', label: 'Last 30 Days' },
              { id: 'last_3_months', label: 'Last 3 Months' },
              { id: 'year_to_date', label: 'This Year' }
            ].map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => handleApplyPreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activePreset === p.id
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#222C42] text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700/60'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* From & To Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Cashflow Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="fintech-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/40 flex items-center justify-center shrink-0">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
              {filterMode === 'monthly' ? 'Month Spent' : 'Range Spent'}
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white block truncate">
              {formatINR(totalSpent)}
            </span>
          </div>
        </div>

        <div className="fintech-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
              {filterMode === 'monthly' ? 'Month Income' : 'Range Income'}
            </span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 block truncate">
              {formatINR(totalIncome)}
            </span>
          </div>
        </div>

        <div className="fintech-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center shrink-0">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
              Total Balance
            </span>
            <span className="text-sm sm:text-base font-extrabold text-indigo-600 dark:text-indigo-400 block truncate">
              {formatINR(totalBalance)}
            </span>
          </div>
        </div>

        <div className="fintech-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
              Top Category
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white block truncate">
              {topCategory ? `${topCategory.category} (${topCategory.percentage}%)` : 'None (0%)'}
            </span>
          </div>
        </div>

      </div>

      {/* Main Donut Chart & Category Progress List */}
      {loading ? (
        <div className="fintech-card p-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
          <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Loading {filterMode === 'monthly' ? getMonthName(month) : 'selected range'} analytics...</span>
        </div>
      ) : (
        <CategoryPieChart
          categories={categories}
          totalSpent={totalSpent}
          title={
            reportType === 'personal'
              ? `Personal Expenses (${filterMode === 'monthly' ? getMonthName(month) : `${formatDateOnly(startDate)} - ${formatDateOnly(endDate)}`})`
              : `Family Expenses (${filterMode === 'monthly' ? getMonthName(month) : `${formatDateOnly(startDate)} - ${formatDateOnly(endDate)}`})`
          }
        />
      )}

    </div>
  );
}
