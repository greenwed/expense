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
import BudgetModal from './components/BudgetModal';
import ExpenseModal from './components/ExpenseModal';
import CreateGroupModal from './components/CreateGroupModal';
import RenameGroupModal from './components/RenameGroupModal';
import InviteModal from './components/InviteModal';
import MemberManagementModal from './components/MemberManagementModal';
import { getCurrentMonthStr } from './utils/formatters';

export default function App() {
  const { user, loading, apiFetch } = useAuth();

  // Navigation & Workspace State
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'report' | 'plan' | 'settings'
  const [activeWorkspace, setActiveWorkspace] = useState('personal'); // 'personal' | 'family'
  const [month, setMonth] = useState(getCurrentMonthStr());

  // Data States
  const [personalData, setPersonalData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [familyData, setFamilyData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState(null);

  // Modal States
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
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
      const res = await apiFetch(`/api/personal/dashboard?month=${month}`);
      setPersonalData(res);
    } catch (err) {
      console.error('Failed to fetch personal data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [user, month, apiFetch]);

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
      const res = await apiFetch(`/api/family/groups/${selectedGroupId}/dashboard?month=${month}`);
      setFamilyData(res);
    } catch (err) {
      console.error('Failed to fetch family data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [user, selectedGroupId, month, apiFetch]);

  useEffect(() => {
    if (user) {
      fetchPersonalData();
      fetchGroups();
    }
  }, [user, month, fetchPersonalData, fetchGroups]);

  useEffect(() => {
    if (user && selectedGroupId) {
      fetchFamilyData();
    }
  }, [user, selectedGroupId, month, fetchFamilyData]);

  // If Tab is 'plan', switch to family workspace
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'plan') {
      setActiveWorkspace('family');
    }
  };

  const handleSwitchWorkspace = (ws) => {
    setActiveWorkspace(ws);
    if (ws === 'family' && activeTab !== 'report' && activeTab !== 'settings') {
      setActiveTab('plan');
    } else if (ws === 'personal' && activeTab === 'plan') {
      setActiveTab('home');
    }
  };

  // Expense Handlers
  const handleSaveExpense = async (expensePayload) => {
    const isFamilyTarget = activeTab === 'plan' || activeWorkspace === 'family';

    if (editingExpense) {
      // Edit
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
      // Create
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
    const isFamilyTarget = activeTab === 'plan' || activeWorkspace === 'family';

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

  // Budget Handlers
  const handleSaveBudget = async (amount) => {
    const isFamilyTarget = activeTab === 'plan' || activeWorkspace === 'family';

    if (isFamilyTarget) {
      if (!selectedGroupId) throw new Error('No family group selected.');
      await apiFetch(`/api/family/groups/${selectedGroupId}/budget`, {
        method: 'POST',
        body: { month, amount }
      });
      await fetchFamilyData();
    } else {
      await apiFetch('/api/personal/budget', {
        method: 'POST',
        body: { month, amount }
      });
      await fetchPersonalData();
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
      setActiveWorkspace('family');
      setActiveTab('plan');
    }
  };

  const handleRenameGroup = async (newName) => {
    await apiFetch(`/api/family/groups/${selectedGroupId}/rename`, {
      method: 'PATCH',
      body: { name: newName }
    });
    await fetchGroups();
    await fetchFamilyData();
  };

  const handleRegenerateToken = async () => {
    const res = await apiFetch(`/api/family/groups/${selectedGroupId}/regenerate-token`, {
      method: 'POST'
    });
    await fetchGroups();
    return res;
  };

  const handleUpdateRole = async (targetUserId, newRole) => {
    await apiFetch(`/api/family/groups/${selectedGroupId}/members/${targetUserId}/role`, {
      method: 'PATCH',
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
          setActiveWorkspace('family');
          setSelectedGroupId(groupId);
          setActiveTab('plan');
          fetchGroups();
        }}
      />
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const currentGroup = groups.find((g) => (g.id || g._id) === selectedGroupId);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-indigo-500 selection:text-white">
      
      {/* Desktop & Top Header */}
      <Navbar
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        activeWorkspace={activeWorkspace}
        onSwitchWorkspace={handleSwitchWorkspace}
        month={month}
        onOpenMonthSelector={() => setIsMonthOpen(true)}
        onOpenAddExpense={() => {
          setEditingExpense(null);
          setIsExpenseOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <PersonalWorkspace
            user={user}
            month={month}
            data={personalData}
            loading={dataLoading}
            onOpenMonthSelector={() => setIsMonthOpen(true)}
            onOpenBudgetModal={() => setIsBudgetOpen(true)}
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
            onOpenMonthSelector={() => setIsMonthOpen(true)}
            onBackToHome={() => setActiveTab('home')}
            activeWorkspace={activeWorkspace}
            onSwitchWorkspace={handleSwitchWorkspace}
          />
        )}

        {/* TAB 3: PLAN / FAMILY */}
        {activeTab === 'plan' && (
          <FamilyWorkspace
            user={user}
            month={month}
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
            groupData={familyData}
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            onOpenRenameGroup={() => setIsRenameGroupOpen(true)}
            onOpenInviteModal={() => setIsInviteOpen(true)}
            onOpenMemberManagement={() => setIsMemberMgmtOpen(true)}
            onOpenBudgetModal={() => setIsBudgetOpen(true)}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setIsExpenseOpen(true);
            }}
            onOpenEditExpense={(item) => {
              setEditingExpense(item);
              setIsExpenseOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
            onOpenMonthSelector={() => setIsMonthOpen(true)}
          />
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <SettingsView
            onOpenBudgetModal={() => setIsBudgetOpen(true)}
          />
        )}

      </main>

      {/* Mobile Bottom Navigation Bar with Center (+) FAB */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        onOpenAddExpense={() => {
          setEditingExpense(null);
          setIsExpenseOpen(true);
        }}
      />

      {/* MODALS */}
      <MonthSelector
        isOpen={isMonthOpen}
        onClose={() => setIsMonthOpen(false)}
        selectedMonth={month}
        onSelectMonth={setMonth}
      />

      <BudgetModal
        isOpen={isBudgetOpen}
        onClose={() => setIsBudgetOpen(false)}
        currentBudget={
          activeTab === 'plan' || activeWorkspace === 'family'
            ? familyData?.budget || 0
            : personalData?.budget || 0
        }
        month={month}
        onSave={handleSaveBudget}
        isFamily={activeTab === 'plan' || activeWorkspace === 'family'}
        groupName={currentGroup?.name}
      />

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

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreate={handleCreateGroup}
      />

      <RenameGroupModal
        isOpen={isRenameGroupOpen}
        onClose={() => setIsRenameGroupOpen(false)}
        currentName={currentGroup?.name}
        onRename={handleRenameGroup}
      />

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        group={currentGroup}
        onRegenerateToken={handleRegenerateToken}
      />

      <MemberManagementModal
        isOpen={isMemberMgmtOpen}
        onClose={() => setIsMemberMgmtOpen(false)}
        group={currentGroup}
        currentUser={user}
        onUpdateRole={handleUpdateRole}
        onRemoveMember={handleRemoveMember}
      />

    </div>
  );
}
