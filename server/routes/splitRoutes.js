import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import SplitFriendModel from '../models/SplitFriend.js';
import SplitGroupModel from '../models/SplitGroup.js';
import SplitExpenseModel from '../models/SplitExpense.js';
import SplitSettlementModel from '../models/SplitSettlement.js';
import SplitActivityModel from '../models/SplitActivity.js';
import CustomCategoryModel from '../models/CustomCategory.js';
import CategorySuggestionModel from '../models/CategorySuggestion.js';
import { UserModel } from '../models/User.js';
import { VALID_CATEGORIES, GLOBAL_CATEGORIES } from '../models/PersonalExpense.js';

const router = express.Router();

router.use(authenticateToken);

/**
 * Helper: Calculate pairwise balances for a list of expenses and settlements.
 * Returns a map: { [otherUserId]: netBalance }
 * where netBalance > 0 means otherUser owes currentUser,
 * and netBalance < 0 means currentUser owes otherUser.
 */
function calculatePairwiseBalances(currentUserId, expenses, settlements) {
  const uId = String(currentUserId);
  const balances = {}; // { [userId]: number }

  // Process expenses
  for (const exp of expenses) {
    const payerId = String(exp.payerId);
    const participants = exp.participants || [];

    for (const p of participants) {
      const participantId = String(p.userId);
      const share = Number(p.shareAmount) || 0;
      if (share <= 0 || participantId === payerId) continue;

      if (payerId === uId) {
        // Current user paid, participant owes current user
        balances[participantId] = (balances[participantId] || 0) + share;
      } else if (participantId === uId) {
        // Someone else paid for current user, current user owes payer
        balances[payerId] = (balances[payerId] || 0) - share;
      }
    }
  }

  // Process settlements
  for (const stl of settlements) {
    const payerId = String(stl.payerId);
    const payeeId = String(stl.payeeId);
    const amt = Number(stl.amount) || 0;
    if (amt <= 0 || payerId === payeeId) continue;

    if (payeeId === uId) {
      // Current user was paid by someone, reducing what they owe current user
      balances[payerId] = (balances[payerId] || 0) - amt;
    } else if (payerId === uId) {
      // Current user paid someone, reducing what current user owes them
      balances[payeeId] = (balances[payeeId] || 0) + amt;
    }
  }

  return balances;
}

// 1. GET /api/split/dashboard - Overview metrics, groups, friends, recent activity
router.get('/dashboard', async (req, res) => {
  try {
    const userId = String(req.user._id || req.user.id);

    const [groups, friends, expenses, settlements, activities] = await Promise.all([
      SplitGroupModel.findUserGroups(userId),
      SplitFriendModel.findUserFriends(userId),
      SplitExpenseModel.findUserExpenses(userId),
      SplitSettlementModel.findUserSettlements(userId),
      SplitActivityModel.findRecent(25)
    ]);

    const pairwise = calculatePairwiseBalances(userId, expenses, settlements);

    let totalOwedToYou = 0;
    let totalYouOwe = 0;

    // Attach balance to each friend
    const friendsWithBalances = friends.map(f => {
      const net = pairwise[String(f.friendId)] || 0;
      if (net > 0) totalOwedToYou += net;
      else if (net < 0) totalYouOwe += Math.abs(net);

      return {
        ...f,
        netBalance: Math.round(net * 100) / 100
      };
    });

    // Also account for group members who might not yet be in friends list
    Object.entries(pairwise).forEach(([otherId, net]) => {
      const inFriends = friends.some(f => String(f.friendId) === otherId);
      if (!inFriends) {
        if (net > 0) totalOwedToYou += net;
        else if (net < 0) totalYouOwe += Math.abs(net);
      }
    });

    // Compute group balances
    const groupsWithBalances = groups.map(g => {
      const gId = String(g.id || g._id);
      const groupExpenses = expenses.filter(e => String(e.groupId) === gId);
      const groupSettlements = settlements.filter(s => String(s.groupId) === gId);
      const groupPairwise = calculatePairwiseBalances(userId, groupExpenses, groupSettlements);

      let groupNet = 0;
      Object.values(groupPairwise).forEach(v => { groupNet += v; });

      const totalGroupSpent = groupExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      return {
        ...g,
        totalSpent: Math.round(totalGroupSpent * 100) / 100,
        netBalance: Math.round(groupNet * 100) / 100,
        expenseCount: groupExpenses.length
      };
    });

    return res.json({
      summary: {
        totalOwedToYou: Math.round(totalOwedToYou * 100) / 100,
        totalYouOwe: Math.round(totalYouOwe * 100) / 100,
        netBalance: Math.round((totalOwedToYou - totalYouOwe) * 100) / 100
      },
      groups: groupsWithBalances,
      friends: friendsWithBalances,
      recentActivities: activities
    });
  } catch (err) {
    console.error('Split dashboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch split dashboard data.' });
  }
});

// 2. GET /api/split/friends - List user friends with balances
router.get('/friends', async (req, res) => {
  try {
    const userId = String(req.user._id || req.user.id);
    const [friends, expenses, settlements, inviteToken] = await Promise.all([
      SplitFriendModel.findUserFriends(userId),
      SplitExpenseModel.findUserExpenses(userId),
      SplitSettlementModel.findUserSettlements(userId),
      SplitFriendModel.getOrCreateInviteToken(userId)
    ]);

    const pairwise = calculatePairwiseBalances(userId, expenses, settlements);

    const friendsWithBalances = friends.map(f => ({
      ...f,
      netBalance: Math.round((pairwise[String(f.friendId)] || 0) * 100) / 100
    }));

    return res.json({
      friends: friendsWithBalances,
      inviteToken
    });
  } catch (err) {
    console.error('Split friends error:', err);
    return res.status(500).json({ error: 'Failed to fetch friends.' });
  }
});

// 3. POST /api/split/friends/invite - Get or create user friend invite token
router.post('/friends/invite', async (req, res) => {
  try {
    const userId = String(req.user._id || req.user.id);
    const inviteToken = await SplitFriendModel.getOrCreateInviteToken(userId);
    return res.json({ inviteToken });
  } catch (err) {
    console.error('Friend invite error:', err);
    return res.status(500).json({ error: 'Failed to generate invite token.' });
  }
});

// 4. POST /api/split/friends/accept/:inviteToken - Connect via friend invite token
router.post('/friends/accept/:inviteToken', async (req, res) => {
  try {
    const { inviteToken } = req.params;
    const inviter = await SplitFriendModel.findUserByInviteToken(inviteToken);
    if (!inviter) {
      return res.status(404).json({ error: 'Invalid or expired friend invite link.' });
    }

    const currentUserId = String(req.user._id || req.user.id);
    const inviterId = String(inviter._id || inviter.id);

    if (currentUserId === inviterId) {
      return res.status(400).json({ error: 'You cannot add yourself as a friend.' });
    }

    await SplitFriendModel.addMutualFriend(req.user, inviter);

    await SplitActivityModel.log({
      user: req.user,
      type: 'friend_added',
      details: {
        friendName: inviter.name,
        friendUsername: inviter.username
      }
    });

    return res.json({
      message: `You are now friends with ${inviter.name}!`,
      friend: {
        friendId: inviterId,
        friendName: inviter.name,
        friendUsername: inviter.username
      }
    });
  } catch (err) {
    console.error('Accept friend error:', err);
    return res.status(500).json({ error: 'Failed to accept friend invite.' });
  }
});

// 5. POST /api/split/friends/add-by-email - Add friend by registered email ID
router.post('/friends/add-by-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const rawInput = email.trim();
    const clean = rawInput.replace(/^@/, '').toLowerCase();
    const targetUser = await UserModel.findByEmail(clean) || 
                       await UserModel.findByUsername(clean) || 
                       await UserModel.findByUsernameOrEmail(clean);
    if (!targetUser) {
      return res.status(404).json({ error: `User with email "${rawInput}" not found. Ensure they have registered on RupeeTrack.` });
    }

    const currentUserId = String(req.user._id || req.user.id);
    const targetUserId = String(targetUser._id || targetUser.id);

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'You cannot add yourself as a friend.' });
    }

    await SplitFriendModel.addMutualFriend(req.user, targetUser);

    await SplitActivityModel.log({
      user: req.user,
      type: 'friend_added',
      details: {
        friendName: targetUser.name,
        friendEmail: targetUser.email,
        friendUsername: targetUser.username
      }
    });

    return res.json({
      message: `Added ${targetUser.name} as a friend!`,
      friend: {
        friendId: targetUserId,
        friendName: targetUser.name,
        friendEmail: targetUser.email,
        friendUsername: targetUser.username
      }
    });
  } catch (err) {
    console.error('Add friend by email error:', err);
    return res.status(500).json({ error: err.message || 'Failed to add friend.' });
  }
});

// 5b. POST /api/split/friends/add-by-username - Add friend by username or email (backwards compatibility)
router.post('/friends/add-by-username', async (req, res) => {
  try {
    const { username, email } = req.body;
    const identifier = (username || email || '').trim();
    if (!identifier) {
      return res.status(400).json({ error: 'Username or email is required.' });
    }

    let targetUser = await UserModel.findByUsername(identifier);
    if (!targetUser) {
      targetUser = await UserModel.findByEmail(identifier.toLowerCase()) || await UserModel.findByUsernameOrEmail(identifier);
    }
    if (!targetUser) {
      return res.status(404).json({ error: `User with username @${identifier} not found.` });
    }

    const currentUserId = String(req.user._id || req.user.id);
    const targetUserId = String(targetUser._id || targetUser.id);

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'You cannot add yourself as a friend.' });
    }

    await SplitFriendModel.addMutualFriend(req.user, targetUser);

    await SplitActivityModel.log({
      user: req.user,
      type: 'friend_added',
      details: {
        friendName: targetUser.name,
        friendEmail: targetUser.email,
        friendUsername: targetUser.username
      }
    });

    return res.json({
      message: `Added ${targetUser.name} as a friend!`,
      friend: {
        friendId: targetUserId,
        friendName: targetUser.name,
        friendEmail: targetUser.email,
        friendUsername: targetUser.username
      }
    });
  } catch (err) {
    console.error('Add friend by username error:', err);
    return res.status(500).json({ error: err.message || 'Failed to add friend.' });
  }
});

// 6. POST /api/split/groups - Create a new split group
router.post('/groups', async (req, res) => {
  try {
    const { name, members = [] } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Group name is required.' });
    }

    const group = await SplitGroupModel.create({
      name: name.trim(),
      user: req.user,
      initialMembers: members
    });

    await SplitActivityModel.log({
      groupId: group.id,
      user: req.user,
      type: 'group_created',
      details: {
        groupName: group.name,
        memberCount: group.members.length
      }
    });

    return res.status(201).json({
      message: 'Split group created successfully!',
      group
    });
  } catch (err) {
    console.error('Create split group error:', err);
    return res.status(500).json({ error: 'Failed to create split group.' });
  }
});

// 7. GET /api/split/groups/:id - Single group details with members, expenses, and internal balances
router.get('/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = String(req.user._id || req.user.id);

    const group = await SplitGroupModel.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Split group not found.' });
    }

    const [expenses, settlements] = await Promise.all([
      SplitExpenseModel.findByGroup(id),
      SplitSettlementModel.findByGroup(id)
    ]);

    const totalGroupSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const pairwise = calculatePairwiseBalances(userId, expenses, settlements);

    let userNetBalance = 0;
    Object.values(pairwise).forEach(v => { userNetBalance += v; });

    // Detailed member balances in group
    const memberBalances = (group.members || []).map(m => {
      const mId = String(m.userId);
      const isSelf = mId === userId;
      const netWithUser = isSelf ? userNetBalance : (pairwise[mId] || 0);

      return {
        ...m,
        netWithCurrentUser: Math.round(netWithUser * 100) / 100
      };
    });

    return res.json({
      group: {
        ...group,
        totalSpent: Math.round(totalGroupSpent * 100) / 100,
        userNetBalance: Math.round(userNetBalance * 100) / 100,
        members: memberBalances
      },
      expenses,
      settlements
    });
  } catch (err) {
    console.error('Get group error:', err);
    return res.status(500).json({ error: 'Failed to retrieve split group details.' });
  }
});

// 8. POST /api/split/groups/join/:inviteToken - Join group via link
router.post('/groups/join/:inviteToken', async (req, res) => {
  try {
    const { inviteToken } = req.params;
    const group = await SplitGroupModel.findByInviteToken(inviteToken);
    if (!group) {
      return res.status(404).json({ error: 'Invalid or expired group invite link.' });
    }

    const updated = await SplitGroupModel.addMember(group.id, req.user);

    await SplitActivityModel.log({
      groupId: group.id,
      user: req.user,
      type: 'group_joined',
      details: { groupName: group.name }
    });

    return res.json({
      message: `Successfully joined ${group.name}!`,
      group: updated
    });
  } catch (err) {
    console.error('Join split group error:', err);
    return res.status(500).json({ error: 'Failed to join split group.' });
  }
});

// 8b. PUT /api/split/groups/:id - Edit group name (Group Creator only)
router.put('/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const currentUserId = String(req.user._id || req.user.id);

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required.' });
    }

    const group = await SplitGroupModel.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Split group not found.' });
    }

    if (String(group.createdBy) !== currentUserId) {
      return res.status(403).json({ error: 'Only the group creator can edit the group name.' });
    }

    const updated = await SplitGroupModel.updateName(id, name.trim());

    await SplitActivityModel.log({
      groupId: id,
      user: req.user,
      type: 'group_updated',
      details: { groupName: updated.name }
    });

    return res.json({
      message: 'Group name updated successfully!',
      group: updated
    });
  } catch (err) {
    console.error('Update split group error:', err);
    return res.status(500).json({ error: 'Failed to update group name.' });
  }
});

// 8c. POST /api/split/groups/:id/members - Add member to group (Group Creator only)
router.post('/groups/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, email, username } = req.body;
    const currentUserId = String(req.user._id || req.user.id);

    const group = await SplitGroupModel.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Split group not found.' });
    }

    if (String(group.createdBy) !== currentUserId) {
      return res.status(403).json({ error: 'Only the group creator can add members.' });
    }

    let targetUser = null;
    if (userId) {
      targetUser = await UserModel.findById(userId);
    } else if (email) {
      const cleanEmail = email.trim().replace(/^@/, '').toLowerCase();
      targetUser = await UserModel.findByEmail(cleanEmail) || await UserModel.findByUsernameOrEmail(cleanEmail);
    } else if (username) {
      const cleanUser = username.trim().replace(/^@/, '');
      targetUser = await UserModel.findByUsername(cleanUser) || await UserModel.findByUsernameOrEmail(cleanUser);
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found. Ensure the user is registered on RupeeTrack.' });
    }

    const targetUserId = String(targetUser._id || targetUser.id);
    const isAlreadyMember = (group.members || []).some(m => String(m.userId) === targetUserId);
    if (isAlreadyMember) {
      return res.status(400).json({ error: `${targetUser.name} is already a member of this group.` });
    }

    const updated = await SplitGroupModel.addMember(id, targetUser);

    await SplitActivityModel.log({
      groupId: id,
      user: req.user,
      type: 'group_member_added',
      details: { groupName: group.name, memberName: targetUser.name }
    });

    return res.json({
      message: `${targetUser.name} added to ${group.name}!`,
      group: updated
    });
  } catch (err) {
    console.error('Add group member error:', err);
    return res.status(500).json({ error: 'Failed to add member to group.' });
  }
});

// 8d. DELETE /api/split/groups/:id/members/:targetUserId - Remove member from group (Group Creator only)
router.delete('/groups/:id/members/:targetUserId', async (req, res) => {
  try {
    const { id, targetUserId } = req.params;
    const currentUserId = String(req.user._id || req.user.id);

    const group = await SplitGroupModel.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Split group not found.' });
    }

    if (String(group.createdBy) !== currentUserId) {
      return res.status(403).json({ error: 'Only the group creator can remove members.' });
    }

    if (String(targetUserId) === currentUserId) {
      return res.status(400).json({ error: 'The group creator cannot be removed from the group. You can delete the group instead.' });
    }

    const memberExists = (group.members || []).some(m => String(m.userId) === String(targetUserId));
    if (!memberExists) {
      return res.status(404).json({ error: 'Member not found in this group.' });
    }

    const targetMember = group.members.find(m => String(m.userId) === String(targetUserId));
    const updated = await SplitGroupModel.removeMember(id, targetUserId);

    await SplitActivityModel.log({
      groupId: id,
      user: req.user,
      type: 'group_member_removed',
      details: { groupName: group.name, memberName: targetMember?.name || 'Member' }
    });

    return res.json({
      message: 'Member removed from group successfully!',
      group: updated
    });
  } catch (err) {
    console.error('Remove group member error:', err);
    return res.status(500).json({ error: 'Failed to remove member from group.' });
  }
});

// 8e. DELETE /api/split/groups/:id - Delete split group (Group Creator only)
router.delete('/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = String(req.user._id || req.user.id);

    const group = await SplitGroupModel.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Split group not found.' });
    }

    if (String(group.createdBy) !== currentUserId) {
      return res.status(403).json({ error: 'Only the group creator can delete this group.' });
    }

    await SplitGroupModel.deleteGroup(id);
    await CustomCategoryModel.deleteByGroupId(id);
    await CategorySuggestionModel.deleteByGroupId(id);

    await SplitActivityModel.log({
      user: req.user,
      type: 'group_deleted',
      details: { groupName: group.name }
    });

    return res.json({ message: 'Group deleted successfully!' });
  } catch (err) {
    console.error('Delete split group error:', err);
    return res.status(500).json({ error: 'Failed to delete split group.' });
  }
});

const DEFAULT_CATEGORY_COLORS = {
  'Food & Dining': '#0EA5E9',
  'Transport': '#6366F1',
  'Rent & Housing': '#F59E0B',
  'Groceries': '#10B981',
  'Healthcare': '#EC4899',
  'Entertainment': '#8B5CF6',
  'Utilities & Bills': '#3B82F6',
  'Travel': '#14B8A6',
  'Education': '#F97316',
  'Shopping': '#EAB308',
  'Work & Business': '#475569',
  'Gifts': '#F43F5E',
  'Fitness': '#06B6D4',
  'Pet Care': '#A855F7',
  'Others': '#64748B',
  Food: '#0EA5E9',
  Medical: '#EC4899',
  Utilities: '#3B82F6'
};

const DEFAULT_CATEGORY_ICONS = {
  'Food & Dining': 'Utensils',
  'Transport': 'Car',
  'Rent & Housing': 'Home',
  'Groceries': 'ShoppingBag',
  'Healthcare': 'HeartPulse',
  'Entertainment': 'Film',
  'Utilities & Bills': 'Zap',
  'Travel': 'Plane',
  'Education': 'GraduationCap',
  'Shopping': 'ShoppingBag',
  'Work & Business': 'Briefcase',
  'Gifts': 'Gift',
  'Fitness': 'Dumbbell',
  'Pet Care': 'PawPrint',
  'Others': 'MoreHorizontal',
  Food: 'Utensils',
  Medical: 'HeartPulse',
  Utilities: 'Zap'
};

async function requireSplitGroupMember(req, res, next) {
  try {
    const groupId = req.params.groupId || req.params.id;
    const userId = String(req.user._id || req.user.id);
    const group = await SplitGroupModel.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Split group not found.' });
    }
    const isMember = (group.members || []).some(m => String(m.userId) === userId) || String(group.createdBy) === userId;
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this split group.' });
    }
    req.splitGroup = group;
    next();
  } catch (err) {
    console.error('requireSplitGroupMember error:', err);
    return res.status(500).json({ error: 'Failed to verify group membership.' });
  }
}

async function requireSplitGroupAdmin(req, res, next) {
  try {
    const groupId = req.params.groupId || req.params.id;
    const userId = String(req.user._id || req.user.id);
    const group = req.splitGroup || await SplitGroupModel.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Split group not found.' });
    }
    if (String(group.createdBy) !== userId) {
      return res.status(403).json({ error: 'Admin / Creator privileges required for this action.' });
    }
    req.splitGroup = group;
    next();
  } catch (err) {
    console.error('requireSplitGroupAdmin error:', err);
    return res.status(500).json({ error: 'Failed to verify group admin privileges.' });
  }
}

// 8g. GET /api/split/groups/:groupId/categories - Get split group categories (Standard + Group Custom)
router.get('/groups/:groupId/categories', requireSplitGroupMember, async (req, res) => {
  try {
    const { groupId } = req.params;
    const custom = await CustomCategoryModel.findByGroupId(groupId);
    return res.json({
      standard: GLOBAL_CATEGORIES.map(cat => ({
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        emoji: cat.emoji,
        isCustom: false
      })),
      custom: custom.map(c => ({
        ...c,
        isCustom: true
      }))
    });
  } catch (err) {
    console.error('Fetch split group categories error:', err);
    return res.status(500).json({ error: 'Failed to fetch split group categories.' });
  }
});

// 8h. POST /api/split/groups/:groupId/categories - Create split group category (Admin/Creator only)
router.post('/groups/:groupId/categories', requireSplitGroupMember, requireSplitGroupAdmin, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { groupId } = req.params;
    const { name, color, icon } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 50) {
      return res.status(400).json({ error: 'Category name cannot exceed 50 characters.' });
    }

    if (VALID_CATEGORIES.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
      return res.status(400).json({ error: `"${trimmedName}" is already a standard category.` });
    }

    // Check 20 custom categories cap
    const existingCount = await CustomCategoryModel.countByGroupId(groupId);
    if (existingCount >= 20) {
      return res.status(400).json({ error: 'Maximum limit of 20 custom categories reached for this group.' });
    }

    // Check duplicate in this split group (case-insensitive)
    const duplicate = await CustomCategoryModel.findByNameInGroup(groupId, trimmedName);
    if (duplicate) {
      return res.status(400).json({ error: `Category "${trimmedName}" is already present in this group.` });
    }

    const cleanColor = color && typeof color === 'string' && color.trim().length > 0 ? color.trim() : '#6366F1';
    const cleanIcon = icon && typeof icon === 'string' && icon.trim().length > 0 ? icon.trim() : 'Tag';

    const category = await CustomCategoryModel.create({
      userId,
      groupId,
      name: trimmedName,
      color: cleanColor,
      icon: cleanIcon
    });

    return res.status(201).json({
      message: 'Category added to split group successfully!',
      category
    });
  } catch (err) {
    console.error('Create split group category error:', err);
    return res.status(500).json({ error: 'Failed to create split group category.' });
  }
});

// 8i. PUT /api/split/groups/:groupId/categories/:id - Update split group category (Admin/Creator only)
router.put('/groups/:groupId/categories/:id', requireSplitGroupMember, requireSplitGroupAdmin, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { groupId, id } = req.params;
    const { name, color, icon } = req.body;

    const existing = await CustomCategoryModel.findById(id);
    if (!existing || String(existing.groupId) !== String(groupId)) {
      return res.status(404).json({ error: 'Split group category not found.' });
    }

    let trimmedName = existing.name;
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Category name cannot be empty.' });
      }
      trimmedName = name.trim();
      if (trimmedName.length > 50) {
        return res.status(400).json({ error: 'Category name cannot exceed 50 characters.' });
      }

      if (VALID_CATEGORIES.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
        return res.status(400).json({ error: `"${trimmedName}" is already a standard category.` });
      }

      const duplicate = await CustomCategoryModel.findByNameInGroup(groupId, trimmedName);
      if (duplicate && String(duplicate.id || duplicate._id) !== String(id)) {
        return res.status(400).json({ error: `Category "${trimmedName}" is already present in this group.` });
      }
    }

    const updatedCategory = await CustomCategoryModel.update(id, userId, {
      name: trimmedName,
      color: color !== undefined ? String(color).trim() : undefined,
      icon: icon !== undefined ? String(icon).trim() : undefined,
      groupId
    });

    // If category name was renamed, migrate all group expenses using the old name
    if (trimmedName.toLowerCase() !== existing.name.toLowerCase()) {
      await SplitExpenseModel.renameCategory(groupId, existing.name, trimmedName);
    }

    return res.json({
      message: 'Split group category updated successfully!',
      category: updatedCategory
    });
  } catch (err) {
    console.error('Update split group category error:', err);
    return res.status(500).json({ error: 'Failed to update split group category.' });
  }
});

// 8j. DELETE /api/split/groups/:groupId/categories/:id - Delete split group category (Admin/Creator only)
router.delete('/groups/:groupId/categories/:id', requireSplitGroupMember, requireSplitGroupAdmin, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { groupId, id } = req.params;

    const existing = await CustomCategoryModel.findById(id);
    if (!existing || String(existing.groupId) !== String(groupId)) {
      return res.status(404).json({ error: 'Split group category not found.' });
    }

    // Reassign historical group expenses tagged with this category to 'Others'
    await SplitExpenseModel.renameCategory(groupId, existing.name, 'Others');

    await CustomCategoryModel.delete(id, userId, { groupId });

    return res.json({
      message: 'Split group category deleted successfully!'
    });
  } catch (err) {
    console.error('Delete split group category error:', err);
    return res.status(500).json({ error: 'Failed to delete split group category.' });
  }
});

// 8k. POST /api/split/groups/:groupId/categories/merge - Merge categories (Admin/Creator only)
router.post('/groups/:groupId/categories/merge', requireSplitGroupMember, requireSplitGroupAdmin, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { sourceCategory, targetCategory } = req.body;

    if (!sourceCategory || !targetCategory) {
      return res.status(400).json({ error: 'Source and target categories are required.' });
    }
    if (sourceCategory.trim().toLowerCase() === targetCategory.trim().toLowerCase()) {
      return res.status(400).json({ error: 'Source and target categories cannot be the same.' });
    }

    const updatedCount = await SplitExpenseModel.renameCategory(groupId, sourceCategory.trim(), targetCategory.trim());

    // If sourceCategory was a custom category in this group, delete it
    const sourceCustom = await CustomCategoryModel.findByNameInGroup(groupId, sourceCategory.trim());
    if (sourceCustom) {
      await CustomCategoryModel.delete(sourceCustom.id || sourceCustom._id, req.user._id || req.user.id, { groupId });
    }

    return res.json({
      message: `Successfully merged "${sourceCategory}" into "${targetCategory}".`,
      updatedCount: updatedCount || 0
    });
  } catch (err) {
    console.error('Merge split group categories error:', err);
    return res.status(500).json({ error: 'Failed to merge categories.' });
  }
});

// 8l. POST /api/split/groups/:groupId/category-suggestions - Submit Category Suggestion (Any member)
router.post('/groups/:groupId/category-suggestions', requireSplitGroupMember, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userName = req.user.name || 'Member';
    const { groupId } = req.params;
    const { name, reason = '' } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required.' });
    }
    const trimmedName = name.trim();
    if (trimmedName.length > 50) {
      return res.status(400).json({ error: 'Category name cannot exceed 50 characters.' });
    }

    if (VALID_CATEGORIES.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
      return res.status(400).json({ error: `"${trimmedName}" is already a standard category.` });
    }

    const duplicate = await CustomCategoryModel.findByNameInGroup(groupId, trimmedName);
    if (duplicate) {
      return res.status(400).json({ error: `Category "${trimmedName}" is already present in this group.` });
    }

    const suggestion = await CategorySuggestionModel.create({
      groupId,
      groupType: 'split',
      userId,
      userName,
      name: trimmedName,
      reason
    });

    return res.status(201).json({
      message: 'Category suggestion submitted successfully!',
      suggestion
    });
  } catch (err) {
    console.error('Submit category suggestion error:', err);
    return res.status(500).json({ error: 'Failed to submit category suggestion.' });
  }
});

// 8m. GET /api/split/groups/:groupId/category-suggestions - Get Category Suggestions (Group members)
router.get('/groups/:groupId/category-suggestions', requireSplitGroupMember, async (req, res) => {
  try {
    const { groupId } = req.params;
    const suggestions = await CategorySuggestionModel.findByGroupId(groupId);
    return res.json({ suggestions });
  } catch (err) {
    console.error('Get category suggestions error:', err);
    return res.status(500).json({ error: 'Failed to fetch category suggestions.' });
  }
});

// 8n. POST /api/split/groups/:groupId/category-suggestions/:id/approve - Approve Category Suggestion (Admin/Creator only)
router.post('/groups/:groupId/category-suggestions/:id/approve', requireSplitGroupMember, requireSplitGroupAdmin, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { groupId, id } = req.params;
    const { color = '#6366F1', icon = 'Tag' } = req.body || {};

    const suggestion = await CategorySuggestionModel.findById(id);
    if (!suggestion || String(suggestion.groupId) !== String(groupId)) {
      return res.status(404).json({ error: 'Suggestion not found.' });
    }

    const existingCount = await CustomCategoryModel.countByGroupId(groupId);
    if (existingCount >= 20) {
      return res.status(400).json({ error: 'Maximum limit of 20 custom categories reached for this group.' });
    }

    const duplicate = await CustomCategoryModel.findByNameInGroup(groupId, suggestion.name);
    let category = duplicate;
    if (!duplicate) {
      category = await CustomCategoryModel.create({
        userId,
        groupId,
        name: suggestion.name,
        color,
        icon
      });
    }

    const updatedSuggestion = await CategorySuggestionModel.updateStatus(id, 'approved');

    return res.json({
      message: `Suggestion "${suggestion.name}" approved and added to group!`,
      category,
      suggestion: updatedSuggestion || { ...suggestion, status: 'approved' }
    });
  } catch (err) {
    console.error('Approve category suggestion error:', err);
    return res.status(500).json({ error: 'Failed to approve category suggestion.' });
  }
});

// 8o. POST /api/split/groups/:groupId/category-suggestions/:id/reject - Reject Category Suggestion (Admin/Creator only)
router.post('/groups/:groupId/category-suggestions/:id/reject', requireSplitGroupMember, requireSplitGroupAdmin, async (req, res) => {
  try {
    const { groupId, id } = req.params;
    const suggestion = await CategorySuggestionModel.findById(id);
    if (!suggestion || String(suggestion.groupId) !== String(groupId)) {
      return res.status(404).json({ error: 'Suggestion not found.' });
    }

    const updatedSuggestion = await CategorySuggestionModel.updateStatus(id, 'rejected');

    return res.json({
      message: `Suggestion "${suggestion.name}" rejected.`,
      suggestion: updatedSuggestion || { ...suggestion, status: 'rejected' }
    });
  } catch (err) {
    console.error('Reject category suggestion error:', err);
    return res.status(500).json({ error: 'Failed to reject category suggestion.' });
  }
});

/**
 * Helper: Compute participant shares for split expenses
 */
function computeSplitParticipants({ splitMethod, parsedAmount, participants }) {
  if (!participants || participants.length === 0) {
    throw new Error('At least one participant is required.');
  }

  if (splitMethod === 'equal') {
    const count = participants.length;
    const baseShare = Math.floor((parsedAmount / count) * 100) / 100;
    let remainder = Math.round((parsedAmount - (baseShare * count)) * 100) / 100;

    return participants.map((p, idx) => {
      const extra = idx === 0 ? remainder : 0;
      const share = Math.round((baseShare + extra) * 100) / 100;
      return {
        userId: String(p.userId || p.id),
        name: p.name || p.friendName || 'Member',
        shareAmount: share,
        percentage: Number(((share / parsedAmount) * 100).toFixed(1))
      };
    });
  } else if (splitMethod === 'exact') {
    let totalExact = 0;
    const computed = participants.map(p => {
      const share = Number(p.shareAmount) || 0;
      totalExact += share;
      return {
        userId: String(p.userId || p.id),
        name: p.name || p.friendName || 'Member',
        shareAmount: Math.round(share * 100) / 100,
        percentage: Number(((share / parsedAmount) * 100).toFixed(1))
      };
    });

    if (Math.abs(totalExact - parsedAmount) > 0.05) {
      throw new Error(`Exact split shares (₹${totalExact.toFixed(2)}) must equal the total amount (₹${parsedAmount.toFixed(2)}).`);
    }
    return computed;
  } else if (splitMethod === 'percentage') {
    let totalPercent = 0;
    participants.forEach(p => {
      totalPercent += (Number(p.percentage) || 0);
    });

    if (Math.abs(totalPercent - 100) > 0.1) {
      throw new Error(`Percentages must add up to 100% (currently ${totalPercent}%).`);
    }

    let allocatedShares = 0;
    return participants.map((p, idx) => {
      const percent = Number(p.percentage) || 0;
      let share = Math.floor(((percent / 100) * parsedAmount) * 100) / 100;
      allocatedShares += share;

      if (idx === participants.length - 1) {
        const diff = Math.round((parsedAmount - allocatedShares) * 100) / 100;
        share = Math.round((share + diff) * 100) / 100;
      }

      return {
        userId: String(p.userId || p.id),
        name: p.name || p.friendName || 'Member',
        shareAmount: share,
        percentage: percent
      };
    });
  } else {
    throw new Error(`Unsupported split method: ${splitMethod}`);
  }
}

// 8f. GET /api/split/expenses - Fetch user split expenses (optionally filtered by groupId)
router.get('/expenses', async (req, res) => {
  try {
    const userId = String(req.user._id || req.user.id);
    const { groupId } = req.query;

    let expenses = [];
    if (groupId && groupId !== 'all') {
      expenses = await SplitExpenseModel.findByGroup(groupId);
    } else {
      expenses = await SplitExpenseModel.findUserExpenses(userId);
    }

    return res.json({ expenses });
  } catch (err) {
    console.error('Fetch split expenses error:', err);
    return res.status(500).json({ error: 'Failed to fetch split expenses.' });
  }
});

// 9. POST /api/split/expenses - Add an expense with Equal, Exact, or Percentage split
router.post('/expenses', async (req, res) => {
  try {
    const {
      groupId = null,
      payerId,
      payerName,
      amount,
      description,
      category = 'Others',
      date = new Date().toISOString(),
      splitMethod = 'equal',
      participants = []
    } = req.body;

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Valid expense amount is required.' });
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description is required.' });
    }
    if (!payerId || !payerName) {
      return res.status(400).json({ error: 'Payer information is required.' });
    }

    let computedParticipants;
    try {
      computedParticipants = computeSplitParticipants({
        splitMethod,
        parsedAmount,
        participants
      });
    } catch (valErr) {
      return res.status(400).json({ error: valErr.message });
    }

    const expense = await SplitExpenseModel.create({
      groupId,
      payerId,
      payerName,
      amount: parsedAmount,
      description: description.trim(),
      category,
      date,
      splitMethod,
      participants: computedParticipants,
      user: req.user
    });

    await SplitActivityModel.log({
      groupId,
      user: req.user,
      type: 'expense_added',
      details: {
        description: expense.description,
        amount: expense.amount,
        payerName: expense.payerName,
        splitMethod
      }
    });

    return res.status(201).json({
      message: 'Split expense added successfully!',
      expense
    });
  } catch (err) {
    console.error('Add split expense error:', err);
    return res.status(500).json({ error: err.message || 'Failed to add split expense.' });
  }
});

// 9b. PUT /api/split/expenses/:id - Edit split expense (Creator only)
router.put('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = String(req.user._id || req.user.id);

    const expense = await SplitExpenseModel.findById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    const expenseCreator = String(expense.createdBy || expense.payerId);
    if (expenseCreator !== currentUserId) {
      return res.status(403).json({
        error: 'Only the user who created this expense has permission to edit it.'
      });
    }

    const {
      payerId = expense.payerId,
      payerName = expense.payerName,
      amount = expense.amount,
      description = expense.description,
      category = expense.category || 'Others',
      date = expense.date || new Date().toISOString(),
      splitMethod = expense.splitMethod || 'equal',
      participants = expense.participants || []
    } = req.body;

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Valid expense amount is required.' });
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description is required.' });
    }

    let computedParticipants;
    try {
      computedParticipants = computeSplitParticipants({
        splitMethod,
        parsedAmount,
        participants
      });
    } catch (valErr) {
      return res.status(400).json({ error: valErr.message });
    }

    const updated = await SplitExpenseModel.update(id, {
      payerId,
      payerName,
      amount: parsedAmount,
      description: description.trim(),
      category,
      date,
      splitMethod,
      participants: computedParticipants
    });

    await SplitActivityModel.log({
      groupId: expense.groupId,
      user: req.user,
      type: 'expense_updated',
      details: {
        description: updated.description,
        amount: updated.amount,
        payerName: updated.payerName,
        splitMethod
      }
    });

    return res.json({
      message: 'Split expense updated successfully!',
      expense: updated
    });
  } catch (err) {
    console.error('Update split expense error:', err);
    return res.status(500).json({ error: err.message || 'Failed to update split expense.' });
  }
});

// 10. DELETE /api/split/expenses/:id - Delete split expense (Creator only)
router.delete('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = String(req.user._id || req.user.id);

    const expense = await SplitExpenseModel.findById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    const expenseCreator = String(expense.createdBy || expense.payerId);
    if (expenseCreator !== currentUserId) {
      return res.status(403).json({
        error: 'Only the user who created this expense has permission to delete it.'
      });
    }

    await SplitExpenseModel.delete(id);

    await SplitActivityModel.log({
      groupId: expense.groupId,
      user: req.user,
      type: 'expense_deleted',
      details: {
        description: expense.description,
        amount: expense.amount
      }
    });

    return res.json({ message: 'Expense deleted successfully!' });
  } catch (err) {
    console.error('Delete expense error:', err);
    return res.status(500).json({ error: 'Failed to delete expense.' });
  }
});

// 11. POST /api/split/settle - Settle up debts
router.post('/settle', async (req, res) => {
  try {
    const {
      groupId = null,
      payerId,
      payerName,
      payeeId,
      payeeName,
      amount,
      date = new Date().toISOString(),
      description = null,
      category = 'Settlement',
      note = 'Settled Up'
    } = req.body;

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Valid settlement amount is required.' });
    }
    if (!payerId || !payeeId) {
      return res.status(400).json({ error: 'Payer and Payee are required.' });
    }
    if (String(payerId) === String(payeeId)) {
      return res.status(400).json({ error: 'Payer and payee cannot be the same user.' });
    }

    const settlement = await SplitSettlementModel.create({
      groupId,
      payerId,
      payerName,
      payeeId,
      payeeName,
      amount: parsedAmount,
      date,
      description,
      category,
      note
    });

    await SplitActivityModel.log({
      groupId,
      user: req.user,
      type: 'settlement_recorded',
      details: {
        payerName,
        payeeName,
        amount: parsedAmount,
        description: description || note,
        category,
        note
      }
    });

    return res.status(201).json({
      message: 'Settlement recorded successfully!',
      settlement
    });
  } catch (err) {
    console.error('Record settlement error:', err);
    return res.status(500).json({ error: err.message || 'Failed to record settlement.' });
  }
});

// 12. GET /api/split/activity - Activity log
router.get('/activity', async (req, res) => {
  try {
    const activities = await SplitActivityModel.findRecent(50);
    return res.json({ activities });
  } catch (err) {
    console.error('Split activity error:', err);
    return res.status(500).json({ error: 'Failed to fetch activity log.' });
  }
});

// 13. GET /api/split/reports - Split analytics for Reports tab
router.get('/reports', async (req, res) => {
  try {
    const userId = String(req.user._id || req.user.id);
    const { month, startDate, endDate } = req.query;

    const [expenses, settlements, groups] = await Promise.all([
      SplitExpenseModel.findUserExpenses(userId),
      SplitSettlementModel.findUserSettlements(userId),
      SplitGroupModel.findUserGroups(userId)
    ]);

    // Filter by date range or month
    const filteredExpenses = expenses.filter(e => {
      const rawDate = e.date || e.createdAt;
      const expDate = (rawDate instanceof Date ? rawDate.toISOString() : String(rawDate || '')).slice(0, 10);
      if (startDate && endDate) {
        return expDate >= startDate && expDate <= endDate;
      }
      if (month) {
        return expDate.startsWith(month);
      }
      return true;
    });

    // Summary calculations
    let totalSplitVolume = 0;
    let totalUserPaid = 0;
    let totalUserShare = 0;
    const categoryTotals = {};
    const groupTotals = {};

    filteredExpenses.forEach(e => {
      const amt = Number(e.amount) || 0;
      totalSplitVolume += amt;

      const isPayer = String(e.payerId) === userId;
      if (isPayer) totalUserPaid += amt;

      const myPart = (e.participants || []).find(p => String(p.userId) === userId);
      if (myPart) totalUserShare += (Number(myPart.shareAmount) || 0);

      // Category breakdown
      const cat = e.category || 'Others';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (myPart ? Number(myPart.shareAmount) : 0);

      // Group breakdown
      const gName = (groups.find(g => String(g.id || g._id) === String(e.groupId))?.name) || 'Direct Split';
      groupTotals[gName] = (groupTotals[gName] || 0) + (myPart ? Number(myPart.shareAmount) : 0);
    });

    const pairwise = calculatePairwiseBalances(userId, filteredExpenses, settlements);
    let totalOwedToYou = 0;
    let totalYouOwe = 0;
    Object.values(pairwise).forEach(v => {
      if (v > 0) totalOwedToYou += v;
      else if (v < 0) totalYouOwe += Math.abs(v);
    });

    const categoryBreakdown = Object.entries(categoryTotals).map(([cat, amount]) => ({
      category: cat,
      amount: Math.round(amount * 100) / 100,
      percentage: totalUserShare > 0 ? Number(((amount / totalUserShare) * 100).toFixed(1)) : 0
    }));

    const groupBreakdown = Object.entries(groupTotals).map(([group, amount]) => ({
      group,
      amount: Math.round(amount * 100) / 100,
      percentage: totalUserShare > 0 ? Number(((amount / totalUserShare) * 100).toFixed(1)) : 0
    }));

    return res.json({
      period: { month, startDate, endDate },
      totalSplitVolume: Math.round(totalSplitVolume * 100) / 100,
      totalUserPaid: Math.round(totalUserPaid * 100) / 100,
      totalUserShare: Math.round(totalUserShare * 100) / 100,
      totalOwedToYou: Math.round(totalOwedToYou * 100) / 100,
      totalYouOwe: Math.round(totalYouOwe * 100) / 100,
      netBalance: Math.round((totalOwedToYou - totalYouOwe) * 100) / 100,
      categoryBreakdown,
      groupBreakdown,
      expenses: filteredExpenses
    });
  } catch (err) {
    console.error('Split reports error:', err);
    return res.status(500).json({ error: 'Failed to generate split reports.' });
  }
});

export default router;
