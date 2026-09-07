import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Check, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CreateSplitGroupModal({
  isOpen,
  onClose,
  onGroupCreated,
  friends = []
}) {
  const { apiFetch, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedFriendIds([]);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const toggleFriend = (friendId) => {
    setSelectedFriendIds(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a split group name.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const selectedFriends = friends
        .filter(f => selectedFriendIds.includes(String(f.friendId || f.userId || f.id)))
        .map(f => ({
          userId: String(f.friendId || f.userId || f.id),
          name: f.friendName || f.name,
          username: f.friendUsername || f.username,
          avatarColor: f.avatarColor
        }));

      const data = await apiFetch('/api/split/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          members: selectedFriends
        })
      });

      if (onGroupCreated) onGroupCreated(data?.group);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create split group.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-backdrop-fade">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Create Split Group
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-400">
                Apartment, Trip, Dinner & more
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Group Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Trip to Goa, Apartment 402, Team Lunch"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              required
            />
          </div>

          {/* Members / Friends selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Add Members ({selectedFriendIds.length + 1})
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-400">
                You are automatically added
              </span>
            </div>

            {/* Current user pill */}
            <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    {user?.name || 'You'} <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold">(Creator)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">@{user?.username || 'you'}</span>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </div>

            {/* Friends selection list */}
            {friends.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200/60 dark:border-slate-700/60 text-center space-y-1.5">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  No friends added yet
                </p>
                <p className="text-[11px] text-slate-400">
                  You can create this group now and invite friends using the group invite link anytime!
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {friends.map(f => {
                  const fId = String(f.friendId || f.userId || f.id);
                  const isChecked = selectedFriendIds.includes(fId);

                  return (
                    <button
                      key={fId}
                      type="button"
                      onClick={() => toggleFriend(fId)}
                      className={`w-full p-2.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all border ${
                        isChecked
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600'
                          : 'bg-slate-50/70 dark:bg-[#1A2234] hover:bg-slate-100 dark:hover:bg-[#222C42] border-slate-200/60 dark:border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: f.avatarColor || '#6366F1' }}
                        >
                          {f.friendName ? f.friendName[0].toUpperCase() : 'F'}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                            {f.friendName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            @{f.friendUsername || 'friend'}
                          </span>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                        isChecked
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{loading ? 'Creating Group...' : 'Create Split Group'}</span>
          </button>
        </form>

      </div>
    </div>,
    document.body
  );
}
