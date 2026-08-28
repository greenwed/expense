import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import PersonalWorkspace from './pages/PersonalWorkspace';
import FamilyWorkspace from './pages/FamilyWorkspace';
import AuthPage from './pages/AuthPage';
import JoinGroup from './pages/JoinGroup';

export default function App() {
  const { user, loading, apiFetch } = useAuth();
  const [activeWorkspace, setActiveWorkspace] = useState('personal'); // 'personal' | 'family'
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [inviteToken, setInviteToken] = useState(null);

  // Check URL pathname for /join/:token
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/join/')) {
      const token = path.replace('/join/', '').split('/')[0];
      if (token) setInviteToken(token);
    }
  }, []);

  const fetchGroups = async () => {
    if (!user) return;
    try {
      const res = await apiFetch('/api/family/groups');
      setGroups(res.groups || []);
      if (res.groups && res.groups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(res.groups[0]._id || res.groups[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-400">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-tight text-slate-300">Loading RupeeTrack...</p>
      </div>
    );
  }

  // If invited via /join/:token
  if (inviteToken) {
    return (
      <JoinGroup
        inviteToken={inviteToken}
        onJoined={(groupId) => {
          setInviteToken(null);
          window.history.pushState({}, '', '/');
          setActiveWorkspace('family');
          setSelectedGroupId(groupId);
          fetchGroups();
        }}
      />
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
      
      {/* Navigation & Workspace Switcher */}
      <Navbar
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
        groupCount={groups.length}
      />

      {/* Main Workspace View */}
      <main className="flex-1 pb-16">
        {activeWorkspace === 'personal' ? (
          <PersonalWorkspace />
        ) : (
          <FamilyWorkspace
            groups={groups}
            onRefreshGroups={fetchGroups}
            selectedGroupId={selectedGroupId}
            onSelectGroupId={setSelectedGroupId}
          />
        )}
      </main>

      {/* Modern Footer */}
      <footer className="py-6 border-t border-slate-800/60 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>RupeeTrack • Smart Expense Tracker & Family Budget</span>
          <span className="text-slate-400">All amounts in Indian Rupee (₹) • Theoretical & Secure</span>
        </div>
      </footer>

    </div>
  );
}
