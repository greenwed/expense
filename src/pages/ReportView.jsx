import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, Calendar, TrendingUp, DollarSign, Award, Sparkles } from 'lucide-react';
import CategoryPieChart from '../components/CategoryPieChart';
import { formatINR, getMonthName } from '../utils/formatters';

export default function ReportView({
  personalData,
  familyData,
  month,
  onOpenMonthSelector,
  onBackToHome,
  activeWorkspace = 'personal',
  onSwitchWorkspace
}) {
  const isPersonal = activeWorkspace === 'personal';
  const currentData = isPersonal ? personalData : familyData;
  const categories = currentData?.categories || [];
  const totalSpent = currentData?.totalSpent || 0;
  const budget = currentData?.budget || 0;

  // Find top category
  const topCategory = [...categories].sort((a, b) => b.amount - a.amount)[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-24 lg:pb-8">
      
      {/* Top Bar matching Screen 2 mockup */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-95"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Report & Analytics
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Detailed expense distribution
            </span>
          </div>
        </div>

        {/* Month Selector Chip */}
        <button
          type="button"
          onClick={onOpenMonthSelector}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-xs font-bold text-slate-700 hover:border-indigo-200 hover:text-indigo-600 transition-all"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{getMonthName(month)}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Mode Switcher Pills */}
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

      {/* Top Insights Quick Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        <div className="fintech-card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Spent
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 block">
              {formatINR(totalSpent)}
            </span>
          </div>
        </div>

        <div className="fintech-card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="truncate">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Top Category
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 block truncate">
              {topCategory?.amount > 0 ? topCategory.category : 'None'} ({topCategory?.percentage || 0}%)
            </span>
          </div>
        </div>

        <div className="fintech-card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Budget Status
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 block">
              {budget > 0 ? `${((totalSpent / budget) * 100).toFixed(0)}% Used` : 'No Budget'}
            </span>
          </div>
        </div>

      </div>

      {/* Main Donut Chart & Category Progress List */}
      <CategoryPieChart
        categories={categories}
        totalSpent={totalSpent}
        title={isPersonal ? 'Personal Expenses Breakdown' : 'Family Group Spending Breakdown'}
      />

    </div>
  );
}
