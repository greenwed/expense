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
      color: '#6366F1',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            <strong>RupeeTrack</strong> is designed to give you instant clarity over your finances.
          </p>
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <Wallet className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Key Metrics Explained:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-700 text-xs">
              <li><strong>Total Balance:</strong> Real-time available money calculated from all recorded incomes minus expenses.</li>
              <li><strong>Monthly Income:</strong> Total earnings registered for the selected month.</li>
              <li><strong>Monthly Expenses:</strong> Total amount spent across all categories in the active month.</li>
            </ul>
          </div>
          <p>
            Use the <strong>Month Selector</strong> in the top bar to switch between months, or toggle <strong>All Time</strong> to view your lifetime statistics.
          </p>
        </div>
      )
    },
    {
      id: 'transactions',
      title: '2. Adding Incomes & Expenses',
      icon: TrendingUp,
      color: '#10B981',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Recording your daily money flow is instant and flexible:
          </p>
          <div className="space-y-2.5">
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <span className="font-bold text-emerald-900 block mb-1">💸 Adding Income:</span>
              <p className="text-xs text-emerald-800">
                Tap <strong>+ Income</strong> to record salary, freelancing, rental returns, or gifts. Use quick amount chips (+₹5,000, +₹10,000, +₹50,000) for rapid entry.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100">
              <span className="font-bold text-rose-900 block mb-1">🛒 Adding Expense:</span>
              <p className="text-xs text-rose-800">
                Tap <strong>Add Expense</strong> (or the mobile center <strong>+</strong> button). Select a category (<em>Food, Shopping, Entertainment, Medical, Transport, Others</em>), add a description, and choose the date and time.
              </p>
            </div>
          </div>
          <p>
            Under the <strong>"Your Money"</strong> section, click on the Income or Expense cards to view, search, edit, or delete existing entries at any time.
          </p>
        </div>
      )
    },
    {
      id: 'budgets',
      title: '3. Monthly Budgets & 80%/100% Alerts',
      icon: Bell,
      color: '#F59E0B',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            RupeeTrack helps prevent overspending with smart automated budget alerts.
          </p>
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 text-amber-950 space-y-2">
            <span className="font-bold text-amber-900 block">⚡ How Spending Warnings Work:</span>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-amber-900">
              <li><strong>Safe Zone (&lt; 80%):</strong> Clean blue/green indicator showing remaining discretionary budget.</li>
              <li><strong>80% Warning Banner:</strong> When your monthly spending reaches 80% of your income or budget, an amber alert prompts you to moderate upcoming expenses.</li>
              <li><strong>100% Exceeded Alert:</strong> If spending exceeds 100%, a high-priority red alert notifies you of budget overshoot.</li>
            </ul>
          </div>
          <p>
            You can configure your monthly budget anytime under <strong>Settings ➔ Monthly Budget Configuration</strong>.
          </p>
        </div>
      )
    },
    {
      id: 'reports',
      title: '4. Visual Reports & Analytics',
      icon: PieChart,
      color: '#8B5CF6',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            The <strong>Report</strong> tab provides visual breakdowns of where your money actually goes:
          </p>
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-2 text-purple-950">
            <span className="font-bold text-purple-900 block">📊 Analytics Tools:</span>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
              <li><strong>Category Breakdown:</strong> An interactive chart showing exact percentages and amounts spent on Food, Shopping, Transport, Medical, etc.</li>
              <li><strong>Month-over-Month Comparison:</strong> Switch months to analyze seasonal spending habits and savings trends.</li>
              <li><strong>Family Analytics:</strong> Toggle between personal reports and shared group finances.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'family',
      title: '5. Collaborative Family Groups',
      icon: Users,
      color: '#EC4899',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Manage household finances, room expenses, or shared group events together in real-time.
          </p>
          <div className="p-3.5 rounded-2xl bg-pink-50/70 border border-pink-100 space-y-2 text-pink-950">
            <span className="font-bold text-pink-900 block">👨‍👩‍👧‍👦 Family Workspace Features:</span>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
              <li><strong>Create Groups:</strong> Create groups like "Home Expenses" or "Trip 2026".</li>
              <li><strong>Instant Invite Links:</strong> Generate secure links to invite family members with 1 click.</li>
              <li><strong>Member Roles:</strong> Manage permissions with <em>Admin</em> (full management), <em>Moderator</em> (edit permissions), and <em>Member</em> (standard access).</li>
              <li><strong>Transparent Tracking:</strong> Every shared transaction highlights which member recorded it.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      title: '6. Security & Account Recovery',
      icon: ShieldCheck,
      color: '#3B82F6',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Your account security is protected with modern authentication:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700">
            <li><strong>Email OTP Verification:</strong> 6-digit codes verify your email upon registration and password reset.</li>
            <li><strong>Password Reset:</strong> Forgot your password? Request a 6-digit reset code to securely create a new one.</li>
            <li><strong>Forgot Username:</strong> Enter your registered email to instantly receive your username.</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-backdrop-fade">
      <div className="bg-white border border-slate-200/80 rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                RupeeTrack User Guide
              </h3>
              <span className="text-xs text-slate-400">Complete handbook and feature documentation</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tour CTA Banner */}
        <div className="p-4 sm:px-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 shrink-0 text-indigo-200" />
            <div>
              <span className="text-xs sm:text-sm font-bold block">Want a guided visual tour?</span>
              <span className="text-[11px] text-indigo-100 block">Take the 30-second interactive app walkthrough</span>
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
                      ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <span className="text-xs font-bold leading-tight line-clamp-1">{s.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Section Content Card */}
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
              {React.createElement(sections.find((s) => s.id === activeSection).icon, {
                className: 'w-5 h-5',
                style: { color: sections.find((s) => s.id === activeSection).color }
              })}
              <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                {sections.find((s) => s.id === activeSection).title}
              </h4>
            </div>
            <div>
              {sections.find((s) => s.id === activeSection).content}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 font-medium">RupeeTrack • Follow your spending</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
}
