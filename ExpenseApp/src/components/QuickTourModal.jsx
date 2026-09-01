import React, { useState } from 'react';
import {
  X,
  IndianRupee,
  TrendingUp,
  ArrowDownRight,
  Bell,
  Users,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

export default function QuickTourModal({ isOpen, onClose, onOpenUserGuide }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const tourSteps = [
    {
      id: 'welcome',
      icon: IndianRupee,
      iconBg: 'bg-gradient-to-tr from-violet-600 to-indigo-600',
      iconColor: 'text-white',
      badge: 'Step 1 of 5',
      title: 'Welcome to RupeeTrack',
      subtitle: 'Follow your spending with complete control',
      content: (
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          RupeeTrack brings all your personal and shared expenses into a single, clean workspace. Easily follow your <strong>Total Balance</strong>, <strong>Monthly Income</strong>, and <strong>Daily Expenses</strong> in real-time.
        </p>
      )
    },
    {
      id: 'tracking',
      icon: TrendingUp,
      iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-600',
      iconColor: 'text-white',
      badge: 'Step 2 of 5',
      title: 'Fast & Intuitive Tracking',
      subtitle: 'Record transactions in seconds',
      content: (
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Tap <strong>+ Income</strong> or <strong>+ Add Expense</strong> (or the mobile center <strong>+</strong> button) to log daily spending. Choose from smart categories like <em>Food, Shopping, Transport, Medical</em> and use quick-add chips for lightning-fast entry.
        </p>
      )
    },
    {
      id: 'budgets',
      icon: Bell,
      iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500',
      iconColor: 'text-white',
      badge: 'Step 3 of 5',
      title: 'Smart Budgets & Alerts',
      subtitle: 'Keep your finances on track',
      content: (
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Set your monthly budget limit under Settings. RupeeTrack automatically calculates your spending percentage and gives you visual amber warnings at <strong>80%</strong> and urgent alerts at <strong>100%</strong> to prevent overspending.
        </p>
      )
    },
    {
      id: 'family',
      icon: Users,
      iconBg: 'bg-gradient-to-tr from-pink-500 to-purple-600',
      iconColor: 'text-white',
      badge: 'Step 4 of 5',
      title: 'Collaborative Family Groups',
      subtitle: 'Track shared household expenses',
      content: (
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Switch to the <strong>Family</strong> tab to create shared groups, generate 1-click invite links, and track shared household bills together with <em>Admin, Moderator, and Member</em> roles.
        </p>
      )
    },
    {
      id: 'finish',
      icon: Sparkles,
      iconBg: 'bg-gradient-to-tr from-indigo-600 to-violet-600',
      iconColor: 'text-white',
      badge: 'Step 5 of 5',
      title: "You're All Set! 🎉",
      subtitle: 'Ready to follow your spending',
      content: (
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            You're ready to master your money! Start recording your incomes and daily expenses today.
          </p>
          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-950 flex items-start gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="block text-indigo-900 font-bold mb-0.5">Need help or more details?</strong>
              <span>For comprehensive guides, tips, and feature walkthroughs at any time, find the <strong>User Guide</strong> under <strong>Settings</strong>!</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const current = tourSteps[currentStep];
  const isLast = currentStep === tourSteps.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('rupeetrack_tour_completed', 'true');
    } catch (e) {
      console.warn('Could not save tour completion to localStorage', e);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-backdrop-fade">
      <div className="bg-white border border-slate-200/80 rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-modal-pop">
        
        {/* Header with Step Badge & Skip Button */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
            {current.badge}
          </span>
          <button
            type="button"
            onClick={handleComplete}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Skip Tour
          </button>
        </div>

        {/* Step Body */}
        <div className="p-6 pt-2 text-center space-y-4">
          
          {/* Animated Glowing Icon Badge */}
          <div className="flex justify-center">
            <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-3xl ${current.iconBg} ${current.iconColor} flex items-center justify-center shadow-xl shadow-indigo-500/20 border-4 border-white transition-all`}>
              {React.createElement(current.icon, {
                className: 'w-9 h-9 sm:w-10 sm:h-10 stroke-[2.5]'
              })}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {current.title}
            </h3>
            <span className="text-xs font-semibold text-slate-400 block">
              {current.subtitle}
            </span>
          </div>

          <div className="text-left bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
            {current.content}
          </div>

        </div>

        {/* Step Dots & Navigation Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          
          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {tourSteps.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentStep === idx
                    ? 'w-6 bg-indigo-600'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                title="Previous step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span>{isLast ? 'Get Started' : 'Next'}</span>
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
