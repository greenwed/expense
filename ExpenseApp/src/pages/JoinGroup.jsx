import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, CheckCircle, ArrowRight, IndianRupee, Sparkles } from 'lucide-react';
import AuthPage from './AuthPage';

export default function JoinGroup({ inviteToken, onJoined }) {
  const { user, apiFetch } = useAuth();
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  const fetchInviteInfo = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch(`/api/family/invite-info/${inviteToken}`);
      setGroupInfo(res);
      if (res.isMember) {
        setJoinedSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired invite link.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && inviteToken) {
      fetchInviteInfo();
    } else {
      setLoading(false);
    }
  }, [user, inviteToken]);

  const handleJoin = async () => {
    try {
      setJoining(true);
      setError('');
      const res = await apiFetch(`/api/family/join/${inviteToken}`, {
        method: 'POST'
      });
      setJoinedSuccess(true);
      if (onJoined) {
        onJoined(res.group._id || res.group.id);
      }
    } catch (err) {
      setError(err.message || 'Failed to join group.');
    } finally {
      setJoining(false);
    }
  };

  // If unauthenticated, show Auth page with note
  if (!user) {
    return (
      <div className="space-y-4">
        <div className="max-w-md mx-auto p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center text-sm text-emerald-300">
          🎁 You have been invited to join a Family Workspace! Sign in or register below to accept the invitation.
        </div>
        <AuthPage />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl backdrop-blur-xl animate-fadeIn">
        
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-5 border border-emerald-500/20">
          <Users className="w-8 h-8" />
        </div>

        {loading ? (
          <div className="py-8 text-slate-400 text-sm">Verifying invite link...</div>
        ) : error ? (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-rose-400">Invalid Invite Link</h3>
            <p className="text-xs text-slate-400">{error}</p>
            <button
              onClick={() => { window.location.pathname = '/'; }}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : joinedSuccess ? (
          <div className="space-y-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 mb-2">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">You're in!</h3>
            <p className="text-sm text-slate-300">
              You are a member of <strong className="text-emerald-300">{groupInfo?.name}</strong>.
            </p>
            <button
              onClick={() => {
                if (onJoined && groupInfo) {
                  onJoined(groupInfo.groupId);
                } else {
                  window.location.pathname = '/';
                }
              }}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <span>Open Family Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Group Invitation
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                {groupInfo?.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {groupInfo?.memberCount} current {groupInfo?.memberCount === 1 ? 'member' : 'members'}
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              Logged in as <strong className="text-white">{user.name}</strong> (@{user.username}). Click below to join and start tracking shared expenses!
            </p>

            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <span>{joining ? 'Joining group...' : 'Accept & Join Group'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
