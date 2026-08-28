import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MonthSelector from '../components/MonthSelector';
import BudgetWarningBanner from '../components/BudgetWarningBanner';
import CategoryPieChart from '../components/CategoryPieChart';
import ExpenseModal from '../components/ExpenseModal';
import BudgetModal from '../components/BudgetModal';
import InviteModal from '../components/InviteModal';
import MemberManagementModal from '../components/MemberManagementModal';
import CreateGroupModal from '../components/CreateGroupModal';
import RenameGroupModal from '../components/RenameGroupModal';
import { formatINR, formatDateTime, CATEGORY_CONFIG, getCurrentMonthStr } from '../utils/formatters';
import {
  Plus,
  Users,
  Wallet,
  ArrowUpRight,
  Sparkles,
  Edit2,
  Trash2,
  Search,
  Receipt,
  Share2,
  Settings,
  Crown,
  ShieldCheck,
  User,
  ChevronDown,
  LogOut,
  Utensils,
  ShoppingBag,
  Film,
  HeartPulse,
  Car,
  MoreHorizontal
} from 'lucide-react';

const ICON_MAP = {
  Utensils,
  ShoppingBag,
  Film,
  HeartPulse,
  Car,
  MoreHorizontal
};

export default function FamilyWorkspace({ groups = [], onRefreshGroups, selectedGroupId, onSelectGroupId }) {
  const { user, apiFetch } = useAuth();
  const [month, setMonth] = useState(getCurrentMonthStr());
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Modals
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isRenameGroupOpen, setIsRenameGroupOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const activeGroup = groups.find((g) => (g._id || g.id) === selectedGroupId) || groups[0] || null;
  const activeGroupId = activeGroup ? activeGroup._id || activeGroup.id : null;
  const userRole = activeGroup?.currentUserRole || 'member'; // 'admin' | 'moderator' | 'member'
  const isAdmin = userRole === 'admin';
  const isModerator = userRole === 'moderator';
  const canManageBudget = isAdmin || isModerator;
  const canEditExpenses = isAdmin || isModerator;

  const fetchFamilyDashboard = async () => {
    if (!activeGroupId) {
      setDashboardData(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch(`/api/family/groups/${activeGroupId}/dashboard?month=${month}`);
      setDashboardData(res);
    } catch (err) {
      console.error('Failed to load family dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyDashboard();
  }, [activeGroupId, month]);

  // Handle Create Group
  const handleCreateGroup = async (groupName) => {
    const res = await apiFetch('/api/family/groups', {
      method: 'POST',
      body: { name: groupName }
    });
    await onRefreshGroups();
    const newGroupId = res.group._id || res.group.id;
    if (onSelectGroupId) onSelectGroupId(newGroupId);
  };

  // Handle Rename Group
  const handleRenameGroup = async (newName) => {
    await apiFetch(`/api/family/groups/${activeGroupId}/rename`, {
      method: 'PUT',
      body: { name: newName }
    });
    await onRefreshGroups();
    await fetchFamilyDashboard();
  };

  // Handle Regenerate Invite Token
  const handleRegenerateInviteToken = async () => {
    await apiFetch(`/api/family/groups/${activeGroupId}/invite`, {
      method: 'POST'
    });
    await onRefreshGroups();
    await fetchFamilyDashboard();
  };

  // Handle Update Member Role
  const handleUpdateMemberRole = async (targetUserId, newRole) => {
    await apiFetch(`/api/family/groups/${activeGroupId}/members/${targetUserId}`, {
      method: 'PUT',
      body: { role: newRole }
    });
    await onRefreshGroups();
    await fetchFamilyDashboard();
  };

  // Handle Remove Member
  const handleRemoveMember = async (targetUserId) => {
    await apiFetch(`/api/family/groups/${activeGroupId}/members/${targetUserId}`, {
      method: 'DELETE'
    });
    await onRefreshGroups();
    await fetchFamilyDashboard();
  };

  // Handle Leave Group (Self)
  const handleLeaveGroup = async () => {
    if (!window.confirm(`Are you sure you want to leave ${activeGroup.name}?`)) return;
    try {
      const currentUserId = user.id || user._id;
      await apiFetch(`/api/family/groups/${activeGroupId}/members/${currentUserId}`, {
        method: 'DELETE'
      });
      await onRefreshGroups();
    } catch (err) {
      alert('Failed to leave group: ' + err.message);
    }
  };

  // Handle Save Expense (Add or Edit)
  const handleSaveExpense = async (expensePayload) => {
    if (editingExpense) {
      const expId = editingExpense._id || editingExpense.id;
      await apiFetch(`/api/family/groups/${activeGroupId}/expenses/${expId}`, {
        method: 'PUT',
        body: expensePayload
      });
    } else {
      await apiFetch(`/api/family/groups/${activeGroupId}/expenses`, {
        method: 'POST',
        body: expensePayload
      });
    }
    await fetchFamilyDashboard();
  };

  // Handle Delete Expense (Admin / Moderator only)
  const handleDeleteExpense = async (expenseId, description) => {
    if (!window.confirm(`Delete entry "${description}"?`)) return;
    try {
      await apiFetch(`/api/family/groups/${activeGroupId}/expenses/${expenseId}`, {
        method: 'DELETE'
      });
      await fetchFamilyDashboard();
    } catch (err) {
      alert('Failed to delete expense: ' + err.message);
    }
  };

  // Handle Update Group Budget (Admin / Moderator)
  const handleSaveBudget = async (newAmount) => {
    await apiFetch(`/api/family/groups/${activeGroupId}/budget`, {
      method: 'POST',
      body: { month, amount: newAmount }
    });
    await fetchFamilyDashboard();
  };

  // Empty state if user is in no groups
  if (groups.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center animate-fadeIn">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-5 border border-emerald-500/20">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Family Workspace
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-md mx-auto leading-relaxed">
            Collaborate on shared household expenses with your family, roommates, or team.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsCreateGroupOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create a Family Group</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80 text-xs text-slate-500 max-w-sm mx-auto">
            💡 If a family member sent you an invite link, open the link directly in your browser to join!
          </div>
        </div>

        <CreateGroupModal
          isOpen={isCreateGroupOpen}
          onClose={() => setIsCreateGroupOpen(false)}
          onCreate={handleCreateGroup}
        />
      </div>
    );
  }

  // Filter group expenses
  const filteredExpenses = (dashboardData?.expenses || []).filter((exp) => {
    const matchesSearch =
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.userName && exp.userName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategoryFilter === 'All' || exp.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const budget = dashboardData?.budget || 0;
  const totalSpent = dashboardData?.totalSpent || 0;
  const remainingBalance = dashboardData?.remainingBalance || 0;
  const percentSpent = dashboardData?.percentSpent || 0;
  const isExceeding80 = dashboardData?.isExceeding80 || false;
  const isExceeding100 = dashboardData?.isExceeding100 || false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      
      {/* Group Switcher & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm">
        
        {/* Active Group Info & Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <select
                  value={activeGroupId}
                  onChange={(e) => onSelectGroupId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-white font-extrabold text-lg sm:text-xl rounded-xl px-3 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {groups.map((g) => (
                    <option key={g._id || g.id} value={g._id || g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>

                {/* Role Badge */}
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                  userRole === 'admin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : userRole === 'moderator'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {userRole === 'admin' && <Crown className="w-3 h-3" />}
                  {userRole === 'moderator' && <ShieldCheck className="w-3 h-3" />}
                  {userRole === 'member' && <User className="w-3 h-3" />}
                  <span>{userRole}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {(activeGroup.members || []).length} Members in group
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateGroupOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Group</span>
          </button>
        </div>

        {/* Group Controls (Admin / Mod buttons) */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setIsRenameGroupOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Rename</span>
              </button>

              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Invite Link</span>
              </button>
            </>
          )}

          <button
            onClick={() => setIsMembersModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Members ({(activeGroup.members || []).length})</span>
          </button>

          {!isAdmin && (
            <button
              onClick={handleLeaveGroup}
              title="Leave Group"
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* Month Filter & Add Expense Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Family Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Group monthly summary and member spending activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <MonthSelector selectedMonth={month} onMonthChange={setMonth} />
          
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Family Expense</span>
          </button>
        </div>
      </div>

      {/* Warning Alert Banner (if spent >= 80% or > 100%) */}
      <BudgetWarningBanner
        budget={budget}
        totalSpent={totalSpent}
        isExceeding80={isExceeding80}
        isExceeding100={isExceeding100}
        percentSpent={percentSpent}
      />

      {/* 3 Metric Cards for Group */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Group Budget Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Group Budget
            </span>
            {canManageBudget && (
              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
              >
                <Edit2 className="w-3 h-3" />
                <span>{budget > 0 ? 'Edit' : 'Set Budget'}</span>
              </button>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
            {formatINR(budget)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {budget === 0 ? 'No group budget set' : 'Shared monthly limit'}
          </div>
        </div>

        {/* Group Spent Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Group Total Spent
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2 tracking-tight">
            {formatINR(totalSpent)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            {budget > 0 ? (
              <span><strong>{percentSpent}%</strong> of group budget</span>
            ) : (
              <span>{dashboardData?.expenses?.length || 0} family entries</span>
            )}
          </div>
        </div>

        {/* Group Remaining Balance Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Group Remaining
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
              remainingBalance < 0
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight ${
            remainingBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {formatINR(remainingBalance)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {remainingBalance < 0 ? (
              <span className="text-rose-400 font-semibold">Over budget by {formatINR(Math.abs(remainingBalance))}</span>
            ) : budget > 0 ? (
              <span>Shared remaining allowance</span>
            ) : (
              <span>Set budget to compute balance</span>
            )}
          </div>
        </div>

      </div>

      {/* Category Pie Chart Breakdown for Group */}
      <CategoryPieChart
        categoryBreakdown={dashboardData?.categoryBreakdown || []}
        totalSpent={totalSpent}
      />

      {/* All Members' Expenses List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <span>All Members' Expenses</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                {filteredExpenses.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Each entry displays the member who added it. {canEditExpenses ? 'You have moderator/admin edit rights.' : 'Members can add entries only.'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[180px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search description or member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['All', 'Food', 'Shopping', 'Entertainment', 'Medical', 'Transport', 'Others'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg font-medium transition-all shrink-0 ${
                selectedCategoryFilter === cat
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Entries List */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Loading group expenses...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-medium">No family expenses found</p>
            <p className="text-xs text-slate-600 mt-1">Click "+ Add Family Expense" to record an expense for the group.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredExpenses.map((expense) => {
              const expId = expense._id || expense.id;
              const config = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.Others;
              const IconComponent = ICON_MAP[config.icon] || MoreHorizontal;
              const isSelf = String(expense.userId) === String(user.id || user._id);

              return (
                <div
                  key={expId}
                  className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/20 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${config.color}15`,
                        color: config.color,
                        borderColor: `${config.color}30`
                      }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white truncate">
                          {expense.description}
                        </span>
                        
                        <span
                          className="text-[10px] px-2 py-0.2 rounded-md font-semibold shrink-0"
                          style={{
                            backgroundColor: `${config.color}20`,
                            color: config.color
                          }}
                        >
                          {expense.category}
                        </span>

                        {/* Member Tag */}
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium flex items-center gap-1">
                          <User className="w-3 h-3 text-emerald-400" />
                          <span>Added by: <strong className="text-emerald-300">{expense.userName || 'Member'}</strong></span>
                          {isSelf && <span className="text-slate-500">(You)</span>}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 mt-0.5">
                        {formatDateTime(expense.date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                        {formatINR(expense.amount)}
                      </div>
                    </div>

                    {/* Edit & Delete Actions (Admin & Moderator only) */}
                    {canEditExpenses && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingExpense(expense);
                            setIsExpenseModalOpen(true);
                          }}
                          title="Edit expense (Admin / Moderator)"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteExpense(expId, expense.description)}
                          title="Delete expense (Admin / Moderator)"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
        )}

      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreate={handleCreateGroup}
      />

      <RenameGroupModal
        isOpen={isRenameGroupOpen}
        onClose={() => setIsRenameGroupOpen(false)}
        currentName={activeGroup.name}
        onRename={handleRenameGroup}
      />

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        group={activeGroup}
        onRegenerateToken={handleRegenerateInviteToken}
        isAdmin={isAdmin}
      />

      <MemberManagementModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        group={activeGroup}
        currentUserId={user.id || user._id}
        onUpdateRole={handleUpdateMemberRole}
        onRemoveMember={handleRemoveMember}
        isAdmin={isAdmin}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSave={handleSaveBudget}
        currentBudget={budget}
        month={month}
        isFamily={true}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        initialData={editingExpense}
        title={editingExpense ? 'Edit Family Expense' : 'Add Family Expense'}
      />

    </div>
  );
}
