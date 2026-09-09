import React, { useState, useEffect } from "react";
import { X, Plus, Sparkles, Check, Pencil, Trash2, AlertCircle, AlertTriangle, Lightbulb } from "lucide-react";
import { useCategories } from "../context/CategoryContext";
import { useBackButton } from "../context/BackHandlerContext";
import { CATEGORY_PALETTE, CATEGORY_ICONS } from "../utils/formatters";

export default function AddCategoryModal({
  isOpen,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
  categoryToEdit = null,
  groupId = null,
  groupName = null,
  isSplit = false,
  onSelectCategory = null
}) {
  const {
    addCategory,
    updateCategory,
    deleteCategory,
    iconComponents,
    globalCategories,
    getCustomCategories,
    groupCategoriesMap
  } = useCategories();

  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(CATEGORY_PALETTE[0]);
  const [selectedIcon, setSelectedIcon] = useState("Tag");
  const [customHex, setCustomHex] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name || "");
      setSelectedColor(categoryToEdit.color || CATEGORY_PALETTE[0]);
      setSelectedIcon(categoryToEdit.icon || "Tag");
      setCustomHex(categoryToEdit.color || "");
    } else {
      setName("");
      setSelectedColor(CATEGORY_PALETTE[0]);
      setSelectedIcon("Tag");
      setCustomHex("");
    }
    setError("");
  }, [categoryToEdit, isOpen]);

  // Pressing back button closes this modal first
  useBackButton(() => {
    onClose();
    return true;
  }, isOpen, 30);

  if (!isOpen) return null;

  const activeColor = customHex && /^#[0-9A-F]{6}$/i.test(customHex) ? customHex : selectedColor;
  const PreviewIcon = iconComponents[selectedIcon] || iconComponents.Tag;

  // Group custom categories check & 20-cap
  const groupCustoms = groupId
    ? (groupCategoriesMap[groupId] || (getCustomCategories ? getCustomCategories(groupId) : []))
    : [];
  const customCount = groupCustoms.length;
  const isCapReached = Boolean(groupId) && !categoryToEdit && customCount >= 20;

  // Duplicate and Smart Search checks
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  const exactGlobal = (globalCategories || []).find(c => c.name.toLowerCase() === lower);
  const exactCustom = (categoryToEdit ? [] : groupCustoms).find(c => c.name.toLowerCase() === lower);

  const similarMatch = (!exactGlobal && !exactCustom && lower.length >= 3)
    ? ((globalCategories || []).find(c => {
        const cLower = c.name.toLowerCase();
        return cLower.includes(lower) || (lower.length >= 4 && lower.includes(cLower));
      }) ||
      groupCustoms.find(c => {
        const cLower = c.name.toLowerCase();
        return cLower.includes(lower) || (lower.length >= 4 && lower.includes(cLower));
      }))
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!trimmed) {
      setError("Please enter a category name.");
      return;
    }

    if (exactGlobal) {
      setError(`"${exactGlobal.name}" is already a global default category.`);
      return;
    }

    if (exactCustom) {
      setError(`Category "${exactCustom.name}" already exists in this group.`);
      return;
    }

    if (isCapReached) {
      setError("Maximum limit of 20 custom categories reached for this group.");
      return;
    }

    try {
      setLoading(true);
      if (categoryToEdit) {
        const catId = categoryToEdit.id || categoryToEdit._id;
        const updated = await updateCategory(catId, {
          name: trimmed,
          color: activeColor,
          icon: selectedIcon,
          groupId,
          isSplit
        });
        if (onUpdated) onUpdated(updated);
      } else {
        const newCat = await addCategory({
          name: trimmed,
          color: activeColor,
          icon: selectedIcon,
          groupId,
          isSplit
        });
        if (onCreated) onCreated(newCat);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save category.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToEdit) return;
    const catId = categoryToEdit.id || categoryToEdit._id;
    const confirmMsg = `Are you sure you want to delete category "${categoryToEdit.name}"?\n\nAny existing expenses tagged with this category will be re-assigned to "Others".`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setDeleting(true);
      await deleteCategory(catId, groupId, isSplit);
      if (onDeleted) onDeleted(catId);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to delete category.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-backdrop-fade">
      <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                {categoryToEdit ? (
                  <>
                    <Pencil className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    {groupId ? "Edit Group Category" : "Edit Category"}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    {groupId ? `New Category for ${groupName || "Group"}` : "New Category"}
                  </>
                )}
              </h3>
              {groupId && !categoryToEdit && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  customCount >= 20
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}>
                  {customCount}/20
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">
              {groupId
                ? "Shared with all members of this group (Capped at 20)"
                : (categoryToEdit ? "Modify category name, color or icon" : "Create a private custom category for your personal expenses")}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isCapReached && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold">20 Category Limit Reached:</span> This group has reached the limit of 20 custom categories. Please merge or delete existing categories to add a new one.
              </div>
            </div>
          )}

          {exactGlobal && (
            <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200 text-xs flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
                <div>
                  <span className="font-bold">Global Category:</span> "{exactGlobal.name}" is already available everywhere.
                </div>
              </div>
              {onSelectCategory && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory(exactGlobal.name);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-bold text-[11px] shrink-0 hover:bg-sky-500 transition-colors"
                >
                  Use This
                </button>
              )}
            </div>
          )}

          {similarMatch && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <span className="font-bold">Did you mean:</span> "{similarMatch.name}"? A similar category already exists.
                </div>
              </div>
              {onSelectCategory && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory(similarMatch.name);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] shrink-0 hover:bg-amber-500 transition-colors"
                >
                  Use Existing
                </button>
              )}
            </div>
          )}

          {/* Preview Badge */}
          <div className="flex items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white dark:bg-[#111726] shadow-sm border border-slate-200 dark:border-slate-700/80">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm transition-colors"
                style={{ backgroundColor: activeColor }}
              >
                <PreviewIcon className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {trimmed || "Category Name"}
              </span>
            </div>
          </div>

          {/* Category Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              required
              maxLength={50}
              placeholder="e.g. Badminton, Netflix, Cleaning"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#1E2638] transition-colors"
              autoFocus
            />
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Color Theme *
            </label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {CATEGORY_PALETTE.map((color) => {
                const isSelected = activeColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    type="button"
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      setCustomHex("");
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                      isSelected ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
            {/* Custom Color Input */}
            <div className="flex items-center gap-2 mt-2">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 shadow-inner">
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    setSelectedColor(e.target.value);
                  }}
                  className="absolute inset-0 w-12 h-12 -top-2 -left-2 cursor-pointer border-0"
                />
              </div>
              <input
                type="text"
                placeholder="#HEX code (e.g. #6366F1)"
                maxLength={7}
                value={customHex}
                onChange={(e) => {
                  setCustomHex(e.target.value);
                  if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    setSelectedColor(e.target.value);
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Select Icon *
            </label>
            <div className="grid grid-cols-7 gap-2 max-h-32 overflow-y-auto p-1 bg-slate-50/50 dark:bg-[#1A2234]/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              {CATEGORY_ICONS.map((iconKey) => {
                const IconComp = iconComponents[iconKey] || iconComponents.Tag;
                const isSelected = selectedIcon === iconKey;
                return (
                  <button
                    type="button"
                    key={iconKey}
                    onClick={() => setSelectedIcon(iconKey)}
                    className={`h-9 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm scale-105"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                    title={iconKey}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {categoryToEdit ? (
              <>
                <button
                  type="button"
                  disabled={loading || deleting}
                  onClick={handleDelete}
                  className="py-3 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-rose-200 dark:border-rose-900/40 disabled:opacity-50"
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deleting ? "Deleting..." : "Delete"}</span>
                </button>
                <button
                  type="submit"
                  disabled={loading || deleting || !trimmed}
                  className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !trimmed || isCapReached || Boolean(exactGlobal) || Boolean(exactCustom)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Category</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
