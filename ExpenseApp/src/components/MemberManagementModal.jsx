import React, { useState } from 'react';
import { X, Crown, Shield, User, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function MemberManagementModal({
  isOpen,
  onClose,
  group,
  currentUser,
  onUpdateRole,
  onRemoveMember
}) {
  const [loadingId, setLoadingId] = useState(null);

  if (!isOpen || !group) return null;

  const members = group.members || [];
  const currentUserId = String(currentUser?._id || currentUser?.id);

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      setLoadingId(targetUserId);
      await onUpdateRole(targetUserId, newRole);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleRemove = async (targetUserId, targetName) => {
    if (!window.confirm(`Are you sure you want to remove ${targetName} from the group?`)) {
      return;
    }
    try {
      setLoadingId(targetUserId);
      await onRemoveMember(targetUserId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-backdrop-fade">
      <div className="bg-white border border-slate-200/80 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-modal-pop">
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Manage Members & Roles</h3>
            <span className="text-xs text-slate-400">{group.name} ({members.length} members)</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {members.map((m) => {
            const isSelf = String(m.userId) === currentUserId;
            const isTargetAdmin = m.role === 'admin';
            const isTargetMod = m.role === 'moderator';
            const isBusy = loadingId === m.userId;

            return (
              <div
                key={m.userId}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-indigo-600 shadow-sm shrink-0">
                    {m.name ? m.name[0].toUpperCase() : 'M'}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                      {m.name} {isSelf && <span className="text-indigo-600 text-xs">(You)</span>}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono block truncate">
                      @{m.username}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border ${
                    isTargetAdmin
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : isTargetMod
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-slate-200/70 text-slate-600 border-slate-300'
                  }`}>
                    {isTargetAdmin && <Crown className="w-3 h-3" />}
                    {isTargetMod && <Shield className="w-3 h-3" />}
                    <span>{m.role}</span>
                  </span>

                  {!isSelf && !isTargetAdmin && (
                    <div className="flex items-center gap-1">
                      {isTargetMod ? (
                        <button
                          type="button"
                          onClick={() => handleRoleChange(m.userId, 'member')}
                          disabled={isBusy}
                          title="Demote to Member"
                          className="p-1.5 rounded-lg bg-slate-200/70 text-slate-600 hover:bg-slate-300 transition-colors"
                        >
                          <ArrowDownCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRoleChange(m.userId, 'moderator')}
                          disabled={isBusy}
                          title="Promote to Moderator"
                          className="p-1.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                        >
                          <ArrowUpCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemove(m.userId, m.name)}
                        disabled={isBusy}
                        title="Remove from group"
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
