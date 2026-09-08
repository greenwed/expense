import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Utensils,
  ShoppingBag,
  Film,
  HeartPulse,
  Car,
  MoreHorizontal,
  PieChart as PieIcon,
  ChevronDown,
  Clock
} from 'lucide-react';
import { formatINR, formatDateTime, CATEGORY_CONFIG } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';
import { useCategories } from '../context/CategoryContext';

const ICON_MAP = {
  Food: Utensils,
  Shopping: ShoppingBag,
  Entertainment: Film,
  Medical: HeartPulse,
  Transport: Car,
  Others: MoreHorizontal
};

export default function CategoryPieChart({
  categories = [],
  totalSpent = 0,
  expenses = [],
  title = 'Expenses Report'
}) {
  const { isDark } = useTheme();
  const { getCategoryMeta, iconComponents } = useCategories();

  // Accordion state: only one category open at a time
  const [expandedCategory, setExpandedCategory] = useState(null);

  const toggleCategory = (categoryName) => {
    setExpandedCategory((prev) => (prev === categoryName ? null : categoryName));
  };

  const chartData = categories
    .map((c) => {
      const meta = getCategoryMeta ? getCategoryMeta(c.category) : (CATEGORY_CONFIG[c.category] || CATEGORY_CONFIG.Others);
      return {
        ...c,
        amount: Number(c.amount) || 0,
        percentage: Number(c.percentage) || 0,
        color: c.color || meta.color
      };
    })
    .filter((c) => c.amount > 0);

  const numTotalSpent = Number(totalSpent) || chartData.reduce((acc, c) => acc + c.amount, 0);

  // Group and sort expenses for the currently expanded category
  const activeCategoryExpenses = useMemo(() => {
    if (!expandedCategory) return [];
    return (expenses || [])
      .filter((e) => {
        const cat = e.category || 'Others';
        return cat.toLowerCase() === expandedCategory.toLowerCase();
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [expenses, expandedCategory]);

  if (numTotalSpent === 0 && chartData.length === 0) {
    return (
      <div className="fintech-card p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-[#1A2234] border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-500 mb-3 shadow-inner">
          <PieIcon className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">No Expenses Recorded</h4>
        <p className="text-xs text-slate-400 dark:text-slate-400 max-w-xs mt-1">
          Add an expense entry to view category analytics and visual donut breakdown.
        </p>
      </div>
    );
  }

  return (
    <div className="fintech-card p-5 sm:p-7 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span>{title}</span>
        </h3>
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800/60">
          {chartData.length} Active Categories
        </span>
      </div>

      {/* Segmented Donut Chart */}
      <div className="relative w-full h-72 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 dark:bg-[#1E2638] text-white px-3.5 py-2.5 rounded-2xl text-xs font-semibold shadow-xl border border-slate-700">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: data.color || data.fill }}
                        />
                        <span className="font-bold">{data.category}</span>
                      </div>
                      <div className="text-emerald-400 font-extrabold text-sm">{formatINR(data.amount)}</div>
                      <div className="text-slate-400 text-[10px]">{data.percentage}% of total</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={76}
              outerRadius={105}
              paddingAngle={4}
              cornerRadius={8}
              animationDuration={800}
              onClick={(entry) => entry && entry.category && toggleCategory(entry.category)}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => {
                const isSelected = expandedCategory === entry.category;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    stroke={isSelected ? (isDark ? "#818CF8" : "#4F46E5") : (isDark ? "#131926" : "#FFFFFF")} 
                    strokeWidth={isSelected ? 3 : 2} 
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Centered Total Amount inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
            Total Expenses
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            {formatINR(numTotalSpent)}
          </span>
        </div>
      </div>

      {/* Category Progress Cards List with Interactive Accordion Dropdown */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 dark:text-slate-400 px-1 uppercase tracking-wider">
          <span>All Categories</span>
          <span>{formatINR(numTotalSpent)}</span>
        </div>

        {categories.map((item) => {
          const conf = getCategoryMeta ? getCategoryMeta(item.category) : (CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Others);
          const itemColor = item.color || conf.color;
          const Icon = (item.icon && iconComponents?.[item.icon]) || conf.IconComponent || ICON_MAP[item.category] || MoreHorizontal;
          const categoryName = item.category || conf.name;
          const amount = Number(item.amount) || 0;
          const percentage = Number(item.percentage) || 0;
          const hasSpending = amount > 0;
          const isExpanded = expandedCategory === item.category;
          const itemExpenses = isExpanded ? activeCategoryExpenses : [];

          return (
            <div
              key={item.category}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isExpanded
                  ? 'bg-slate-50 dark:bg-[#1A2234] border-indigo-300 dark:border-indigo-600/80 shadow-md ring-1 ring-indigo-500/20'
                  : hasSpending
                  ? 'bg-slate-50/80 dark:bg-[#1A2234] border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:border-slate-300 dark:hover:border-slate-600'
                  : 'bg-transparent border-slate-100 dark:border-slate-800/50 opacity-60'
              }`}
            >
              {/* Clickable Card Header */}
              <button
                type="button"
                onClick={() => toggleCategory(item.category)}
                className="w-full text-left p-3.5 sm:p-4 focus:outline-none transition-colors select-none cursor-pointer"
                aria-expanded={isExpanded}
                title={`Click to ${isExpanded ? 'close' : 'view'} ${categoryName} expenses`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0"
                      style={{ backgroundColor: `${itemColor}15`, color: itemColor }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight truncate">
                        {categoryName}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                        {percentage}% of total
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white block">
                        {formatINR(amount)}
                      </span>
                      {hasSpending && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          Active
                        </span>
                      )}
                    </div>
                    <div className={`p-1 rounded-lg text-slate-400 dark:text-slate-400 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Horizontal Progress Bar */}
                <div className="w-full bg-slate-200/60 dark:bg-slate-700/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, percentage))}%`,
                      backgroundColor: itemColor
                    }}
                  />
                </div>
              </button>

              {/* Accordion Dropdown List of Expenses */}
              {isExpanded && (
                <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-1 space-y-2 animate-fadeIn border-t border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-400 pt-1.5 px-1">
                    <span>
                      {itemExpenses.length} {itemExpenses.length === 1 ? 'Entry' : 'Entries'}
                    </span>
                    <span>
                      Total: <strong className="text-slate-700 dark:text-slate-200">{formatINR(amount)}</strong>
                    </span>
                  </div>

                  {itemExpenses.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 dark:text-slate-500 rounded-xl bg-white/60 dark:bg-[#131926]/60 border border-slate-100 dark:border-slate-800/80">
                      No expense entries found in {categoryName} for this period.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5 divide-y-0">
                      {itemExpenses.map((exp) => (
                        <div
                          key={exp.id || exp._id}
                          className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#131926] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate">
                              {exp.description}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{formatDateTime(exp.date)}</span>
                              {exp.userName && (
                                <span className="truncate">• by {exp.userName}</span>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs sm:text-base font-black text-slate-900 dark:text-white">
                              -{formatINR(exp.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
