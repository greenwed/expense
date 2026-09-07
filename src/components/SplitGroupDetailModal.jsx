import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Users,
  Plus,
  Receipt,
  Share2,
  Copy,
  Check,
  Trash2,
  Pencil,
  UserPlus,
  UserMinus,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, CATEGORY_CONFIG, getAppBaseUrl } from '../utils/formatters';

export default function SplitGroupDetailModal({
  isOpen,
  onClose,
  group,
  friends = [],
  onOpenAddExpense,
  onOpenEditExpense,
  onOpenSettleUp,
  onExpenseDeleted,
  onGroupUpdated,
  onGroupDeleted
}) {
  const { apiFetch, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [groupDetails, setGroupDetails] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Group Creator Management States
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentUserId = String(user?._id || user?.id || '');
  const isCreator = String(groupDetails?.createdBy || group?.createdBy) === currentUserId;

  const loadGroupDetails = async () => {
    if (!group) return;
    const gId = group.id || group._id;
    try {
      setLoading(true);
      setError('');
      const data = await apiFetch(`/api/split/groups/${gId}`);
      setGroupDetails(data?.group);
      setExpenses(data?.expenses || []);
      setSettlements(data?.settlements || []);
    } catch (err) {
      setError(err.message || 'Error loading group details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && group) {
      loadGroupDetails();
      setIsEditingName(false);
      setIsAddingMember(false);
    }
  }, [isOpen, group]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const inviteLink = typeof window !== 'undefined' && groupDetails?.inviteToken
    ? `${getAppBaseUrl()}/join-split/${groupDetails.inviteToken}`
    : '';

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Group Creator: Edit Group Name
  const handleStartEditName = () => {
    setEditedName(groupDetails?.name || group?.name || '');
    setIsEditingName(true);
  };

  const handleSaveGroupName = async () => {
    if (!editedName.trim()) return;
    try {
      const gId = groupDetails?.id || group?.id || group?._id;
      const data = await apiFetch(`/api/split/groups/${gId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editedName.trim() })
      });
      setGroupDetails(prev => ({ ...prev, name: editedName.trim() }));
      setIsEditingName(false);
      if (onGroupUpdated) onGroupUpdated(data?.group);
    } catch (err) {
      setError(err.message || 'Failed to update group name');
    }
  };

  // Group Creator: Add member from user friends
  const availableFriendsToAdd = useMemo(() => {
    const memberIds = new Set((groupDetails?.members || []).map(m => String(m.userId)));
    return (friends || []).filter(f => {
      const fId = String(f.friendId || f.userId || f.id);
      return fId && !memberIds.has(fId);
    });
  }, [friends, groupDetails?.members]);

  const handleAddMember = async (friendId) => {
    try {
      const gId = groupDetails?.id || group?.id || group?._id;
      await apiFetch(`/api/split/groups/${gId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId: friendId })
      });
      setIsAddingMember(false);
      await loadGroupDetails();
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      setError(err.message || 'Failed to add member to group');
    }
  };

  // Group Creator: Remove member
  const handleRemoveMember = async (memberUserId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this group?`)) return;
    try {
      const gId = groupDetails?.id || group?.id || group?._id;
      await apiFetch(`/api/split/groups/${gId}/members/${memberUserId}`, {
        method: 'DELETE'
      });
      await loadGroupDetails();
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    }
  };

  // Group Creator: Delete group
  const handleDeleteGroup = async () => {
    const gName = groupDetails?.name || group?.name || 'this group';
    if (!window.confirm(`Are you sure you want to delete "${gName}"? All expenses and settlements in this group will be deleted.`)) {
      return;
    }
    try {
      const gId = groupDetails?.id || group?.id || group?._id;
      await apiFetch(`/api/split/groups/${gId}`, { method: 'DELETE' });
      if (onGroupDeleted) onGroupDeleted(gId);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete group');
    }
  };

  // Expense Creator: Delete expense
  const handleDeleteExpense = async (expId) => {
    if (!window.confirm('Are you sure you want to delete this split expense?')) return;
    try {
      await apiFetch(`/api/split/expenses/${expId}`, { method: 'DELETE' });
      setExpenses(prev => prev.filter(e => e.id !== expId && e._id !== expId));
      loadGroupDetails();
      if (onExpenseDeleted) onExpenseDeleted();
    } catch (err) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  const netBal = groupDetails?.userNetBalance || 0;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-backdrop-fade">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-700/80 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center shadow-sm shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="px-2.5 py-1 text-sm font-bold rounded-xl bg-slate-100 dark:bg-[#1A2234] border border-indigo-500/50 text-slate-900 dark:text-white focus:outline-none w-full"
                    autoFocus
                    placeholder="Group name..."
                  />
                  <button
                    type="button"
                    onClick={handleSaveGroupName}
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
                    title="Save name"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                    {groupDetails?.name || group?.name || 'Split Group'}
                  </h3>
                  {isCreator && (
                    <button
                      type="button"
                      onClick={handleStartEditName}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
                      title="Edit group name (Creator only)"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              <span className="text-xs text-slate-400 dark:text-slate-400 block">
                {(groupDetails?.members || []).length} members {isCreator ? '• Creator' : ''}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Group Balance & Total Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-0.5">
                Total Group Spending
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                ₹{(groupDetails?.totalSpent || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block mb-0.5">
                Your Balance
              </span>
              <span className={`text-base font-black ${
                netBal > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : netBal < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {netBal > 0 ? `+₹${netBal.toFixed(2)} (owed)` : netBal < 0 ? `-₹${Math.abs(netBal).toFixed(2)} (owe)` : 'Settled Up'}
              </span>
            </div>
          </div>

          {/* Group Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenAddExpense) onOpenAddExpense(group.id || group._id);
              }}
              className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-indigo-500 dark:to-cyan-500 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/25 active:scale-98 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Expense</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenSettleUp) onOpenSettleUp();
              }}
              className="py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-98 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Settle Up</span>
            </button>
          </div>

          {/* Group Invite Link */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Group Invite Link</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Share with members</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                {inviteLink || 'Loading link...'}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all flex items-center gap-1 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Members List with Individual Balances */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Members & Balances
              </h4>
              {isCreator && (
                <button
                  type="button"
                  onClick={() => setIsAddingMember(prev => !prev)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isAddingMember ? 'Cancel' : '+ Add Member'}</span>
                </button>
              )}
            </div>

            {/* Creator inline friend picker to add member */}
            {isCreator && isAddingMember && (
              <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50 space-y-2 animate-fadeIn">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  Add a friend to this group:
                </span>
                {availableFriendsToAdd.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    All your friends are already in this group! Use the invite link above to invite new friends.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {availableFriendsToAdd.map(f => {
                      const fId = String(f.friendId || f.userId || f.id);
                      return (
                        <div
                          key={fId}
                          className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#111726] border border-slate-200/60 dark:border-slate-800"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-6 h-6 rounded-lg text-white font-bold text-[10px] flex items-center justify-center shrink-0"
                              style={{ backgroundColor: f.avatarColor || '#6366F1' }}
                            >
                              {f.friendName ? f.friendName[0].toUpperCase() : 'F'}
                            </div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {f.friendName || f.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddMember(fId)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              {(groupDetails?.members || []).map(m => {
                const mId = String(m.userId);
                const isSelf = mId === currentUserId;
                const mNet = m.netWithCurrentUser || 0;

                return (
                  <div
                    key={mId}
                    className="p-3 rounded-2xl bg-slate-50/70 dark:bg-[#1A2234] border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0"
                        style={{ backgroundColor: m.avatarColor || '#6366F1' }}
                      >
                        {m.name ? m.name[0].toUpperCase() : 'M'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                          {m.name} {isSelf ? '(You)' : ''}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">
                          @{m.username || 'member'} • {m.role || 'member'}
                        </span>
                      </div>
                    </div>

                    {!isSelf && (
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className={`text-xs font-black font-mono block ${
                            mNet > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : mNet < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-400 dark:text-slate-400'
                          }`}>
                            {mNet > 0 ? `owes you ₹${mNet.toFixed(2)}` : mNet < 0 ? `you owe ₹${Math.abs(mNet).toFixed(2)}` : 'settled'}
                          </span>
                        </div>
                        {isCreator && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(mId, m.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            title={`Remove ${m.name} from group`}
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group Expenses List */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Expenses ({expenses.length})
              </h4>
            </div>

            {expenses.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No expenses recorded in this group yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {expenses.map(e => {
                  const eId = e.id || e._id;
                  const isPayer = String(e.payerId) === currentUserId;
                  const myShare = (e.participants || []).find(p => String(p.userId) === currentUserId)?.shareAmount || 0;
                  // Strictly check if current user created this expense
                  const canModifyExpense = String(e.createdBy || e.payerId) === currentUserId;

                  return (
                    <div
                      key={eId}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {e.description}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-semibold">
                            {e.category}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {isPayer ? 'You' : e.payerName} paid ₹{Number(e.amount).toLocaleString('en-IN')} • {formatDateTime(e.date || e.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 dark:text-white block">
                            ₹{Number(e.amount).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {myShare > 0 ? `Your share: ₹${myShare}` : 'Not involved'}
                          </span>
                        </div>

                        {/* ONLY the user who created this expense can edit or delete it */}
                        {canModifyExpense && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                if (onOpenEditExpense) onOpenEditExpense(e);
                              }}
                              className="p-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Edit expense (Creator only)"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(eId)}
                              className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete expense (Creator only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Delete Group (Group Creator Only) */}
          {isCreator && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={handleDeleteGroup}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Group</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
