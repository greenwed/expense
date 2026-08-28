import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CATEGORY_CONFIG, formatINR } from '../utils/formatters';
import { PieChart as PieIcon, Utensils, ShoppingBag, Film, HeartPulse, Car, MoreHorizontal } from 'lucide-react';

const ICON_MAP = {
  Utensils,
  ShoppingBag,
  Film,
  HeartPulse,
  Car,
  MoreHorizontal
};

export default function CategoryPieChart({ categoryBreakdown = [], totalSpent = 0 }) {
  const [activeIndex, setActiveIndex] = useState(null);

  // Filter categories with positive spending for the chart slices
  const activeData = categoryBreakdown.filter(item => item.amount > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const config = CATEGORY_CONFIG[data.category] || CATEGORY_CONFIG.Others;
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <span className="font-semibold text-white text-sm">{data.category}</span>
          </div>
          <div className="text-emerald-400 font-bold text-base">
            {formatINR(data.amount)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {data.percentage}% of total spent
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PieIcon className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-base text-white">Category Spending Breakdown</h3>
        </div>
        <span className="text-xs text-slate-400">
          Total: <strong className="text-white">{formatINR(totalSpent)}</strong>
        </span>
      </div>

      {totalSpent === 0 || activeData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
          <div className="w-14 h-14 rounded-full bg-slate-800/80 flex items-center justify-center mb-3 border border-slate-700/50">
            <PieIcon className="w-7 h-7 text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-300">No expenses recorded for this month</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Add an expense entry below to visualize spending across categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Pie Chart */}
          <div className="md:col-span-5 h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="amount"
                  nameKey="category"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {activeData.map((entry, index) => {
                    const config = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.Others;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={config.color}
                        stroke="#0f172a"
                        strokeWidth={2}
                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Spent</span>
              <span className="text-sm font-bold text-white tracking-tight">{formatINR(totalSpent)}</span>
            </div>
          </div>

          {/* Interactive Legend & Category List */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {categoryBreakdown.map((catItem) => {
              const config = CATEGORY_CONFIG[catItem.category] || CATEGORY_CONFIG.Others;
              const IconComponent = ICON_MAP[config.icon] || MoreHorizontal;
              const hasSpending = catItem.amount > 0;

              return (
                <div
                  key={catItem.category}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    hasSpending
                      ? 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                      : 'bg-slate-900/40 border-slate-800/40 opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${config.color}20`, color: config.color }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{catItem.category}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {hasSpending ? `${catItem.percentage}% of total` : '₹0'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${hasSpending ? 'text-white' : 'text-slate-500'}`}>
                      {formatINR(catItem.amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
