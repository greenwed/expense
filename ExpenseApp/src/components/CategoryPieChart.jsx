import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Utensils,
  ShoppingBag,
  Film,
  HeartPulse,
  Car,
  MoreHorizontal,
  PieChart as PieIcon
} from 'lucide-react';
import { formatINR, CATEGORY_CONFIG } from '../utils/formatters';

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
  title = 'Expenses Report'
}) {
  const chartData = categories
    .map((c) => ({
      ...c,
      amount: Number(c.amount) || 0,
      percentage: Number(c.percentage) || 0
    }))
    .filter((c) => c.amount > 0);

  const numTotalSpent = Number(totalSpent) || chartData.reduce((acc, c) => acc + c.amount, 0);

  if (numTotalSpent === 0 && chartData.length === 0) {
    return (
      <div className="fintech-card p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-3 shadow-inner">
          <PieIcon className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h4 className="text-base font-bold text-slate-700">No Expenses Recorded</h4>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          Add an expense entry to view category analytics and visual donut breakdown.
        </p>
      </div>
    );
  }

  return (
    <div className="fintech-card p-5 sm:p-7 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>{title}</span>
        </h3>
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
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
                    <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl text-xs font-semibold shadow-xl border border-slate-700">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: data.fill }}
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
            >
              {chartData.map((entry, index) => {
                const conf = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.Others;
                return <Cell key={`cell-${index}`} fill={conf.color} stroke="#FFFFFF" strokeWidth={2} />;
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Centered Total Amount inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Expenses
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            {formatINR(numTotalSpent)}
          </span>
        </div>
      </div>

      {/* Category Progress Cards List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">
          <span>All Categories</span>
          <span>{formatINR(numTotalSpent)}</span>
        </div>

        {categories.map((item) => {
          const conf = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Others;
          const Icon = ICON_MAP[item.category] || MoreHorizontal;
          const amount = Number(item.amount) || 0;
          const percentage = Number(item.percentage) || 0;
          const hasSpending = amount > 0;

          return (
            <div
              key={item.category}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                hasSpending
                  ? 'bg-slate-50/80 border-slate-200/80 shadow-sm'
                  : 'bg-transparent border-slate-100 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${conf.color}15`, color: conf.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 block leading-tight">
                      {conf.name}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {percentage}% of total
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 block">
                    {formatINR(amount)}
                  </span>
                  {hasSpending && (
                    <span className="text-[10px] font-bold text-emerald-600">
                      Active
                    </span>
                  )}
                </div>
              </div>

              {/* Horizontal Progress Bar */}
              <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, percentage))}%`,
                    backgroundColor: conf.color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
