import express from 'express';
import { authenticateToken, requireGroupMember, requireRoles } from '../middleware/auth.js';
import FamilyGroupModel from '../models/FamilyGroup.js';
import FamilyBudgetModel from '../models/FamilyBudget.js';
import FamilyExpenseModel from '../models/FamilyExpense.js';
import { VALID_CATEGORIES } from '../models/PersonalExpense.js';

const router = express.Router();

function getCurrentMonth() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

router.use(authenticateToken);

// 1. List user's groups
router.get('/groups', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const groups = await FamilyGroupModel.findUserGroups(userId);
    
    // Map with current user's role in each group
    const mapped = groups.map(g => {
      const myMember = (g.members || []).find(m => String(m.userId) === String(userId));
      return {
        ...g,
        currentUserRole: myMember ? myMember.role : 'member'
      };
    });

    return res.json({ groups: mapped });
  } catch (err) {
    console.error('List groups error:', err);
    return res.status(500).json({ error: 'Failed to fetch family groups.' });
  }
});

// 2. Create new group (Creator becomes Admin)
router.post('/groups', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Group name is required.' });
    }

    const group = await FamilyGroupModel.create({
      name: name.trim(),
      user: req.user
    });

    return res.status(201).json({
      message: 'Family group created successfully!',
      group: {
        ...group,
        currentUserRole: 'admin'
      }
    });
  } catch (err) {
    console.error('Create group error:', err);
    return res.status(500).json({ error: 'Failed to create family group.' });
  }
});

// 3. Get group info by invite token (for joining preview)
router.get('/invite-info/:inviteToken', async (req, res) => {
  try {
    const { inviteToken } = req.params;
    const group = await FamilyGroupModel.findByInviteToken(inviteToken);
    if (!group) {
      return res.status(404).json({ error: 'Invalid or expired invite link.' });
    }

    const userId = String(req.user._id || req.user.id);
    const isMember = (group.members || []).some(m => String(m.userId) === userId);

    return res.json({
      groupId: group._id || group.id,
      name: group.name,
      memberCount: (group.members || []).length,
      isMember
    });
  } catch (err) {
    console.error('Invite info error:', err);
    return res.status(500).json({ error: 'Failed to retrieve invite info.' });
  }
});

// 4. Join group via invite token
router.post('/join/:inviteToken', async (req, res) => {
  try {
    const { inviteToken } = req.params;
    const group = await FamilyGroupModel.findByInviteToken(inviteToken);
    if (!group) {
      return res.status(404).json({ error: 'Invalid or expired invite link.' });
    }

    const groupId = group._id || group.id;
    const updatedGroup = await FamilyGroupModel.addMember(groupId, req.user, 'member');

    return res.json({
      message: `Successfully joined ${group.name}!`,
      group: updatedGroup
    });
  } catch (err) {
    console.error('Join group error:', err);
    return res.status(500).json({ error: 'Failed to join group.' });
  }
});

// 5. Get Group Details & Member List
router.get('/groups/:groupId', requireGroupMember, async (req, res) => {
  try {
    return res.json({
      group: req.group,
      currentUserRole: req.userRole
    });
  } catch (err) {
    console.error('Get group details error:', err);
    return res.status(500).json({ error: 'Failed to fetch group details.' });
  }
});

// 6. Rename Group (Admin only)
router.put('/groups/:groupId/rename', requireGroupMember, requireRoles(['admin']), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Valid group name is required.' });
    }

    const updated = await FamilyGroupModel.renameGroup(req.params.groupId, name.trim());
    return res.json({
      message: 'Group renamed successfully!',
      group: updated
    });
  } catch (err) {
    console.error('Rename group error:', err);
    return res.status(500).json({ error: 'Failed to rename group.' });
  }
});

// 7. Regenerate / Get Invite Link (Admin only)
router.post('/groups/:groupId/invite', requireGroupMember, requireRoles(['admin']), async (req, res) => {
  try {
    const updated = await FamilyGroupModel.regenerateInviteToken(req.params.groupId);
    return res.json({
      message: 'New invite link generated!',
      inviteToken: updated.inviteToken
    });
  } catch (err) {
    console.error('Generate invite error:', err);
    return res.status(500).json({ error: 'Failed to generate invite token.' });
  }
});

// 8. Group Dashboard Data (Monthly Summary, Metrics, Breakdown, Expenses)
router.get('/groups/:groupId/dashboard', requireGroupMember, async (req, res) => {
  try {
    const { groupId } = req.params;
    const month = req.query.month || getCurrentMonth();

    // 1. Get Group Budget
    const budgetDoc = await FamilyBudgetModel.getBudget(groupId, month);
    const budget = budgetDoc ? Number(budgetDoc.amount) : 0;

    // 2. Get Group Expenses for Month
    const expenses = await FamilyExpenseModel.findByMonth(groupId, month);

    // 3. Compute Metrics & Breakdown
    let totalSpent = 0;
    const categoryTotals = {};
    VALID_CATEGORIES.forEach(cat => {
      categoryTotals[cat] = 0;
    });

    expenses.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      totalSpent += amt;
      const cat = VALID_CATEGORIES.includes(exp.category) ? exp.category : 'Others';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    });

    const remainingBalance = budget - totalSpent;
    const percentSpent = budget > 0 ? Number(((totalSpent / budget) * 100).toFixed(1)) : 0;
    const isExceeding80 = budget > 0 && totalSpent >= 0.8 * budget;
    const isExceeding100 = budget > 0 && totalSpent > budget;

    const categoryBreakdown = VALID_CATEGORIES.map(cat => {
      const amt = categoryTotals[cat] || 0;
      const pct = totalSpent > 0 ? Number(((amt / totalSpent) * 100).toFixed(1)) : 0;
      return {
        category: cat,
        amount: amt,
        percentage: pct
      };
    });

    return res.json({
      group: req.group,
      currentUserRole: req.userRole,
      month,
      budget,
      totalSpent,
      remainingBalance,
      percentSpent,
      isExceeding80,
      isExceeding100,
      categoryBreakdown,
      expenses
    });
  } catch (err) {
    console.error('Family dashboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch family dashboard data.' });
  }
});

// 9. Set / Update Group Monthly Budget (Admin & Moderator)
router.post('/groups/:groupId/budget', requireGroupMember, requireRoles(['admin', 'moderator']), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { month, amount } = req.body;
    const userId = req.user._id || req.user.id;

    const targetMonth = month || getCurrentMonth();
    if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
      return res.status(400).json({ error: 'Month must be in YYYY-MM format.' });
    }

    if (amount === undefined || isNaN(Number(amount)) || Number(amount) < 0) {
      return res.status(400).json({ error: 'Budget amount must be a non-negative number.' });
    }

    const updatedBudget = await FamilyBudgetModel.setBudget(groupId, targetMonth, Number(amount), userId);
    return res.json({
      message: 'Group monthly budget updated successfully!',
      budget: updatedBudget
    });
  } catch (err) {
    console.error('Set family budget error:', err);
    return res.status(500).json({ error: 'Failed to update family budget.' });
  }
});

// 10. Add Group Expense (All Members: Admin, Moderator, Member)
router.post('/groups/:groupId/expenses', requireGroupMember, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { amount, category, description, date } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Expense amount must be greater than 0.' });
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description is mandatory.' });
    }

    const expense = await FamilyExpenseModel.create({
      groupId,
      user: req.user,
      amount: Number(amount),
      category,
      description: description.trim(),
      date: date ? new Date(date) : new Date()
    });

    return res.status(201).json({
      message: 'Family expense added successfully!',
      expense
    });
  } catch (err) {
    console.error('Add family expense error:', err);
    return res.status(500).json({ error: 'Failed to add family expense.' });
  }
});

// 11. Edit Group Expense (Admin & Moderator only)
router.put('/groups/:groupId/expenses/:expenseId', requireGroupMember, requireRoles(['admin', 'moderator']), async (req, res) => {
  try {
    const { groupId, expenseId } = req.params;
    const { amount, category, description, date } = req.body;

    const existing = await FamilyExpenseModel.findById(expenseId);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    if (String(existing.groupId) !== String(groupId)) {
      return res.status(400).json({ error: 'Expense does not belong to this group.' });
    }

    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      return res.status(400).json({ error: 'Expense amount must be greater than 0.' });
    }

    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    if (description !== undefined && (!description || description.trim().length === 0)) {
      return res.status(400).json({ error: 'Description cannot be empty.' });
    }

    const updated = await FamilyExpenseModel.update(expenseId, groupId, {
      amount,
      category,
      description: description ? description.trim() : undefined,
      date
    });

    return res.json({
      message: 'Family expense updated successfully!',
      expense: updated
    });
  } catch (err) {
    console.error('Edit family expense error:', err);
    return res.status(500).json({ error: 'Failed to update family expense.' });
  }
});

// 12. Delete Group Expense (Admin & Moderator only)
router.delete('/groups/:groupId/expenses/:expenseId', requireGroupMember, requireRoles(['admin', 'moderator']), async (req, res) => {
  try {
    const { groupId, expenseId } = req.params;

    const existing = await FamilyExpenseModel.findById(expenseId);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    if (String(existing.groupId) !== String(groupId)) {
      return res.status(400).json({ error: 'Expense does not belong to this group.' });
    }

    await FamilyExpenseModel.delete(expenseId, groupId);
    return res.json({ message: 'Family expense deleted successfully!' });
  } catch (err) {
    console.error('Delete family expense error:', err);
    return res.status(500).json({ error: 'Failed to delete family expense.' });
  }
});

// 13. Update Member Role (Admin only)
router.put('/groups/:groupId/members/:targetUserId', requireGroupMember, requireRoles(['admin']), async (req, res) => {
  try {
    const { groupId, targetUserId } = req.params;
    const { role } = req.body;

    if (!['admin', 'moderator', 'member'].includes(role)) {
      return res.status(400).json({ error: "Role must be 'admin', 'moderator', or 'member'." });
    }

    const updatedGroup = await FamilyGroupModel.updateMemberRole(groupId, targetUserId, role);
    return res.json({
      message: 'Member role updated successfully!',
      group: updatedGroup
    });
  } catch (err) {
    console.error('Update role error:', err);
    return res.status(500).json({ error: 'Failed to update member role.' });
  }
});

// 14. Remove Member or Leave Group
router.delete('/groups/:groupId/members/:targetUserId', requireGroupMember, async (req, res) => {
  try {
    const { groupId, targetUserId } = req.params;
    const currentUserId = String(req.user._id || req.user.id);
    const isSelfLeaving = currentUserId === String(targetUserId);

    // Only Admin can remove other members; any member can leave themselves
    if (!isSelfLeaving && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can remove other members from the group.' });
    }

    const updatedGroup = await FamilyGroupModel.removeMember(groupId, targetUserId);
    return res.json({
      message: isSelfLeaving ? 'You left the group.' : 'Member removed from group.',
      group: updatedGroup
    });
  } catch (err) {
    console.error('Remove member error:', err);
    return res.status(500).json({ error: 'Failed to remove member.' });
  }
});

export default router;
