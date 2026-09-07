import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Plus,
  Receipt,
  UserPlus,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Scale,
  Sparkles,
  ArrowRight,
  Check,
  Share2,
  Tag,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/formatters';

import AddSplitExpenseModal from '../components/AddSplitExpenseModal';
import CreateSplitGroupModal from '../components/CreateSplitGroupModal';
import AddFriendModal from '../components/AddFriendModal';
import SettleUpModal from '../components/SettleUpModal';
import SplitGroupDetailModal from '../components/SplitGroupDetailModal';

export default function SplitWorkspace() {
  const { apiFetch, user } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState('groups'); // 'groups' | 'friends' | 'activity'
  const [data, setData] = useState({
    summary: { totalOwedToYou: 0, totalYouOwe: 0, netBalance: 0 },
    groups: [],
    friends: [],
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedGroupForExpense, setSelectedGroupForExpense] = useState(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [settleTarget, setSettleTarget] = useState({ payerId: null, payeeId: null, amount: 0 });
  const [selectedGroupDetail, setSelectedGroupDetail] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/split/dashboard');
      if (res) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load split dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const currentUserId = String(user?._id || user?.id || '');

  // Quick trigger to settle up with a specific friend
  const handleSettleWithFriend = (friend) => {
    const fId = String(friend.friendId || friend.userId || friend.id);
    const net = friend.netBalance || 0;

    if (net < 0) {
      // Current user owes friend
      setSettleTarget({
        payerId: currentUserId,
        payeeId: fId,
        amount: Math.abs(net)
      });
    } else {
      // Friend owes current user
      setSettleTarget({
        payerId: fId,
        payeeId: currentUserId,
        amount: Math.abs(net)
      });
    }
    setIsSettleUpOpen(true);
  };

  const { summary, groups, friends, recentActivities } = data;

  return (
    <div className="space-y-6 animate-fadeIn pb-24 lg:pb-8 max-w-5xl mx-auto">
      
      {/* ================= HERO BALANCE BANNER ================= */}
      <div className="relative overflow-hidden rounded-[32px] p-6 sm:p-8 bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#111827] text-white border border-indigo-900/40 shadow-2xl transition-all">
        <div className="relative z-10 space-y-6">
          
          {/* Top Row: Title & Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold tracking-wider uppercase border border-indigo-500/30">
                  Split & Share
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                Shared Expenses Hub
              </h2>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedGroupForExpense(null);
                  setIsAddExpenseOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/30 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Expense</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettleTarget({ payerId: null, payeeId: null, amount: 0 });
                  setIsSettleUpOpen(true);
                }}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Settle Up</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" />
                <span>+ Split</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddFriendOpen(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Friend</span>
              </button>
            </div>
          </div>

          {/* Balance Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* You are owed */}
            <div className="p-4 rounded-2xl bg-white/5 border border-emerald-500/20 backdrop-blur-xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold text-slate-300">You Are Owed</span>
              </div>
              <span className="text-2xl font-black text-emerald-400 block font-mono">
                +₹{(summary?.totalOwedToYou || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-300/70">From friends & groups</span>
            </div>

            {/* You owe */}
            <div className="p-4 rounded-2xl bg-white/5 border border-rose-500/20 backdrop-blur-xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold text-slate-300">You Owe</span>
              </div>
              <span className="text-2xl font-black text-rose-400 block font-mono">
                -₹{(summary?.totalYouOwe || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-rose-300/70">Debts to settle</span>
            </div>

            {/* Total Net Balance */}
            <div className="p-4 rounded-2xl bg-white/5 border border-indigo-500/20 backdrop-blur-xs">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  <Scale className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold text-slate-300">Net Balance</span>
              </div>
              <span className={`text-2xl font-black block font-mono ${
                (summary?.netBalance || 0) > 0
                  ? 'text-emerald-400'
                  : (summary?.netBalance || 0) < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}>
                {(summary?.netBalance || 0) >= 0 ? '+' : '-'}₹{Math.abs(summary?.netBalance || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400">
                {(summary?.netBalance || 0) > 0 ? 'Overall in credit' : (summary?.netBalance || 0) < 0 ? 'Overall in debit' : 'Completely balanced'}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ================= SUB-TABS (GROUPS | FRIENDS | ACTIVITY) ================= */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#131926] rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setActiveSubTab('groups')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'groups'
                ? 'bg-white dark:bg-[#1E2638] text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Groups ({groups.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('friends')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'friends'
                ? 'bg-white dark:bg-[#1E2638] text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Friends ({friends.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('activity')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'activity'
                ? 'bg-white dark:bg-[#1E2638] text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Activity Log</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: GROUPS VIEW ================= */}
      {activeSubTab === 'groups' && (
        <div className="space-y-4">
          {groups.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                No Split Groups Yet
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create a split group for your apartment, road trip, dinner party, or project to track shared costs smoothly.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create Your First Split</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map(g => {
                const gId = g.id || g._id;
                const net = g.netBalance || 0;

                return (
                  <div
                    key={gId}
                    onClick={() => setSelectedGroupDetail(g)}
                    className="p-5 rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700/80 transition-all cursor-pointer group space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg group-hover:scale-105 transition-transform">
                          <Users className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {g.name}
                          </h4>
                          <span className="text-xs text-slate-400">
                            {(g.members || []).length} members • {g.expenseCount || 0} expenses
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </div>

                    {/* Member Avatars Row */}
                    <div className="flex items-center gap-1 overflow-hidden py-0.5">
                      {(g.members || []).slice(0, 5).map((m, idx) => (
                        <div
                          key={idx}
                          className="w-7 h-7 rounded-xl text-white font-bold text-[10px] flex items-center justify-center border-2 border-white dark:border-[#131926] shadow-xs shrink-0"
                          style={{ backgroundColor: m.avatarColor || '#6366F1' }}
                          title={m.name}
                        >
                          {m.name ? m.name[0].toUpperCase() : 'M'}
                        </div>
                      ))}
                      {(g.members || []).length > 5 && (
                        <span className="text-[10px] text-slate-400 font-bold pl-1">
                          +{(g.members || []).length - 5}
                        </span>
                      )}
                    </div>

                    {/* Balance Info Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                          Total Spent
                        </span>
                        <span className="font-black text-slate-900 dark:text-white">
                          ₹{(g.totalSpent || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                          Your Balance
                        </span>
                        <span className={`font-black font-mono ${
                          net > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : net < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-400'
                        }`}>
                          {net > 0 ? `+₹${net.toFixed(2)}` : net < 0 ? `-₹${Math.abs(net).toFixed(2)}` : 'Settled'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: FRIENDS VIEW ================= */}
      {activeSubTab === 'friends' && (
        <div className="space-y-4">
          {friends.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <UserPlus className="w-7 h-7 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                No Friends Connected Yet
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Invite your friends via link or username to easily track who you split with and see who owes whom.
              </p>
              <button
                type="button"
                onClick={() => setIsAddFriendOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Your First Friend</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {friends.map(f => {
                const fId = String(f.friendId || f.userId || f.id);
                const net = f.netBalance || 0;

                return (
                  <div
                    key={fId}
                    className="p-4 rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Color-coded Avatar */}
                      <div
                        className="w-11 h-11 rounded-2xl text-white font-black text-sm flex items-center justify-center shadow-md shrink-0"
                        style={{ backgroundColor: f.avatarColor || '#6366F1' }}
                      >
                        {f.friendName ? f.friendName[0].toUpperCase() : 'F'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white block truncate">
                          {f.friendName}
                        </span>
                        <span className="text-xs text-slate-400 font-mono block truncate">
                          @{f.friendUsername || 'friend'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Balance status */}
                      <div className="text-right">
                        <span className={`text-xs font-black font-mono block ${
                          net > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : net < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-400 dark:text-slate-400'
                        }`}>
                          {net > 0 ? `owes you ₹${net.toFixed(2)}` : net < 0 ? `you owe ₹${Math.abs(net).toFixed(2)}` : 'settled up'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {net !== 0 ? 'Outstanding balance' : 'All clear'}
                        </span>
                      </div>

                      {/* Settle button */}
                      {net !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSettleWithFriend(f)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-all active:scale-95"
                        >
                          Settle
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: ACTIVITY LOG ================= */}
      {activeSubTab === 'activity' && (
        <div className="space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Full Split History</span>
            </h3>

            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No activity recorded yet. Add an expense or settle up to start building history!
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((act, idx) => {
                  const isExpense = act.type.includes('expense');
                  const isSettlement = act.type.includes('settle');

                  return (
                    <div
                      key={act.id || idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1A2234] border border-slate-200/60 dark:border-slate-700/60 flex items-start gap-3"
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isExpense
                          ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                          : isSettlement
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {isExpense ? <Receipt className="w-4 h-4" /> : isSettlement ? <Check className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {act.userName}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatDateTime(act.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {act.type === 'expense_added' && (
                            <>
                              added <strong className="text-slate-900 dark:text-white">"{act.details.description}"</strong> for <strong className="text-indigo-600 dark:text-indigo-400 font-mono">₹{act.details.amount}</strong>
                            </>
                          )}
                          {act.type === 'settlement_recorded' && (
                            <>
                              recorded payment of <strong className="text-emerald-600 dark:text-emerald-400 font-mono">₹{act.details.amount}</strong> ({act.details.payerName} → {act.details.payeeName})
                            </>
                          )}
                          {act.type === 'group_created' && (
                            <>
                              created new split group <strong className="text-slate-900 dark:text-white">"{act.details.groupName}"</strong>
                            </>
                          )}
                          {act.type === 'friend_added' && (
                            <>
                              connected with friend <strong className="text-slate-900 dark:text-white">@{act.details.friendUsername}</strong>
                            </>
                          )}
                          {act.type === 'expense_deleted' && (
                            <>
                              removed expense <strong className="text-slate-900 dark:text-white">"{act.details.description}"</strong> (₹{act.details.amount})
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}
      
      {/* 1. Add Split Expense Modal */}
      <AddSplitExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onExpenseAdded={() => {
          fetchDashboardData();
        }}
        groups={groups}
        friends={friends}
        initialGroupId={selectedGroupForExpense}
      />

      {/* 2. Create Split Group Modal */}
      <CreateSplitGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={(newGroup) => {
          fetchDashboardData();
          if (newGroup) {
            setSelectedGroupDetail(newGroup);
          }
        }}
        friends={friends}
      />

      {/* 3. Add Friend Modal */}
      <AddFriendModal
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
        onFriendAdded={() => {
          fetchDashboardData();
        }}
        existingFriends={friends}
      />

      {/* 4. Settle Up Modal */}
      <SettleUpModal
        isOpen={isSettleUpOpen}
        onClose={() => setIsSettleUpOpen(false)}
        onSettled={() => {
          fetchDashboardData();
        }}
        friends={friends}
        groups={groups}
        initialPayerId={settleTarget.payerId}
        initialPayeeId={settleTarget.payeeId}
        suggestedAmount={settleTarget.amount}
      />

      {/* 5. Split Group Detail Modal */}
      {selectedGroupDetail && (
        <SplitGroupDetailModal
          isOpen={Boolean(selectedGroupDetail)}
          onClose={() => setSelectedGroupDetail(null)}
          group={selectedGroupDetail}
          onOpenAddExpense={(gId) => {
            setSelectedGroupForExpense(gId);
            setIsAddExpenseOpen(true);
          }}
          onOpenSettleUp={() => {
            setSettleTarget({ payerId: null, payeeId: null, amount: 0 });
            setIsSettleUpOpen(true);
          }}
          onExpenseDeleted={() => {
            fetchDashboardData();
          }}
        />
      )}

    </div>
  );
}
