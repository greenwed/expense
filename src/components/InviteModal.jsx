import React, { useState } from 'react';
import { X, Copy, Check, Link, RefreshCw, Share2 } from 'lucide-react';

export default function InviteModal({ isOpen, onClose, group, onRegenerateToken, isAdmin = false }) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  if (!isOpen || !group) return null;

  const inviteUrl = `${window.location.origin}/join/${group.inviteToken}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Regenerating will invalidate the previous invite link. Continue?')) {
      return;
    }
    try {
      setRegenerating(true);
      await onRegenerateToken();
    } catch (err) {
      alert('Failed to regenerate invite link: ' + err.message);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Invite Family Members</h3>
              <p className="text-xs text-slate-400">Share this link to join {group.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-slate-300 leading-relaxed">
            Anyone with this unique invite link can join the <strong className="text-white">{group.name}</strong> group after logging into their account.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Shareable Invite Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-emerald-400 font-mono focus:outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shrink-0 transition-all ${
                  copied
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1 text-xs text-slate-300">
            <div className="font-semibold text-slate-200">ℹ️ How it works:</div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400">
              <li>New members join with the role of <strong>Member</strong> by default.</li>
              <li>Members can add their own expenses immediately.</li>
              <li>As Admin, you can promote members to Moderator anytime.</li>
            </ul>
          </div>

          {isAdmin && (
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">Need a fresh invite link?</span>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 font-medium transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate Link</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
