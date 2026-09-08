import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Settings,
  Users,
  UserPlus,
  Crown,
  Shield,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Mail,
  Edit3,
  LogOut,
  AlertCircle
} from 'lucide-react';

export default function FamilyGroupSettingsModal({
  isOpen,
  onClose,
  group,
  currentUser,
  onUpdateGroupName,
  onAddMemberByEmail,
  onUpdateRole,
  onRemoveMember,
  onRegenerateToken,
  onDeleteGroup
}) {
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'add_email' | 'invite' | 'general'
  const [groupNameInput, setGroupNameInput] = useState(group?.name || '');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameSuccess, setRenameSuccess] = useState(false);
  const [renameError, setRenameError] = useState('');

  // Add member by email state
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState('member');
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  // Invite link state
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Member management state
  const [loadingMemberId, setLoadingMemberId] = useState(null);

  // Delete group state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !group) return null;

  const currentUserId = String(currentUser?._id || currentUser?.id);
  const members = group.members || [];
  const currentMember = members.find(m => String(m.userId) === currentUserId);
  const isAdmin = currentMember?.role === 'admin';
  const isCreator = String(group.createdBy) === currentUserId;

  const inviteUrl = `${window.location.origin}/family/join/${group.inviteToken}`;

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
      await onUpdateGroupName(groupNameInput.trim());
      setRenameSuccess(true);
      setTimeout(() => setRenameSuccess(false), 2500);
    } catch (err) {
      setRenameError(err.message || 'Failed to rename group.');
    } finally {
      setIsRenaming(false);
    }
  };

  // Handle Add Member by Email
  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    try {
      setIsAddingEmail(true);
      setEmailError('');
      setEmailSuccess('');
      const res = await onAddMemberByEmail(emailInput.trim(), roleInput);
      setEmailSuccess(res?.message || 'Member added successfully!');
      setEmailInput('');
      setTimeout(() => setEmailSuccess(''), 3500);
    } catch (err) {
      setEmailError(err.message || 'Failed to add member.');
    } finally {
      setIsAddingEmail(false);
    }
  };

  // Handle Copy Invite Link
  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Regenerate Token
  const handleRegenToken = async () => {
    if (!window.confirm('Regenerating will invalidate the previous invite link. Continue?')) {
      return;
    }
    try {
      setIsRegenerating(true);
      await onRegenerateToken();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle Role Change
  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      setLoadingMemberId(targetUserId);
      await onUpdateRole(targetUserId, newRole);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMemberId(null);
    }
  };

  // Handle Remove Member
  const handleRemove = async (targetUserId, targetName) => {
    const isSelf = targetUserId === currentUserId;
    const confirmMsg = isSelf
      ? 'Are you sure you want to leave this family group?'
      : `Are you sure you want to remove ${targetName} from the group?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setLoadingMemberId(targetUserId);
      await onRemoveMember(targetUserId);
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
      await onDeleteGroup(group.id || group._id);
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to delete group.');
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-backdrop-fade">
      {/* Click backdrop to close */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative z-10 bg-white dark:bg-[#111726] border-t sm:border border-slate-200/80 dark:border-slate-800 rounded-t-[32px] sm:rounded-[32px] w-full max-w-xl shadow-2xl overflow-hidden animate-modal-pop flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh]">
        
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
                Group Settings
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                {group.name} • {members.length} members
              </span>
            </div>
          </div>
          <button
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

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('add_email')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeTab === 'add_email'
                  ? 'bg-white dark:bg-[#1E2638] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Add via Email</span>
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
            <UserPlus className="w-3.5 h-3.5" />
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
            <span>Group Details</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: MEMBERS LIST & ROLES */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Group Members
                  </h4>
                  <span className="text-xs text-slate-400 dark:text-slate-400">
                    Manage member permissions and roles
                  </span>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('add_email')}
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
                  const isTargetAdmin = m.role === 'admin';
                  const isTargetMod = m.role === 'moderator';
                  const isBusy = loadingMemberId === m.userId;
                  const isTargetCreator = String(group.createdBy) === String(m.userId);

                  return (
                    <div
                      key={m.userId}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-100 dark:border-slate-700/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
                          {m.name ? m.name[0].toUpperCase() : 'M'}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate">
                            {m.name} {isSelf && <span className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold">(You)</span>}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-400 font-mono block truncate">
                            @{m.username}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border ${
                          isTargetAdmin
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
                            : isTargetMod
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/40'
                            : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}>
                          {isTargetAdmin && <Crown className="w-3 h-3" />}
                          {isTargetMod && <Shield className="w-3 h-3" />}
                          <span>{m.role}</span>
                        </span>

                        {/* Admin Controls */}
                        {isAdmin && !isSelf && !isTargetCreator && (
                          <div className="flex items-center gap-1">
                            {isTargetMod ? (
                              <button
                                type="button"
                                onClick={() => handleRoleChange(m.userId, 'member')}
                                disabled={isBusy}
                                title="Demote to Member"
                                className="p-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                              >
                                <ArrowDownCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRoleChange(m.userId, 'moderator')}
                                disabled={isBusy}
                                title="Promote to Moderator"
                                className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors"
                              >
                                <ArrowUpCircle className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemove(m.userId, m.name)}
                              disabled={isBusy}
                              title="Remove from group"
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Non-admin leave group */}
                        {!isAdmin && isSelf && (
                          <button
                            type="button"
                            onClick={() => handleRemove(m.userId, m.name)}
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

          {/* TAB 2: ADD MEMBER BY EMAIL */}
          {activeTab === 'add_email' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Add Member by Email ID
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                  Directly add an existing registered user to this group by entering their account email address.
                </p>
              </div>

              {emailSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{emailSuccess}</span>
                </div>
              )}

              {emailError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{emailError}</span>
                </div>
              )}

              <form onSubmit={handleAddEmail} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    User Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. friend@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1A2234] text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Group Role
                  </label>
                  <select
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1A2234] text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="member">Member (Can add & edit own expenses)</option>
                    <option value="moderator">Moderator (Can manage group expenses & categories)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isAddingEmail}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  {isAddingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Adding Member...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 stroke-[2.5]" />
                      <span>Add User to Group</span>
                    </>
                  )}
                </button>
              </form>
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
                  Anyone with this link can join your family group.
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

                {isAdmin && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 dark:text-slate-400">
                      Need to reset the link?
                    </span>
                    <button
                      type="button"
                      onClick={handleRegenToken}
                      disabled={isRegenerating}
                      className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                      <span>Regenerate Link</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: GROUP DETAILS & DANGER ZONE */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Rename Group Form */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Group Name
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                    {isAdmin ? 'Change the display name of this family group' : 'Display name of this group'}
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
                    disabled={!isAdmin || isRenaming}
                    value={groupNameInput}
                    onChange={(e) => setGroupNameInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1A2234] text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  />
                  {isAdmin && (
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

              {/* Danger Zone: Delete Group */}
              {isAdmin && (
                <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                  <h4 className="text-sm font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Danger Zone</span>
                  </h4>
                  
                  <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 space-y-3">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Delete this Family Group
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Permanently delete this group, including all shared expenses, incomes, and custom categories. This action cannot be undone.
                      </p>
                    </div>

                    {!showDeleteConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors active:scale-95 flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Group</span>
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
                            {isDeleting ? 'Deleting...' : 'Yes, Delete Group'}
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

      </div>
    </div>,
    document.body
  );
}
