import React, { useState } from 'react';
import { X, Copy, Check, RefreshCw, Link as LinkIcon } from 'lucide-react';

export default function InviteModal({ isOpen, onClose, group, onRegenerateToken }) {
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
    if (!window.confirm('Are you sure you want to regenerate the invite link? Any previous link will become invalid.')) {
      return;
    }
    try {
      setRegenerating(true);
      await onRegenerateToken();
    } catch (err) {
      console.error(err);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white border border-slate-200/80 rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden">
        
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Invite Members</h3>
              <span className="text-xs text-slate-400">{group.name}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Share this link with your family members. When they click it, they will instantly join <strong>{group.name}</strong> as a Member.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Unique Invite Link
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 pl-3.5">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="bg-transparent border-none text-xs font-mono text-slate-700 w-full focus:outline-none truncate select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate Link</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
