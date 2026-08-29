import React, { useState } from 'react';
import {
  Plus,
  Users,
  UserPlus,
  Settings,
  Edit2,
  Trash2,
  Search,
  Crown,
  Shield,
  User,
  ChevronDown,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Utensils,
  ShoppingBag,
  Film,
  HeartPulse,
  Car,
  MoreHorizontal
} from 'lucide-react';
import HeroBalanceCard from '../components/HeroBalanceCard';
import MoneySummaryCards from '../components/MoneySummaryCards';
import BudgetWarningBanner from '../components/BudgetWarningBanner';
import {
  formatINR,
  formatDateTime,
  formatDayHeader,
  CATEGORY_CONFIG
} from '../utils/formatters';

const ICON_MAP = {
  Food: Utensils,
  Shopping: ShoppingBag,
  Entertainment: Film,
  Medical: HeartPulse,
  Transport: Car,
  Others: MoreHorizontal
};

export default function FamilyWorkspace({
  user,
  month,
  groups = [],
  selectedGroupId,
  onSelectGroup,
  groupData,
  onOpenCreateGroup,
  onOpenRenameGroup,
  onOpenInviteModal,
  onOpenMemberManagement,
  onOpenBudgetModal,
  onOpenAddExpense,
  onOpenEditExpense,
  onDeleteExpense,
  onOpenMonthSelector
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const currentGroup = groups.find((g) => (g.id || g._id) === selectedGroupId);
  const currentMember = currentGroup?.members?.find((m) => String(m.userId) === String(user?._id || user?.id));
  const userRole = currentMember?.role || 'member';
  const isAdmin = userRole === 'admin';
  const isModOrAdmin = ['admin', 'moderator'].includes(userRole);

  const budget = groupData?.budget || 0;
  const totalSpent = groupData?.totalSpent || 0;
  const remainingBalance = groupData?.remainingBalance || 0;
  const isExceeding80 = groupData?.isExceeding80 || false;
  const isExceeding100 = groupData?.isExceeding100 || false;
  const expenses = groupData?.expenses || [];
  const members = currentGroup?.members || [];

  const percentSpent = budget > 0 ? ((totalSpent / budget) * 100).toFixed(0) : 0;

  // Filter expenses
  const filteredExpenses = expenses.filter((e) => {
    const matchCat = selectedCategory === 'All' || e.category === selectedCategory;
    const matchQuery =
      !searchQuery ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(e.amount).includes(searchQuery);
    return matchCat && matchQuery;
  });

  // Group by day
  const groupedExpenses = filteredExpenses.reduce((acc, exp) => {
    const dateKey = exp.date ? exp.date.split('T')[0] : 'Unknown';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(exp);
    return acc;
  }, {});

  if (groups.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center space-y-6 animate-fadeIn pb-24">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-xl shadow-indigo-500/10">
          <Users className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900">Family & Collaborative Hub</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Create a family group to set shared monthly budgets, track combined expenses, and collaborate with real-time roles.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreateGroup}
          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 mx-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Family Group</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-24 lg:pb-8">
      
      {/* Top Group Controls Header */}
      <div className="fintech-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Group Selector Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedGroupId || ''}
              onChange={(e) => onSelectGroup(e.target.value)}
              className="appearance-none bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-2xl px-4 py-2.5 pr-10 text-sm font-extrabold text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
            >
              {groups.map((g) => (
                <option key={g.id || g._id} value={g.id || g._id}>
                  {g.name} ({g.members?.length || 1} members)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* User Role Pill */}
          <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border ${
            isAdmin
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : userRole === 'moderator'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {isAdmin ? <Crown className="w-3.5 h-3.5" /> : userRole === 'moderator' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            <span className="capitalize">{userRole}</span>
          </span>
        </div>

        {/* Group Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenInviteModal}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Link</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={onOpenMemberManagement}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Members ({members.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCreateGroup}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Group</span>
          </button>
        </div>

      </div>

      {/* Grid: Group Hero + Group Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (Span 7) */}
        <div className="lg:col-span-7 space-y-5">
          <HeroBalanceCard
            user={user}
            month={month}
            balance={remainingBalance}
            budget={budget}
            totalSpent={totalSpent}
            isExceeding80={isExceeding80}
            isExceeding100={isExceeding100}
            onOpenMonthSelector={onOpenMonthSelector}
            onOpenBudgetModal={onOpenBudgetModal}
            isFamily={true}
            groupName={currentGroup?.name}
          />

          <MoneySummaryCards
            budget={budget}
            totalSpent={totalSpent}
            onEditBudget={onOpenBudgetModal}
            canEditBudget={isModOrAdmin}
          />

          <BudgetWarningBanner
            budget={budget}
            totalSpent={totalSpent}
            remainingBalance={remainingBalance}
            isExceeding80={isExceeding80}
            isExceeding100={isExceeding100}
            onOpenBudgetModal={onOpenBudgetModal}
          />

          {/* Members Contribution List Card */}
          <div className="fintech-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Group Members & Roles</span>
              </h4>
              <span className="text-xs text-slate-400 font-medium">{members.length} Active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {members.map((m) => (
                <div
                  key={m.userId}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-indigo-600 shadow-sm shrink-0">
                      {m.name ? m.name[0].toUpperCase() : 'M'}
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-900 block truncate">{m.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">@{m.username}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 uppercase tracking-wider ${
                    m.role === 'admin'
                      ? 'bg-amber-100 text-amber-800'
                      : m.role === 'moderator'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column / Group Transactions (Span 5) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Family Transactions</h3>
              <span className="text-xs text-slate-400">{filteredExpenses.length} shared entries</span>
            </div>
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Entry</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search description, member, or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/90 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {['All', ...Object.keys(CATEGORY_CONFIG)].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grouped Transactions */}
          {Object.keys(groupedExpenses).length === 0 ? (
            <div className="fintech-card p-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-2">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-700 block">No Group Transactions</span>
              <span className="text-xs text-slate-400 max-w-xs block mt-0.5">
                Any group member can add shared household expenses here!
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedExpenses).map(([dateKey, items]) => {
                const dayTotal = items.reduce((sum, i) => sum + Number(i.amount || 0), 0);

                return (
                  <div key={dateKey} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1 pt-1">
                      <span>{formatDayHeader(dateKey)}</span>
                      <span className="text-slate-600 font-semibold">{formatINR(dayTotal)}</span>
                    </div>

                    <div className="space-y-2">
                      {items.map((item) => {
                        const conf = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Others;
                        const Icon = ICON_MAP[item.category] || MoreHorizontal;

                        return (
                          <div
                            key={item.id || item._id}
                            className="fintech-card fintech-card-hover p-3.5 sm:p-4 flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                                style={{ backgroundColor: `${conf.color}15`, color: conf.color }}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-sm font-bold text-slate-900 block truncate leading-tight">
                                  {item.description}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                                    style={{ backgroundColor: `${conf.color}15`, color: conf.color }}
                                  >
                                    {conf.name}
                                  </span>
                                  <span className="text-[11px] text-indigo-600 font-semibold">
                                    by {item.userName}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm sm:text-base font-extrabold text-rose-600 block">
                                - {formatINR(item.amount)}
                              </span>

                              {isModOrAdmin && (
                                <div className="hidden group-hover:flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => onOpenEditExpense(item)}
                                    className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                    aria-label="Edit"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteExpense(item.id || item._id)}
                                    className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    aria-label="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
