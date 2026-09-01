import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import PersonalWorkspace from './pages/PersonalWorkspace';
import FamilyWorkspace from './pages/FamilyWorkspace';
import ReportView from './pages/ReportView';
import SettingsView from './pages/SettingsView';
import AuthPage from './pages/AuthPage';
import JoinGroup from './pages/JoinGroup';

import MonthSelector from './components/MonthSelector';
import QuickAddModal from './components/QuickAddModal';
import ExpenseModal from './components/ExpenseModal';
import ExpenseListModal from './components/ExpenseListModal';
import IncomeModal from './components/IncomeModal';
import IncomeListModal from './components/IncomeListModal';
import CreateGroupModal from './components/CreateGroupModal';
import RenameGroupModal from './components/RenameGroupModal';
import InviteModal from './components/InviteModal';
import MemberManagementModal from './components/MemberManagementModal';
import { getCurrentMonthStr } from './utils/formatters';

export default function App() {
  const { user, loading, apiFetch } = useAuth();

  // Navigation & Workspace State
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'report' | 'family' | 'settings'
  const [month, setMonth] = useState(getCurrentMonthStr());
  const [isAllTime, setIsAllTime] = useState(false);

  // Data States
  const [personalData, setPersonalData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [familyData, setFamilyData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState(null);

  // Modal States
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isExpenseListOpen, setIsExpenseListOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Income Modal States
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [isIncomeListOpen, setIsIncomeListOpen] = useState(false);

  // Group Modals
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isRenameGroupOpen, setIsRenameGroupOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isMemberMgmtOpen, setIsMemberMgmtOpen] = useState(false);

  // Check URL pathname for /join/:token
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/join/')) {
      const token = path.replace('/join/', '').split('/')[0];
      if (token) setInviteToken(token);
    }
  }, []);

  // 1. Fetch Personal Dashboard Data
  const fetchPersonalData = useCallback(async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      const url = isAllTime
        ? '/api/personal/dashboard?allTime=true'
        : `/api/personal/dashboard?month=${month}`;
      const res = await apiFetch(url);
      setPersonalData(res);
    } catch (err) {
      console.error('Failed to fetch personal data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [user, month, isAllTime, apiFetch]);

  // 2. Fetch Family Groups
  const fetchGroups = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiFetch('/api/family/groups');
      setGroups(res.groups || []);
      if (res.groups && res.groups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(res.groups[0]._id || res.groups[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch family groups:', err);
    }
  }, [user, selectedGroupId, apiFetch]);

  // 3. Fetch Selected Family Group Dashboard Data
  const fetchFamilyData = useCallback(async () => {
    if (!user || !selectedGroupId) return;
    try {
      setDataLoading(true);
      const url = isAllTime
        ? `/api/family/groups/${selectedGroupId}/dashboard?allTime=true`
        : `/api/family/groups/${selectedGroupId}/dashboard?month=${month}`;
      const res = await apiFetch(url);
      setFamilyData(res);
    } catch (err) {
      console.error('Failed to fetch family data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [user, selectedGroupId, month, isAllTime, apiFetch]);

  useEffect(() => {
    if (user) {
      fetchPersonalData();
      fetchGroups();
    }
  }, [user, month, isAllTime, fetchPersonalData, fetchGroups]);

  useEffect(() => {
    if (user && selectedGroupId) {
      fetchFamilyData();
    }
  }, [user, selectedGroupId, month, isAllTime, fetchFamilyData]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Expense Handlers (User explicit action only)
  const handleSaveExpense = async (expensePayload) => {
    const isFamilyTarget = activeTab === 'family';

    if (editingExpense) {
      if (isFamilyTarget) {
        await apiFetch(`/api/family/groups/${selectedGroupId}/expenses/${editingExpense.id || editingExpense._id}`, {
          method: 'PUT',
          body: expensePayload
        });
        await fetchFamilyData();
      } else {
        await apiFetch(`/api/personal/expenses/${editingExpense.id || editingExpense._id}`, {
          method: 'PUT',
          body: expensePayload
        });
        await fetchPersonalData();
      }
    } else {
      if (isFamilyTarget) {
        if (!selectedGroupId) throw new Error('Please select or create a family group first.');
        await apiFetch(`/api/family/groups/${selectedGroupId}/expenses`, {
          method: 'POST',
          body: expensePayload
        });
        await fetchFamilyData();
      } else {
        await apiFetch('/api/personal/expenses', {
          method: 'POST',
          body: expensePayload
        });
        await fetchPersonalData();
      }
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense entry?')) return;
    const isFamilyTarget = activeTab === 'family';

    try {
      if (isFamilyTarget) {
        await apiFetch(`/api/family/groups/${selectedGroupId}/expenses/${expenseId}`, {
          method: 'DELETE'
        });
        await fetchFamilyData();
      } else {
        await apiFetch(`/api/personal/expenses/${expenseId}`, {
          method: 'DELETE'
        });
        await fetchPersonalData();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete expense entry.');
    }
  };

  // Income Handlers (User explicit action only)
  const handleSaveIncome = async (incomePayload) => {
    const isFamilyTarget = activeTab === 'family';

    if (editingIncome) {
      if (isFamilyTarget) {
        await apiFetch(`/api/family/groups/${selectedGroupId}/incomes/${editingIncome.id || editingIncome._id}`, {
          method: 'PUT',
          body: incomePayload
        });
        await fetchFamilyData();
      } else {
        await apiFetch(`/api/personal/incomes/${editingIncome.id || editingIncome._id}`, {
          method: 'PUT',
          body: incomePayload
        });
        await fetchPersonalData();
      }
    } else {
      if (isFamilyTarget) {
        if (!selectedGroupId) throw new Error('Please select or create a family group first.');
        await apiFetch(`/api/family/groups/${selectedGroupId}/incomes`, {
          method: 'POST',
          body: incomePayload
        });
        await fetchFamilyData();
      } else {
        await apiFetch('/api/personal/incomes', {
          method: 'POST',
          body: incomePayload
        });
        await fetchPersonalData();
      }
    }
  };

  const handleDeleteIncome = async (incomeId) => {
    if (!window.confirm('Are you sure you want to delete this income entry?')) return;
    const isFamilyTarget = activeTab === 'family';

    try {
      if (isFamilyTarget) {
        await apiFetch(`/api/family/groups/${selectedGroupId}/incomes/${incomeId}`, {
          method: 'DELETE'
        });
        await fetchFamilyData();
      } else {
        await apiFetch(`/api/personal/incomes/${incomeId}`, {
          method: 'DELETE'
        });
        await fetchPersonalData();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete income entry.');
    }
  };

  // Group Handlers
  const handleCreateGroup = async (name) => {
    const res = await apiFetch('/api/family/groups', {
      method: 'POST',
      body: { name }
    });
    await fetchGroups();
    if (res.group) {
      setSelectedGroupId(res.group.id || res.group._id);
      setActiveTab('family');
    }
  };

  const handleRenameGroup = async (newName) => {
    await apiFetch(`/api/family/groups/${selectedGroupId}/rename`, {
      method: 'PUT',
      body: { name: newName }
    });
    await fetchGroups();
    await fetchFamilyData();
  };

  const handleRegenerateToken = async () => {
    const res = await apiFetch(`/api/family/groups/${selectedGroupId}/invite`, {
      method: 'POST'
    });
    await fetchGroups();
    return res;
  };

  const handleUpdateRole = async (targetUserId, newRole) => {
    await apiFetch(`/api/family/groups/${selectedGroupId}/members/${targetUserId}`, {
      method: 'PUT',
      body: { role: newRole }
    });
    await fetchGroups();
    await fetchFamilyData();
  };

  const handleRemoveMember = async (targetUserId) => {
    await apiFetch(`/api/family/groups/${selectedGroupId}/members/${targetUserId}`, {
      method: 'DELETE'
    });
    await fetchGroups();
    await fetchFamilyData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-slate-400">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">Loading RupeeTrack...</p>
      </div>
    );
  }

  // Join link landing
  if (inviteToken) {
    return (
      <JoinGroup
        inviteToken={inviteToken}
        onJoined={(groupId) => {
          setInviteToken(null);
          window.history.pushState({}, '', '/');
          setSelectedGroupId(groupId);
          setActiveTab('family');
          fetchGroups();
        }}
      />
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const isFamilyContext = activeTab === 'family';
  const currentIncomes = isFamilyContext ? familyData?.incomes || [] : personalData?.incomes || [];
  const currentExpenses = isFamilyContext ? familyData?.expenses || [] : personalData?.expenses || [];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-indigo-500 selection:text-white">
      
      {/* Clean Desktop Header */}
      <Navbar
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        month={month}
        onOpenMonthSelector={() => setIsMonthOpen(true)}
        onOpenAddExpense={() => {
          setEditingExpense(null);
          setIsExpenseOpen(true);
        }}
        onOpenAddIncome={() => {
          setEditingIncome(null);
          setIsIncomeOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* TAB 1: HOME (Personal) */}
        {activeTab === 'home' && (
          <PersonalWorkspace
            user={user}
            month={month}
            data={personalData}
            loading={dataLoading}
            isAllTime={isAllTime}
            onToggleAllTime={setIsAllTime}
            onOpenManageIncome={() => setIsIncomeListOpen(true)}
            onOpenManageExpenses={() => setIsExpenseListOpen(true)}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setIsExpenseOpen(true);
            }}
            onOpenEditExpense={(item) => {
              setEditingExpense(item);
              setIsExpenseOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {/* TAB 2: REPORT */}
        {activeTab === 'report' && (
          <ReportView
            personalData={personalData}
            familyData={familyData}
            month={month}
            onSelectMonth={(m) => {
              setMonth(m);
              setIsAllTime(false);
            }}
            onOpenMonthSelector={() => setIsMonthOpen(true)}
            onBackToHome={() => setActiveTab('home')}
            groups={groups}
            selectedGroupId={selectedGroupId}
          />
        )}

        {/* TAB 3: FAMILY */}
        {activeTab === 'family' && (
          <FamilyWorkspace
            user={user}
            month={month}
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
            groupData={familyData}
            isAllTime={isAllTime}
            onToggleAllTime={setIsAllTime}
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            onOpenRenameGroup={() => setIsRenameGroupOpen(true)}
            onOpenInviteModal={() => setIsInviteOpen(true)}
            onOpenMemberManagement={() => setIsMemberMgmtOpen(true)}
            onOpenManageIncome={() => setIsIncomeListOpen(true)}
            onOpenManageExpenses={() => setIsExpenseListOpen(true)}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setIsExpenseOpen(true);
            }}
            onOpenEditExpense={(item) => {
              setEditingExpense(item);
              setIsExpenseOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <SettingsView
            onOpenAddIncome={() => {
              setEditingIncome(null);
              setIsIncomeOpen(true);
            }}
          />
        )}

      </main>

      {/* Mobile Bottom Navigation Bar with Center (+) FAB */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* MODALS */}
      
      {/* Mobile Center (+) Quick Action Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSelectAddExpense={() => {
          setEditingExpense(null);
          setIsExpenseOpen(true);
        }}
        onSelectAddIncome={() => {
          setEditingIncome(null);
          setIsIncomeOpen(true);
        }}
      />

      {/* Month Selector */}
      <MonthSelector
        isOpen={isMonthOpen}
        onClose={() => setIsMonthOpen(false)}
        selectedMonth={month}
        onSelectMonth={(m) => {
          setMonth(m);
          setIsAllTime(false);
        }}
      />

      {/* Expense Modal (Input Form for Adding / Editing an Expense) */}
      <ExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => {
          setIsExpenseOpen(false);
          setEditingExpense(null);
        }}
        initialData={editingExpense}
        onSave={handleSaveExpense}
        title={editingExpense ? 'Edit Expense Entry' : 'Add Expense Entry'}
      />

      {/* Expense List Manager Modal (Manage Personal/Family Expenses with Add / Edit / Delete) */}
      <ExpenseListModal
        isOpen={isExpenseListOpen}
        onClose={() => setIsExpenseListOpen(false)}
        expenses={currentExpenses}
        month={month}
        onOpenAddExpense={() => {
          setEditingExpense(null);
          setIsExpenseOpen(true);
        }}
        onOpenEditExpense={(item) => {
          setEditingExpense(item);
          setIsExpenseOpen(true);
        }}
        onDeleteExpense={handleDeleteExpense}
        isFamily={isFamilyContext}
        canManage={true}
      />

      {/* Income Modal (Input Form for Adding / Editing an Income) */}
      <IncomeModal
        isOpen={isIncomeOpen}
        onClose={() => {
          setIsIncomeOpen(false);
          setEditingIncome(null);
        }}
        initialData={editingIncome}
        onSave={handleSaveIncome}
        title={editingIncome ? 'Edit Income Entry' : 'Add Income Entry'}
        isFamily={isFamilyContext}
      />

      {/* Income List Manager Modal (Manage Personal/Family Incomes with Add / Edit / Delete) */}
      <IncomeListModal
        isOpen={isIncomeListOpen}
        onClose={() => setIsIncomeListOpen(false)}
        incomes={currentIncomes}
        month={month}
        onOpenAddIncome={() => {
          setEditingIncome(null);
          setIsIncomeOpen(true);
        }}
        onOpenEditIncome={(item) => {
          setEditingIncome(item);
          setIsIncomeOpen(true);
        }}
        onDeleteIncome={handleDeleteIncome}
        isFamily={isFamilyContext}
        canManage={true}
      />

      {/* Group Modals */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreate={handleCreateGroup}
      />

      <RenameGroupModal
        isOpen={isRenameGroupOpen}
        onClose={() => setIsRenameGroupOpen(false)}
        currentName={groups.find((g) => (g.id || g._id) === selectedGroupId)?.name}
        onRename={handleRenameGroup}
      />

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        group={groups.find((g) => (g.id || g._id) === selectedGroupId)}
        onRegenerateToken={handleRegenerateToken}
      />

      <MemberManagementModal
        isOpen={isMemberMgmtOpen}
        onClose={() => setIsMemberMgmtOpen(false)}
        group={groups.find((g) => (g.id || g._id) === selectedGroupId)}
        currentUser={user}
        onUpdateRole={handleUpdateRole}
        onRemoveMember={handleRemoveMember}
      />

    </div>
  );
}
