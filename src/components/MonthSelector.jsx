import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, RotateCcw } from 'lucide-react';
import { getMonthName, getCurrentMonthStr } from '../utils/formatters';

export default function MonthSelector({ selectedMonth, onMonthChange }) {
  const currentMonthStr = getCurrentMonthStr();
  const isCurrentMonth = selectedMonth === currentMonthStr;

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    onMonthChange(`${prevYear}-${String(prevMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth === 13) {
      nextMonth = 1;
      nextYear += 1;
    }
    onMonthChange(`${nextYear}-${String(nextMonth).padStart(2, '0')}`);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-2.5 sm:p-3 rounded-2xl border border-slate-800 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevMonth}
          title="Previous Month"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/60 relative">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm sm:text-base text-white tracking-tight min-w-[130px] text-center">
            {getMonthName(selectedMonth)}
          </span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => e.target.value && onMonthChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            title="Click to jump to specific month"
          />
        </div>

        <button
          onClick={handleNextMonth}
          title="Next Month"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {!isCurrentMonth ? (
          <button
            onClick={() => onMonthChange(currentMonthStr)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Back to Current Month</span>
          </button>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/30">
            • Live Month
          </span>
        )}
      </div>
    </div>
  );
}
