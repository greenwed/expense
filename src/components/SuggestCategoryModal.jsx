import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle, Check, Send, Lightbulb } from "lucide-react";
import { useCategories } from "../context/CategoryContext";
import { useBackButton } from "../context/BackHandlerContext";

export default function SuggestCategoryModal({
  isOpen,
  onClose,
  groupId,
  groupType = "family",
  groupName = "",
  onSuggested
}) {
  const { submitCategorySuggestion, globalCategories, getCustomCategories } = useCategories();
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setReason("");
      setError("");
      setSuccess(false);
    }
  }, [isOpen]);

  useBackButton(() => {
    onClose();
    return true;
  }, isOpen, 35);

  if (!isOpen) return null;

  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  const globalMatch = (globalCategories || []).find(c => c.name.toLowerCase() === lower);
  const groupCustoms = getCustomCategories ? getCustomCategories(groupId) : [];
  const customMatch = groupCustoms.find(c => c.name.toLowerCase() === lower);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!trimmed) {
      setError("Please enter a category name.");
      return;
    }
    if (globalMatch) {
      setError(`"${globalMatch.name}" is already a global category available in all groups.`);
      return;
    }
    if (customMatch) {
      setError(`Category "${customMatch.name}" is already present in this group.`);
      return;
    }

    try {
      setLoading(true);
      await submitCategorySuggestion({
        groupId,
        isSplit: groupType === "split",
        name: trimmed,
        reason: reason.trim()
      });
      setSuccess(true);
      if (onSuggested) onSuggested();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to submit category suggestion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-backdrop-fade">
      <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-modal-pop">
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Suggest Category
            </h3>
            <span className="text-xs text-slate-400">
              Submit a category request to the group admin for {groupName || "this group"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Suggestion submitted! Admin will review your request.</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {globalMatch && (
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-medium flex items-start gap-2">
              <Lightbulb className="w-4 h-4 shrink-0 text-sky-500 mt-0.5" />
              <div>
                <span className="font-bold">Global Category available:</span> "{globalMatch.name}" is already available in all groups and expenses. You can use it right away!
              </div>
            </div>
          )}

          {customMatch && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <span className="font-bold">Already exists:</span> "{customMatch.name}" is already an active category in this group.
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Suggested Category Name *
            </label>
            <input
              type="text"
              required
              maxLength={50}
              placeholder="e.g. WiFi Bill, Milk Subscription, Tennis Club"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#1E2638] transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Reason / Note (Optional)
            </label>
            <textarea
              rows={3}
              maxLength={200}
              placeholder="Why should this category be added to the group?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#1E2638] transition-colors resize-none"
            />
            <span className="text-[10px] text-slate-400 block text-right mt-1">
              {reason.length}/200
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !trimmed || Boolean(globalMatch) || Boolean(customMatch)}
              className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Suggestion</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
