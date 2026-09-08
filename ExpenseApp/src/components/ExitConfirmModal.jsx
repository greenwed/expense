import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X } from 'lucide-react';
import { useBackButton } from '../context/BackHandlerContext';

export default function ExitConfirmModal({ isOpen, onClose, onConfirmExit }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pressing back button while exit modal is open dismisses the dialog
  useBackButton(onClose, isOpen, 100);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Dialog Card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-[#131926] rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 text-center animate-scaleUp z-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500/10 via-rose-500/20 to-red-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-center mb-4 shadow-inner">
          <LogOut className="w-8 h-8 stroke-[2.2]" />
        </div>

        {/* Content */}
        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2">
          Exit RupeeTrack?
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed px-2">
          Are you sure you want to close the application? You can reopen anytime to continue tracking your expenses.
        </p>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#232D42] text-slate-700 dark:text-slate-200 font-bold text-xs transition-all border border-slate-200/60 dark:border-slate-700/60 active:scale-98"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmExit}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-500/25 transition-all active:scale-95"
          >
            Exit App
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
