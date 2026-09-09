import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Settings,
  Users,
  UserPlus,
  Crown,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Mail,
  Edit3,
  LogOut,
  AlertCircle,
  AtSign,
  UserCheck
} from 'lucide-react';
import { getAppBaseUrl, formatINR } from '../utils/formatters';

class ModalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('SplitGroupSettingsModal Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Unable to display settings</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">An unexpected error occurred while rendering the settings dialog.</p>
          <button
            type="button"
            onClick={this.props.onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500"
          >
            Close Settings
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SplitGroupSettingsModal({
  isOpen,
  onClose,
  group,
  currentUser,
  friends = [],
  onUpdateGroupName,
  onAddMember,
  onRemoveMember,
  onDeleteGroup
}) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'add_member' | 'invite' | 'general'
  const [groupNameInput, setGroupNameInput] = useState(group?.name || '');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameSuccess, setRenameSuccess] = useState(false);
  const [renameError, setRenameError] = useState('');

  // Add member state
  const [identifierInput, setIdentifierInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState('');
  const [addError, setAddError] = useState('');

  // Invite link state
  const [copied, setCopied] = useState(false);

  // Member management state
  const [loadingMemberId, setLoadingMemberId] = useState(null);

  // Delete group state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (group?.name) {
      setGroupNameInput(group.name);
    }
  }, [group?.name]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !group || !mounted || typeof document === 'undefined') return null;

  const currentUserId = currentUser ? String(currentUser.userId || currentUser._id || currentUser.id || '') : '';

  const rawMembers = Array.isArray(group.members)
    ? group.members
    : typeof group.members === 'string'
    ? (() => { try { return JSON.parse(group.members); } catch (e) { return []; } })()
    : [];

  const members = (Array.isArray(rawMembers) ? rawMembers : []).map((m, idx) => {
    if (!m) return null;
    if (typeof m === 'string') {
      return {
        userId: m,
        id: m,
        name: 'Member',
        username: 'member',
        role: 'member',
        netWithCurrentUser: 0
      };
    }
    const userId = String(m.userId || m.id || m._id || m.user_id || `member_${idx}`);
    const name = String(m.name || m.userName || m.user_name || m.username || 'Member');
    const username = String(m.username || m.userUsername || m.user_username || m.name || 'user');
    const isThisCreator = Boolean(group.createdBy && String(group.createdBy) === userId);
    const role = isThisCreator ? 'creator' : String(m.role || 'member');
    const netWithCurrentUser = Number(m.netWithCurrentUser || 0);
    return {
      ...m,
      userId,
      id: userId,
      name,
      username,
      role,
      netWithCurrentUser
    };
  }).filter(Boolean);

  const isCreator = Boolean(group.createdBy && String(group.createdBy) === currentUserId);

  const availableFriendsToAdd = (friends || []).filter(f => {
    const fId = String(f.friendId || f.userId || f.id);
    return fId && !members.some(m => String(m.userId) === fId);
  });

  const inviteToken = group.inviteToken || group.invite_token || '';
  const inviteUrl = inviteToken ? `${getAppBaseUrl()}/join-split/${inviteToken}` : '';

  // Handle Group Rename
  const handleRename = async (e) => {
    e.preventDefault();
    if (!groupNameInput.trim()) {
      setRenameError('Group name cannot be empty.');
      return;
    }
    try {
      setIsRenaming(true);
      setRenameError('');
      if (onUpdateGroupName) {
        await onUpdateGroupName(groupNameInput.trim());
      }
      setRenameSuccess(true);
      setTimeout(() => setRenameSuccess(false), 2500);
    } catch (err) {
      setRenameError(err.message || 'Failed to rename split group.');
    } finally {
      setIsRenaming(false);
    }
  };

  // Handle Add Member by Email, Username, or Friend
  const handleAddByIdentifier = async (identifier) => {
    const target = (typeof identifier === 'string' ? identifier : identifierInput).trim();
    if (!target) {
      setAddError('Please enter an email address or username.');
      return;
    }
    try {
      setIsAdding(true);
      setAddError('');
      setAddSuccess('');
      if (onAddMember) {
        const res = await onAddMember(target);
        setAddSuccess(res?.message || 'Member added to split group!');
      }
      setIdentifierInput('');
      setTimeout(() => setAddSuccess(''), 3500);
    } catch (err) {
      setAddError(err.message || 'Failed to add member.');
    } finally {
      setIsAdding(false);
    }
  };

  // Handle Copy Invite Link
  const handleCopyInvite = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Remove Member
  const handleRemove = async (targetUserId, targetName) => {
    const isSelf = targetUserId === currentUserId;
    const confirmMsg = isSelf
      ? 'Are you sure you want to leave this split group?'
      : `Are you sure you want to remove ${targetName} from the group?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setLoadingMemberId(targetUserId);
      if (onRemoveMember) {
        await onRemoveMember(targetUserId);
      }
      if (isSelf) {
        onClose();
      }
    } catch (err) {
      alert(err.message || 'Failed to remove member.');
    } finally {
      setLoadingMemberId(null);
    }
  };

  // Handle Delete Group
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      if (onDeleteGroup) {
        await onDeleteGroup(group.id || group._id);
      }
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to delete split group.');
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-backdrop-fade">
      {/* Click backdrop to close */}
      <div 
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md cursor-pointer" 
        onClick={onClose} 
      />

      <div className="relative z-10 bg-white dark:bg-[#111726] border-t sm:border border-slate-200/80 dark:border-slate-800 rounded-t-[32px] sm:rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden animate-modal-pop flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh]">
        <ModalErrorBoundary onClose={onClose}>
        
        {/* Mobile drag handle indicator */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Split Settings
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                {group.name} • {members.length} members
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto shrink-0 bg-slate-50/50 dark:bg-[#151C2E]">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'members'
                ? 'bg-white dark:bg-[#1E2638] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({members.length})</span>
          </button>

          {isCreator && (
            <button
              type="button"
              onClick={() => setActiveTab('add_member')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'add_member'
                  ? 'bg-white dark:bg-[#1E2638] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('invite')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'invite'
                ? 'bg-white dark:bg-[#1E2638] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Invite Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'general'
                ? 'bg-white dark:bg-[#1E2638] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Split Details</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: MEMBERS LIST & PAIRWISE BALANCES */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Group Members
                  </h4>
                  <span className="text-xs text-slate-400 dark:text-slate-400">
                    Balances and participants in this split group
                  </span>
                </div>
                {isCreator && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('add_member')}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Add Member</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {members.map((m) => {
                  const isSelf = String(m.userId) === currentUserId;
                  const isTargetCreator = Boolean(group.createdBy && String(group.createdBy) === String(m.userId));
                  const isBusy = loadingMemberId === m.userId;
                  const displayName = m.name || 'Member';
                  const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : 'M';
                  const displayUsername = m.username || 'user';
                  const mNet = Number(m.netWithCurrentUser || 0);

                  return (
                    <div
                      key={m.userId}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-black shadow-sm shrink-0 text-sm"
                          style={{ backgroundColor: m.avatarColor || '#6366F1' }}
                        >
                          {displayInitial}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate">
                            {displayName} {isSelf && <span className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold">(You)</span>}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-400 font-mono block truncate">
                            @{displayUsername}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {/* Role Tag */}
                        {isTargetCreator && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                            <Crown className="w-3 h-3" />
                            <span>Creator</span>
                          </span>
                        )}

                        {/* Pairwise balance for other members */}
                        {!isSelf && (
                          <div className="text-right">
                            <span className={`text-xs font-mono font-black block ${
                              mNet > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : mNet < 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-400 dark:text-slate-400'
                            }`}>
                              {mNet > 0
                                ? `+${formatINR(mNet)}`
                                : mNet < 0
                                ? `-${formatINR(Math.abs(mNet))}`
                                : 'Settled'}
                            </span>
                            <span className="text-[9px] text-slate-400 block">
                              {mNet > 0 ? 'owes you' : mNet < 0 ? 'you owe' : 'all clear'}
                            </span>
                          </div>
                        )}

                        {/* Creator remove member button */}
                        {isCreator && !isSelf && !isTargetCreator && (
                          <button
                            type="button"
                            onClick={() => handleRemove(m.userId, displayName)}
                            disabled={isBusy}
                            title="Remove from group"
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Non-creator leave group */}
                        {!isCreator && isSelf && (
                          <button
                            type="button"
                            onClick={() => handleRemove(m.userId, displayName)}
                            disabled={isBusy}
                            className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>Leave</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ADD MEMBER */}
          {activeTab === 'add_member' && (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Add Member to Split Group
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                  Directly add a user by their registered email address or @username.
                </p>
              </div>

              {addSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{addSuccess}</span>
                </div>
              )}

              {addError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{addError}</span>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleAddByIdentifier(); }} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    User Email or @Username
                  </label>
                  <div className="relative">
                    <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. friend@example.com or @john"
                      value={identifierInput}
                      onChange={(e) => setIdentifierInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1A2234] text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAdding}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  {isAdding ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Adding Member...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 stroke-[2.5]" />
                      <span>Add User to Split</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick Select from Friends */}
              {availableFriendsToAdd.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Or select from your Friends:
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {availableFriendsToAdd.map(f => {
                      const fId = String(f.friendId || f.userId || f.id);
                      return (
                        <div
                          key={fId}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0"
                              style={{ backgroundColor: f.avatarColor || '#6366F1' }}
                            >
                              {f.friendName ? f.friendName[0].toUpperCase() : 'F'}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                                {f.friendName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block truncate">
                                @{f.friendUsername || 'user'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddByIdentifier(fId)}
                            disabled={isAdding}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INVITE LINK */}
          {activeTab === 'invite' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Shareable Invite Link
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                  Anyone with this link can join your split group and collaborate on expenses.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SPLIT DETAILS & DANGER ZONE */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Rename Split Form */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Split Group Name
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                    {isCreator ? 'Change the display name of this split group' : 'Display name of this group'}
                  </p>
                </div>

                {renameSuccess && (
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Group name updated successfully!</span>
                  </div>
                )}

                {renameError && (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>{renameError}</span>
                  </div>
                )}

                <form onSubmit={handleRename} className="flex items-center gap-2">
                  <input
                    type="text"
                    disabled={!isCreator || isRenaming}
                    value={groupNameInput}
                    onChange={(e) => setGroupNameInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1A2234] text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  />
                  {isCreator && (
                    <button
                      type="submit"
                      disabled={isRenaming}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shrink-0 active:scale-95 disabled:opacity-50"
                    >
                      {isRenaming ? 'Saving...' : 'Save'}
                    </button>
                  )}
                </form>
              </div>

              {/* Danger Zone: Delete Split Group */}
              {isCreator && (
                <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                  <h4 className="text-sm font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Danger Zone</span>
                  </h4>
                  
                  <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 space-y-3">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Delete this Split Group
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Permanently delete this group and all its split transactions and settlements. This action cannot be undone.
                      </p>
                    </div>

                    {!showDeleteConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors active:scale-95 flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Split Group</span>
                      </button>
                    ) : (
                      <div className="p-3 rounded-xl bg-rose-100/70 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700 space-y-2.5">
                        <span className="text-xs font-black text-rose-900 dark:text-rose-200 block">
                          Are you completely sure you want to delete "{group.name}"?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                          >
                            {isDeleting ? 'Deleting...' : 'Yes, Delete Split'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        </ModalErrorBoundary>
      </div>
    </div>,
    document.body
  );
}
