import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import SplitFriendModel from '../models/SplitFriend.js';
import SplitGroupModel from '../models/SplitGroup.js';
import SplitExpenseModel from '../models/SplitExpense.js';
import SplitSettlementModel from '../models/SplitSettlement.js';
import SplitActivityModel from '../models/SplitActivity.js';
import { UserModel } from '../models/User.js';

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

    const cleanEmail = email.trim().toLowerCase();
    const targetUser = await UserModel.findByEmail(cleanEmail) || await UserModel.findByUsernameOrEmail(cleanEmail);
    if (!targetUser) {
      return res.status(404).json({ error: `User with email "${email.trim()}" not found.` });
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
    if (!participants || participants.length === 0) {
      return res.status(400).json({ error: 'At least one participant is required.' });
    }

    // Validate and compute participant shares based on splitMethod
    let computedParticipants = [];

    if (splitMethod === 'equal') {
      const count = participants.length;
      const baseShare = Math.floor((parsedAmount / count) * 100) / 100;
      let remainder = Math.round((parsedAmount - (baseShare * count)) * 100) / 100;

      computedParticipants = participants.map((p, idx) => {
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
      computedParticipants = participants.map(p => {
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
        return res.status(400).json({
          error: `Exact split shares (₹${totalExact.toFixed(2)}) must equal the total amount (₹${parsedAmount.toFixed(2)}).`
        });
      }
    } else if (splitMethod === 'percentage') {
      let totalPercent = 0;
      participants.forEach(p => {
        totalPercent += (Number(p.percentage) || 0);
      });

      if (Math.abs(totalPercent - 100) > 0.1) {
        return res.status(400).json({
          error: `Percentages must add up to 100% (currently ${totalPercent}%).`
        });
      }

      let allocatedShares = 0;
      computedParticipants = participants.map((p, idx) => {
        const percent = Number(p.percentage) || 0;
        let share = Math.floor(((percent / 100) * parsedAmount) * 100) / 100;
        allocatedShares += share;

        // Balance remainder onto last item
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
      return res.status(400).json({ error: `Unsupported split method: ${splitMethod}` });
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

// 10. DELETE /api/split/expenses/:id - Delete split expense
router.delete('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await SplitExpenseModel.findById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found.' });
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
      const expDate = (e.date || e.createdAt).slice(0, 10);
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
