import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Copy, Check, Share2, AtSign, Users, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AddFriendModal({ isOpen, onClose, onFriendAdded, existingFriends = [] }) {
  const { apiFetch, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittingUsername, setSubmittingUsername] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch or generate invite token when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      setUsernameInput('');
      fetchInviteToken();
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const fetchInviteToken = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/split/friends/invite', { method: 'POST' });
      const data = await res.json();
      if (data.inviteToken) {
        setInviteToken(data.inviteToken);
      }
    } catch (err) {
      console.error('Failed to get friend invite token:', err);
    } finally {
      setLoading(false);
    }
  };

  const inviteLink = typeof window !== 'undefined' && inviteToken
    ? `${window.location.origin}/join-friend/${inviteToken}`
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

  const handleShareLink = () => {
    if (!inviteLink) return;
    const text = `Hey! Split bills with me on RupeeTrack: ${inviteLink}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join me on RupeeTrack Split',
        text,
        url: inviteLink
      }).catch(() => {});
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const handleAddByUsername = async (e) => {
    e.preventDefault();
    const cleanUsername = usernameInput.trim().replace(/^@/, '');
    if (!cleanUsername) {
      setError('Please enter a valid username.');
      return;
    }

    try {
      setSubmittingUsername(true);
      setError('');
      setSuccessMsg('');

      const res = await apiFetch('/api/split/friends/add-by-username', {
        method: 'POST',
        body: JSON.stringify({ username: cleanUsername })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add friend.');
      }

      setSuccessMsg(data.message || `Added @${cleanUsername} to your friends!`);
      setUsernameInput('');
      if (onFriendAdded) onFriendAdded();
    } catch (err) {
      setError(err.message || 'Failed to add friend.');
    } finally {
      setSubmittingUsername(false);
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
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Add Friends
              </h3>
              <span className="text-xs text-slate-400 dark:text-slate-400">
                Split expenses and track balances
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

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Option 1: Share Invite Link */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Share Your Invite Link</span>
              </label>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                Instant Connect
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                {loading ? 'Generating link...' : inviteLink || 'Loading link...'}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                disabled={!inviteLink || loading}
                className={`p-2.5 rounded-2xl border text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                    : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-600 text-white shadow-md shadow-indigo-500/20 active:scale-95'
                }`}
                title="Copy Link"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleShareLink}
                disabled={!inviteLink || loading}
                className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#1A2234] hover:bg-slate-200 dark:hover:bg-[#222C42] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all shrink-0"
                title="Share via WhatsApp or Apps"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 leading-relaxed">
              Anyone with this link will instantly become your friend on RupeeTrack when they open it.
            </p>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400">
              OR
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Option 2: Add by Username */}
          <form onSubmit={handleAddByUsername} className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5 text-indigo-500" />
              <span>Add by Username</span>
            </label>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-400 text-xs font-bold">
                  @
                </span>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="friend_username"
                  className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={submittingUsername || !usernameInput.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all shrink-0"
              >
                {submittingUsername ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>

          {/* Existing Friends count info */}
          {existingFriends.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>You have <strong>{existingFriends.length}</strong> friend{existingFriends.length !== 1 ? 's' : ''} connected</span>
              </span>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
