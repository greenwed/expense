import React, { useState } from 'react';
import {
  X,
  BookOpen,
  HelpCircle,
  IndianRupee,
  Wallet,
  TrendingUp,
  ArrowDownRight,
  PieChart,
  Users,
  ShieldCheck,
  Bell,
  Sparkles,
  ChevronRight,
  Compass,
  Play
} from 'lucide-react';

export default function UserGuideModal({ isOpen, onClose, onStartTour }) {
  const [activeSection, setActiveSection] = useState('overview');

  if (!isOpen) return null;

  const sections = [
    {
      id: 'overview',
      title: '1. Overview & Dashboard',
      icon: IndianRupee,
      color: '#818CF8',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            <strong className="text-slate-900 dark:text-white">RupeeTrack</strong> is designed to give you instant clarity over your finances.
          </p>
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/40 text-indigo-950 dark:text-indigo-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200">
              <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Key Metrics Explained:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300 text-xs">
              <li><strong className="text-slate-900 dark:text-white">Total Balance:</strong> Real-time available money calculated from all recorded incomes minus expenses.</li>
              <li><strong className="text-slate-900 dark:text-white">Monthly Income:</strong> Total earnings registered for the selected month.</li>
              <li><strong className="text-slate-900 dark:text-white">Monthly Expenses:</strong> Total amount spent across all categories in the active month.</li>
            </ul>
          </div>
          <p>
            Use the <strong className="text-slate-900 dark:text-white">Month Selector</strong> in the top bar to switch between months, or toggle <strong className="text-slate-900 dark:text-white">All Time</strong> to view your lifetime statistics.
          </p>
        </div>
      )
    },
    {
      id: 'transactions',
      title: '2. Adding Incomes & Expenses',
      icon: TrendingUp,
      color: '#34D399',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Recording your daily money flow is instant and flexible:
          </p>
          <div className="space-y-2.5">
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-800/40">
              <span className="font-bold text-emerald-900 dark:text-emerald-300 block mb-1">💸 Adding Income:</span>
              <p className="text-xs text-emerald-800 dark:text-emerald-200">
                Tap <strong className="text-emerald-900 dark:text-emerald-100">+ Income</strong> to record salary, freelancing, rental returns, or gifts. Use quick amount chips (+₹5,000, +₹10,000, +₹50,000) for rapid entry.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-800/40">
              <span className="font-bold text-rose-900 dark:text-rose-300 block mb-1">🛒 Adding Expense:</span>
              <p className="text-xs text-rose-800 dark:text-rose-200">
                Tap <strong className="text-rose-900 dark:text-rose-100">Add Expense</strong> (or the mobile center <strong className="text-rose-900 dark:text-rose-100">+</strong> button). Select a category (<em>Food, Shopping, Entertainment, Medical, Transport, Others</em>), add a description, and choose the date and time.
              </p>
            </div>
          </div>
          <p>
            Under the <strong className="text-slate-900 dark:text-white">"Your Money"</strong> section, click on the Income or Expense cards to view, search, edit, or delete existing entries at any time.
          </p>
        </div>
      )
    },
    {
      id: 'budgets',
      title: '3. Monthly Budgets & 80%/100% Alerts',
      icon: Bell,
      color: '#FBBF24',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            RupeeTrack helps prevent overspending with smart automated budget alerts.
          </p>
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-800/40 text-amber-950 dark:text-amber-200 space-y-2">
            <span className="font-bold text-amber-900 dark:text-amber-300 block">⚡ How Spending Warnings Work:</span>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
              <li><strong className="text-amber-950 dark:text-amber-100">Safe Zone (&lt; 80%):</strong> Clean indicator showing remaining discretionary budget.</li>
              <li><strong className="text-amber-950 dark:text-amber-100">80% Warning Banner:</strong> When your monthly spending reaches 80% of your income or budget, an amber alert prompts you to moderate upcoming expenses.</li>
              <li><strong className="text-amber-950 dark:text-amber-100">100% Exceeded Alert:</strong> If spending exceeds 100%, a high-priority red alert notifies you of budget overshoot.</li>
            </ul>
          </div>
          <p>
            You can configure your monthly budget anytime under <strong className="text-slate-900 dark:text-white">Settings ➔ Monthly Budget Configuration</strong>.
          </p>
        </div>
      )
    },
    {
      id: 'reports',
      title: '4. Visual Reports & Analytics',
      icon: PieChart,
      color: '#A78BFA',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            The <strong className="text-slate-900 dark:text-white">Report</strong> tab provides visual breakdowns of where your money actually goes:
          </p>
          <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-800/40 space-y-2 text-purple-950 dark:text-purple-200">
            <span className="font-bold text-purple-900 dark:text-purple-300 block">📊 Analytics Tools:</span>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <li><strong className="text-slate-900 dark:text-white">Category Breakdown:</strong> An interactive chart showing exact percentages and amounts spent on Food, Shopping, Transport, Medical, etc.</li>
              <li><strong className="text-slate-900 dark:text-white">Month-over-Month Comparison:</strong> Switch months to analyze seasonal spending habits and savings trends.</li>
              <li><strong className="text-slate-900 dark:text-white">Family Analytics:</strong> Toggle between personal reports and shared group finances.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'family',
      title: '5. Collaborative Family Groups',
      icon: Users,
      color: '#F472B6',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Manage household finances, room expenses, or shared group events together in real-time.
          </p>
          <div className="p-3.5 rounded-2xl bg-pink-50/70 dark:bg-pink-950/50 border border-pink-100 dark:border-pink-800/40 space-y-2 text-pink-950 dark:text-pink-200">
            <span className="font-bold text-pink-900 dark:text-pink-300 block">👨‍👩‍👧‍👦 Family Workspace Features:</span>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
              <li><strong className="text-slate-900 dark:text-white">Create Groups:</strong> Create groups like "Home Expenses" or "Trip 2026".</li>
              <li><strong className="text-slate-900 dark:text-white">Instant Invite Links:</strong> Generate secure links to invite family members with 1 click.</li>
              <li><strong className="text-slate-900 dark:text-white">Member Roles:</strong> Manage permissions with <em>Admin</em> (full management), <em>Moderator</em> (edit permissions), and <em>Member</em> (standard access).</li>
              <li><strong className="text-slate-900 dark:text-white">Transparent Tracking:</strong> Every shared transaction highlights which member recorded it.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      title: '6. Security & Account Recovery',
      icon: ShieldCheck,
      color: '#60A5FA',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            Your account security is protected with modern authentication:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            <li><strong className="text-slate-900 dark:text-white">Email OTP Verification:</strong> 6-digit codes verify your email upon registration and password reset.</li>
            <li><strong className="text-slate-900 dark:text-white">Password Reset:</strong> Forgot your password? Request a 6-digit reset code to securely create a new one.</li>
            <li><strong className="text-slate-900 dark:text-white">Forgot Username:</strong> Enter your registered email to instantly receive your username.</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-backdrop-fade">
      <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                RupeeTrack User Guide
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-400">Complete handbook and feature documentation</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tour CTA Banner */}
        <div className="p-4 sm:px-6 bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-indigo-500 dark:to-cyan-500 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 shrink-0 text-indigo-200 dark:text-indigo-100" />
            <div>
              <span className="text-xs sm:text-sm font-bold block">Want a guided visual tour?</span>
              <span className="text-[11px] text-indigo-100 dark:text-indigo-100 block">Take the 30-second interactive app walkthrough</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onStartTour) onStartTour();
            }}
            className="px-3.5 py-1.5 bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Tour</span>
          </button>
        </div>

        {/* Content Body: Sidebar Navigation + Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Section Selector Grid / Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {sections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSection(s.id)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                    isActive
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-[#1A2234] border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-[#222C42]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <span className="text-xs font-bold leading-tight line-clamp-1">{s.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Section Content Card */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
              {React.createElement(sections.find((s) => s.id === activeSection).icon, {
                className: 'w-5 h-5',
                style: { color: sections.find((s) => s.id === activeSection).color }
              })}
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {sections.find((s) => s.id === activeSection).title}
              </h4>
            </div>
            <div>
              {sections.find((s) => s.id === activeSection).content}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1A2234] flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">RupeeTrack • Follow your spending</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs shadow-md transition-colors border border-transparent dark:border-slate-700"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
}
