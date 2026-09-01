import React from 'react';
import { Home, PieChart, Users, Settings, Plus } from 'lucide-react';

export default function BottomNav({
  activeTab = 'home',
  onChangeTab,
  onOpenQuickAdd
}) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'report', label: 'Report', icon: PieChart },
    { id: 'fab', isFab: true },
    { id: 'family', label: 'Family', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden pointer-events-none pb-safe">
      <div className="max-w-md mx-auto px-4 pb-4 pointer-events-auto">
        <div className="relative bg-white/95 dark:bg-[#0E1320]/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-[28px] px-3 py-2 shadow-2xl shadow-slate-900/10 dark:shadow-black/60 flex items-center justify-between transition-colors">
          
          {navItems.map((item) => {
            if (item.isFab) {
              return (
                <div key="fab-btn" className="relative -top-6 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={onOpenQuickAdd}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 dark:from-indigo-500 dark:to-cyan-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/40 dark:shadow-indigo-500/20 border-4 border-[#F8FAFC] dark:border-[#0B0F19] active:scale-95 transition-all"
                    aria-label="Add Transaction"
                  >
                    <Plus className="w-7 h-7 stroke-[2.5]" />
                  </button>
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                    : 'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/70' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
              </button>
            );
          })}

        </div>
      </div>
    </div>
  );
}
