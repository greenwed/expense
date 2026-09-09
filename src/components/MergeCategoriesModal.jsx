import React, { useState, useEffect } from "react";
import { X, GitMerge, AlertTriangle, Check, ArrowRight, AlertCircle } from "lucide-react";
import { useCategories } from "../context/CategoryContext";
import { useBackButton } from "../context/BackHandlerContext";

export default function MergeCategoriesModal({
  isOpen,
  onClose,
  groupId,
  groupType = "family",
  groupName = "",
  onMerged
}) {
  const { mergeCategories, getCategoryList, getCustomCategories } = useCategories();
  const [sourceCategory, setSourceCategory] = useState("");
  const [targetCategory, setTargetCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const allCategories = getCategoryList ? getCategoryList(groupId) : [];
  const customCategories = getCustomCategories ? getCustomCategories(groupId) : [];
  const customNames = customCategories.map(c => c.name);

  useEffect(() => {
    if (isOpen) {
      setSourceCategory("");
      setTargetCategory("");
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  useBackButton(() => {
    onClose();
    return true;
  }, isOpen, 35);

  if (!isOpen) return null;

  const handleMerge = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!sourceCategory || !targetCategory) {
      setError("Please select both source and target categories.");
      return;
    }
    if (sourceCategory.toLowerCase() === targetCategory.toLowerCase()) {
      setError("Source and target categories cannot be the same.");
      return;
    }

    try {
      setLoading(true);
      const res = await mergeCategories({
        groupId,
        isSplit: groupType === "split",
        sourceCategory,
        targetCategory
      });
      setSuccess(res?.message || `Successfully merged "${sourceCategory}" into "${targetCategory}".`);
      if (onMerged) onMerged();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to merge categories.");
    } finally {
      setLoading(false);
    }
  };

  const isSourceCustom = customNames.some(n => n.toLowerCase() === sourceCategory.toLowerCase());

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-backdrop-fade">
      <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Merge Categories
            </h3>
            <span className="text-xs text-slate-400">
              Consolidate duplicate categories in {groupName || "this group"}
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

        {/* Form */}
        <form onSubmit={handleMerge} className="p-6 space-y-4">
          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Source Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Source Category (To be merged & removed) *
            </label>
            <select
              value={sourceCategory}
              onChange={(e) => setSourceCategory(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#1E2638] transition-colors"
            >
              <option value="">-- Select Source Category --</option>
              {allCategories.map((cat) => (
                <option key={`src-${cat}`} value={cat} disabled={cat === targetCategory}>
                  {cat} {customNames.includes(cat) ? "(Custom)" : "(Global)"}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Target Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Target Category (Will keep) *
            </label>
            <select
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#1E2638] transition-colors"
            >
              <option value="">-- Select Target Category --</option>
              {allCategories.map((cat) => (
                <option key={`tgt-${cat}`} value={cat} disabled={cat === sourceCategory}>
                  {cat} {customNames.includes(cat) ? "(Custom)" : "(Global)"}
                </option>
              ))}
            </select>
          </div>

          {/* Impact Warning */}
          {sourceCategory && targetCategory && sourceCategory !== targetCategory && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Merge Impact Summary</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900/80 dark:text-amber-200/80">
                <li>All historical transactions in this group tagged as <strong>"{sourceCategory}"</strong> will be renamed to <strong>"{targetCategory}"</strong>.</li>
                {isSourceCustom ? (
                  <li>Custom category <strong>"{sourceCategory}"</strong> will be permanently deleted from this group.</li>
                ) : (
                  <li>"{sourceCategory}" is a global default category and will remain available for future use.</li>
                )}
                <li>This action is irreversible.</li>
              </ul>
            </div>
          )}

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
              disabled={loading || !sourceCategory || !targetCategory || sourceCategory === targetCategory}
              className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <GitMerge className="w-4 h-4" />
                  <span>Merge Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
