import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getMonthName, getCurrentMonthStr } from '../utils/formatters';

const MONTHS = [
  { val: '01', name: 'Jan' },
  { val: '02', name: 'Feb' },
  { val: '03', name: 'Mar' },
  { val: '04', name: 'Apr' },
  { val: '05', name: 'May' },
  { val: '06', name: 'Jun' },
  { val: '07', name: 'Jul' },
  { val: '08', name: 'Aug' },
  { val: '09', name: 'Sep' },
  { val: '10', name: 'Oct' },
  { val: '11', name: 'Nov' },
  { val: '12', name: 'Dec' }
];

export default function MonthSelector({ isOpen, onClose, selectedMonth, onSelectMonth }) {
  const currentYear = selectedMonth ? parseInt(selectedMonth.split('-')[0]) : new Date().getFullYear();
  const [viewYear, setViewYear] = useState(currentYear);

  React.useEffect(() => {
    if (selectedMonth) {
      setViewYear(parseInt(selectedMonth.split('-')[0]));
    }
  }, [selectedMonth, isOpen]);

  if (!isOpen) return null;

  const currentMonthStr = getCurrentMonthStr();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-backdrop-fade">
      <div className="bg-white border border-slate-200/80 rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-extrabold text-slate-900">Select Month</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Year Navigator */}
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <button
              onClick={() => setViewYear((y) => y - 1)}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 shadow-sm transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-base font-black text-slate-900">{viewYear}</span>
            <button
              onClick={() => setViewYear((y) => y + 1)}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 shadow-sm transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {MONTHS.map((m) => {
              const monthStr = `${viewYear}-${m.val}`;
              const isSelected = selectedMonth === monthStr;
              const isCurrent = currentMonthStr === monthStr;

              return (
                <button
                  key={m.val}
                  type="button"
                  onClick={() => {
                    onSelectMonth(monthStr);
                    onClose();
                  }}
                  className={`py-3 rounded-2xl font-bold text-xs transition-all relative ${
                    isSelected
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-105'
                      : 'bg-slate-50 hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-600 border border-slate-100'
                  }`}
                >
                  <span>{m.name}</span>
                  {isCurrent && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 absolute bottom-1.5 left-1/2 -translate-x-1/2" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectMonth(currentMonthStr);
              onClose();
            }}
            className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
          >
            Jump to Current Month
          </button>
        </div>

      </div>
    </div>
  );
}
