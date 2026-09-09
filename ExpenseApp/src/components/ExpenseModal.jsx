import React, { useState, useEffect } from 'react';
import { X, Clock, Check, Plus, Pencil } from 'lucide-react';
import { useCategories } from '../context/CategoryContext';
import AddCategoryModal from './AddCategoryModal';

export default function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  title = 'Add Expense',
  groupId = null,
  groupName = null
}) {
  const { getCategoryList, getCustomCategories, getCategoryMeta, fetchGroupCategories, globalCategories, standardCategories } = useCategories();
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && groupId) {
      fetchGroupCategories(groupId);
    }
  }, [isOpen, groupId, fetchGroupCategories]);

  const activeCategories = getCategoryList(groupId);
  const activeCustomCategories = getCustomCategories(groupId);

  useEffect(() => {
    if (initialData) {
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setCategory(initialData.category || 'Food & Dining');
      setDescription(initialData.description || '');
      if (initialData.date) {
        const d = new Date(initialData.date);
        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setDateTime(localIso);
      } else {
        setNow();
      }
    } else {
      setAmount('');
      setCategory('Food & Dining');
      setDescription('');
      setNow();
    }
    setError('');
  }, [initialData, isOpen]);

  const setNow = () => {
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setDateTime(localIso);
  };

  const handleAddPreset = (val) => {
    const current = Number(amount) || 0;
    setAmount(String(current + val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!description || description.trim().length === 0) {
      setError('Description is mandatory.');
      return;
    }

    if (!dateTime) {
      setError('Please select a date and time.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        amount: numAmount,
        category,
        description: description.trim(),
        date: new Date(dateTime).toISOString()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save expense entry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md animate-backdrop-fade">
      <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{title}</h3>
            <span className="text-xs text-slate-400 dark:text-slate-400">Record an expense entry</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Expense Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-600 dark:text-indigo-400 font-extrabold text-xl">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-xl font-black focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#1E2638] transition-all shadow-inner"
                autoFocus
              />
            </div>
            {/* Quick Add Chips */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
              <span className="text-[11px] text-slate-400 dark:text-slate-400 font-semibold shrink-0">Quick add:</span>
              {[100, 500, 1000, 2000].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleAddPreset(val)}
                  className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#222C42] text-slate-700 dark:text-slate-200 font-bold transition-colors border border-transparent dark:border-slate-700/60"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Category *
              </label>
              <div className="flex items-center gap-2">
                {getCategoryMeta(category, groupId).isCustom && (
                  <button
                    type="button"
                    onClick={() => {
                      const customMatch = activeCustomCategories.find(c => c.name.toLowerCase() === category.toLowerCase());
                      if (customMatch) {
                        setCategoryToEdit(customMatch);
                        setIsAddCatOpen(true);
                      }
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
                    title="Edit selected category"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit "{category}"</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCategoryToEdit(null);
                    setIsAddCatOpen(true);
                  }}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Category</span>
                </button>
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto p-1 space-y-3">
              {/* Custom Categories Section */}
              {activeCustomCategories.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 px-1">
                    {groupId ? "👥 Group Custom Categories" : "👤 My Custom Categories"}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {activeCustomCategories.map((c) => {
                      const conf = getCategoryMeta(c.name, groupId);
                      const Icon = conf.IconComponent;
                      const isSelected = category.toLowerCase() === c.name.toLowerCase();
                      return (
                        <button
                          type="button"
                          key={c.id || c.name}
                          onClick={() => setCategory(c.name)}
                          className={`py-2 px-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            isSelected
                              ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-500/20'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#1A2234] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#222C42]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: conf.color }} />
                          <span className="truncate">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Global Default Categories */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 px-1">
                  📌 Global Categories
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(globalCategories || []).map((catObj) => {
                    const cat = catObj.name;
                    const conf = getCategoryMeta(cat, groupId);
                    const Icon = conf.IconComponent;
                    const isSelected = category.toLowerCase() === cat.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`py-2 px-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-[#1A2234] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#222C42]'
                        }`}
                      >
                        <span className="text-sm shrink-0">{catObj.emoji}</span>
                        <span className="truncate">{cat}</span>
                      </button>
                    );
                  })}

                  {/* Add New Category Chip */}
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryToEdit(null);
                      setIsAddCatOpen(true);
                    }}
                    className="py-2 px-2.5 rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">+ New</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description (Mandatory) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Weekly grocery, Metro card recharge"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#1E2638] transition-colors"
            />
          </div>

          {/* Date & Time Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Date & Time *
              </label>
              <button
                type="button"
                onClick={setNow}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Use Current Time</span>
              </button>
            </div>
            <input
              type="datetime-local"
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#1E2638] transition-colors cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-indigo-500 dark:to-cyan-500 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{submitting ? 'Saving...' : initialData ? 'Update Entry' : 'Save Entry'}</span>
            </button>
          </div>
        </form>
      </div>

      <AddCategoryModal
        isOpen={isAddCatOpen}
        categoryToEdit={categoryToEdit}
        groupId={groupId}
        groupName={groupName}
        onSelectCategory={(catName) => setCategory(catName)}
        onClose={() => {
          setIsAddCatOpen(false);
          setCategoryToEdit(null);
        }}
        onCreated={(newCat) => {
          if (newCat && newCat.name) {
            setCategory(newCat.name);
          }
        }}
        onUpdated={(updatedCat) => {
          if (updatedCat && updatedCat.name) {
            setCategory(updatedCat.name);
          }
        }}
        onDeleted={() => {
          setCategory('Food & Dining');
        }}
      />
    </div>
  );
}
