import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Calendar,
  TrendingUp,
  Award,
  PiggyBank,
  ArrowDownRight,
  Filter,
  Check,
  RefreshCw
} from 'lucide-react';
import CategoryPieChart from '../components/CategoryPieChart';
import { useAuth } from '../context/AuthContext';
import { formatINR, getMonthName, CATEGORY_CONFIG, formatDateOnly } from '../utils/formatters';

export default function ReportView({
  personalData: initialPersonalData,
  familyData: initialFamilyData,
  month: initialMonth,
  onOpenMonthSelector,
  onBackToHome,
  activeWorkspace = 'personal',
  onSwitchWorkspace
}) {
  const { apiFetch } = useAuth();
  const isPersonal = activeWorkspace === 'personal';

  // Date Filter Mode: 'monthly' | 'custom'
  const [filterMode, setFilterMode] = useState('monthly');
  const [activeMonth, setActiveMonth] = useState(initialMonth);

  // Custom Date Range State (defaults to current month start & today)
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstDayOfMonthStr = `${initialMonth}-01`;
  const [startDate, setStartDate] = useState(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState('this_month');

  // Fetched Report Data state
  const [reportData, setReportData] = useState(isPersonal ? initialPersonalData : initialFamilyData);
  const [loading, setLoading] = useState(false);

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

  // Fetch Report Data
  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      let url = '';
      if (isPersonal) {
        if (filterMode === 'custom') {
          url = `/api/personal/dashboard?startDate=${startDate}&endDate=${endDate}`;
        } else {
          url = `/api/personal/dashboard?month=${activeMonth}`;
        }
      } else {
        const groupId = initialFamilyData?.group?.id || initialFamilyData?.group?._id;
        if (!groupId) return;
        if (filterMode === 'custom') {
          url = `/api/family/groups/${groupId}/dashboard?startDate=${startDate}&endDate=${endDate}`;
        } else {
          url = `/api/family/groups/${groupId}/dashboard?month=${activeMonth}`;
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
  }, [isPersonal, filterMode, startDate, endDate, activeMonth, initialFamilyData, apiFetch]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Resilient category breakdown extraction
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

  const totalSpent = Number(reportData?.totalSpent) || 0;
  const totalIncome = Number(reportData?.totalIncome || reportData?.budget) || 0;
  const remainingBalance = Number(reportData?.remainingBalance) || (totalIncome - totalSpent);

  // Find top category with highest spending
  const topCategory = useMemo(() => {
    const activeCats = categories.filter((c) => Number(c.amount) > 0);
    if (activeCats.length === 0) return null;
    return [...activeCats].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  }, [categories]);

  return (
    <div className="space-y-6 animate-fadeIn pb-24 lg:pb-8">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-95 shrink-0"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Report & Analytics
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {filterMode === 'monthly'
                ? `Monthly report for ${getMonthName(activeMonth)}`
                : `Custom range: ${formatDateOnly(startDate)} - ${formatDateOnly(endDate)}`}
            </span>
          </div>
        </div>

        {/* Mode & Date Filters */}
        <div className="flex items-center gap-2">
          {/* Monthly vs Custom Range Switcher */}
          <div className="flex bg-slate-200/70 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setFilterMode('monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filterMode === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('custom')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filterMode === 'custom'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Custom Range
            </button>
          </div>

          {filterMode === 'monthly' && (
            <button
              type="button"
              onClick={onOpenMonthSelector}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-xs font-bold text-slate-700 hover:border-indigo-200 hover:text-indigo-600 transition-all shrink-0"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{getMonthName(activeMonth)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Range Controls Panel */}
      {filterMode === 'custom' && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>Select Date Range</span>
            </span>
            {loading && (
              <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
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
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* From & To Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset('custom');
                }}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mode Switcher (Personal vs Family) */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl max-w-sm">
        <button
          type="button"
          onClick={() => onSwitchWorkspace('personal')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            isPersonal
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Personal Report
        </button>
        <button
          type="button"
          onClick={() => onSwitchWorkspace('family')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            !isPersonal
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Family Report
        </button>
      </div>

      {/* Cashflow Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="fintech-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Income
            </span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-600 block truncate">
              {formatINR(totalIncome)}
            </span>
          </div>
        </div>

        <div className="fintech-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Spent
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 block truncate">
              {formatINR(totalSpent)}
            </span>
          </div>
        </div>

        <div className="fintech-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Net Balance
            </span>
            <span className={`text-sm sm:text-base font-extrabold block truncate ${remainingBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              {formatINR(remainingBalance)}
            </span>
          </div>
        </div>

        <div className="fintech-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Top Category
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 block truncate">
              {topCategory ? `${topCategory.category} (${topCategory.percentage}%)` : 'None (0%)'}
            </span>
          </div>
        </div>

      </div>

      {/* Main Donut Chart & Category Progress List */}
      <CategoryPieChart
        categories={categories}
        totalSpent={totalSpent}
        title={
          isPersonal
            ? `Personal Breakdown (${filterMode === 'monthly' ? getMonthName(activeMonth) : `${formatDateOnly(startDate)} - ${formatDateOnly(endDate)}`})`
            : `Family Breakdown (${filterMode === 'monthly' ? getMonthName(activeMonth) : `${formatDateOnly(startDate)} - ${formatDateOnly(endDate)}`})`
        }
      />

    </div>
  );
}
