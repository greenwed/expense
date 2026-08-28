import React, { useState } from 'react';
import { X, Shield, ShieldCheck, User, Trash2, Crown, Users } from 'lucide-react';
import { formatDateOnly } from '../utils/formatters';

export default function MemberManagementModal({ isOpen, onClose, group, currentUserId, onUpdateRole, onRemoveMember, isAdmin }) {
  const [loadingAction, setLoadingAction] = useState(null);

  if (!isOpen || !group) return null;

  const members = group.members || [];

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      setLoadingAction(`role-${targetUserId}`);
      await onUpdateRole(targetUserId, newRole);
    } catch (err) {
      alert('Failed to update role: ' + err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemove = async (targetUserId, targetName) => {
    if (!window.confirm(`Are you sure you want to remove ${targetName} from the group?`)) {
      return;
    }
    try {
      setLoadingAction(`remove-${targetUserId}`);
      await onRemoveMember(targetUserId);
    } catch (err) {
      alert('Failed to remove member: ' + err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Group Members</h3>
              <p className="text-xs text-slate-400">{group.name} ({members.length} {members.length === 1 ? 'member' : 'members'})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {members.map((member) => {
            const isSelf = String(member.userId) === String(currentUserId);
            const isMemberAdmin = member.role === 'admin';

            return (
              <div
                key={member.userId}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    member.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : member.role === 'moderator'
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {member.role === 'admin' ? (
                      <Crown className="w-4 h-4" />
                    ) : member.role === 'moderator' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{member.name}</span>
                      {isSelf && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="text-emerald-400 font-mono">@{member.username}</span>
                      <span>•</span>
                      <span>Joined {formatDateOnly(member.joinedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Role Controls */}
                <div className="flex items-center gap-2">
                  {isAdmin && !isSelf && !isMemberAdmin ? (
                    <>
                      <select
                        value={member.role}
                        disabled={loadingAction === `role-${member.userId}`}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="member">Member</option>
                        <option value="moderator">Moderator</option>
                      </select>

                      <button
                        onClick={() => handleRemove(member.userId, member.name)}
                        disabled={loadingAction === `remove-${member.userId}`}
                        title="Remove member"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      member.role === 'admin'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : member.role === 'moderator'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
