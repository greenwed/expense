import express from 'express';
import { authenticateToken, requireGroupMember, requireRoles } from '../middleware/auth.js';
import FamilyGroupModel from '../models/FamilyGroup.js';
import FamilyBudgetModel from '../models/FamilyBudget.js';
import FamilyIncomeModel from '../models/FamilyIncome.js';
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

// 2. Create new group
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

// 3. Get group info by invite token
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

// 6. Rename Group
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

// 7. Regenerate / Get Invite Link
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

// 8. Group Dashboard Data (supports month OR custom startDate & endDate)
router.get('/groups/:groupId/dashboard', requireGroupMember, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { month, startDate, endDate } = req.query;

    let incomes = [];
    let expenses = [];
    let queryPeriod = '';

    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setUTCHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setUTCHours(23, 59, 59, 999);

      incomes = await FamilyIncomeModel.findByDateRange(groupId, s.toISOString(), e.toISOString());
      expenses = await FamilyExpenseModel.findByDateRange(groupId, s.toISOString(), e.toISOString());
      queryPeriod = `${startDate} to ${endDate}`;
    } else {
      const targetMonth = month || getCurrentMonth();
      incomes = await FamilyIncomeModel.findByMonth(groupId, targetMonth);
      expenses = await FamilyExpenseModel.findByMonth(groupId, targetMonth);
      queryPeriod = targetMonth;
    }

    // 1. Compute Incomes
    let totalIncome = incomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

    // Fallback to legacy budget if monthly query and no explicit incomes
    if (totalIncome === 0 && !startDate && !endDate) {
      const targetMonth = month || getCurrentMonth();
      const budgetDoc = await FamilyBudgetModel.getBudget(groupId, targetMonth);
      if (budgetDoc && Number(budgetDoc.amount) > 0) {
        totalIncome = Number(budgetDoc.amount);
      }
    }

    // 2. Compute Expenses & Breakdown
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

    const remainingBalance = totalIncome - totalSpent;
    const percentSpent = totalIncome > 0 ? Number(((totalSpent / totalIncome) * 100).toFixed(1)) : 0;
    const isExceeding80 = totalIncome > 0 && totalSpent >= 0.8 * totalIncome;
    const isExceeding100 = totalIncome > 0 && totalSpent > totalIncome;

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
      period: queryPeriod,
      month: month || getCurrentMonth(),
      startDate: startDate || null,
      endDate: endDate || null,
      totalIncome,
      budget: totalIncome,
      totalSpent,
      remainingBalance,
      percentSpent,
      isExceeding80,
      isExceeding100,
      categories: categoryBreakdown,
      categoryBreakdown,
      expenses,
      incomes
    });
  } catch (err) {
    console.error('Family dashboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch family dashboard data.' });
  }
});

// 9. Get Group Incomes
router.get('/groups/:groupId/incomes', requireGroupMember, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { month, startDate, endDate } = req.query;

    let incomes = [];
    if (startDate && endDate) {
      incomes = await FamilyIncomeModel.findByDateRange(groupId, startDate, endDate);
    } else {
      const targetMonth = month || getCurrentMonth();
      incomes = await FamilyIncomeModel.findByMonth(groupId, targetMonth);
    }

    return res.json({ incomes });
  } catch (err) {
    console.error('Get family incomes error:', err);
    return res.status(500).json({ error: 'Failed to fetch family incomes.' });
  }
});

// 10. Add Group Income entry
router.post('/groups/:groupId/incomes', requireGroupMember, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { amount, description, date } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Income amount must be greater than 0.' });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ error: 'Income description is mandatory (e.g. Salary, Shares, Gift).' });
    }

    const income = await FamilyIncomeModel.create({
      groupId,
      user: req.user,
      amount: Number(amount),
      description: description.trim(),
      date: date ? new Date(date) : new Date()
    });

    return res.status(201).json({
      message: 'Family income added successfully!',
      income
    });
  } catch (err) {
    console.error('Add family income error:', err);
    return res.status(500).json({ error: 'Failed to add family income.' });
  }
});

// 11. Edit Group Income entry
router.put('/groups/:groupId/incomes/:incomeId', requireGroupMember, async (req, res) => {
  try {
    const { groupId, incomeId } = req.params;
    const { amount, description, date } = req.body;
    const userId = String(req.user._id || req.user.id);

    const existing = await FamilyIncomeModel.findById(incomeId);
    if (!existing) {
      return res.status(404).json({ error: 'Income entry not found.' });
    }

    if (String(existing.groupId) !== String(groupId)) {
      return res.status(400).json({ error: 'Income entry does not belong to this group.' });
    }

    const isCreator = String(existing.userId) === userId;
    const isModOrAdmin = ['admin', 'moderator'].includes(req.userRole);

    if (!isCreator && !isModOrAdmin) {
      return res.status(403).json({ error: 'Permission denied to edit this income entry.' });
    }

    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      return res.status(400).json({ error: 'Income amount must be greater than 0.' });
    }

    if (description !== undefined && (!description || description.trim().length === 0)) {
      return res.status(400).json({ error: 'Income description cannot be empty.' });
    }

    const updated = await FamilyIncomeModel.update(incomeId, groupId, {
      amount,
      description: description ? description.trim() : undefined,
      date
    });

    return res.json({
      message: 'Family income updated successfully!',
      income: updated
    });
  } catch (err) {
    console.error('Edit family income error:', err);
    return res.status(500).json({ error: 'Failed to update family income.' });
  }
});

// 12. Delete Group Income entry
router.delete('/groups/:groupId/incomes/:incomeId', requireGroupMember, async (req, res) => {
  try {
    const { groupId, incomeId } = req.params;
    const userId = String(req.user._id || req.user.id);

    const existing = await FamilyIncomeModel.findById(incomeId);
    if (!existing) {
      return res.status(404).json({ error: 'Income entry not found.' });
    }

    if (String(existing.groupId) !== String(groupId)) {
      return res.status(400).json({ error: 'Income entry does not belong to this group.' });
    }

    const isCreator = String(existing.userId) === userId;
    const isModOrAdmin = ['admin', 'moderator'].includes(req.userRole);

    if (!isCreator && !isModOrAdmin) {
      return res.status(403).json({ error: 'Permission denied to delete this income entry.' });
    }

    await FamilyIncomeModel.delete(incomeId, groupId);
    return res.json({ message: 'Family income entry deleted successfully!' });
  } catch (err) {
    console.error('Delete family income error:', err);
    return res.status(500).json({ error: 'Failed to delete family income.' });
  }
});

// 13. Add Group Expense
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

// 14. Edit Group Expense
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

// 15. Delete Group Expense
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

// 16. Update Member Role
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

// 17. Remove Member or Leave Group
router.delete('/groups/:groupId/members/:targetUserId', requireGroupMember, async (req, res) => {
  try {
    const { groupId, targetUserId } = req.params;
    const currentUserId = String(req.user._id || req.user.id);
    const isSelfLeaving = currentUserId === String(targetUserId);

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
