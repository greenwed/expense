import express from 'express';
import { authenticateToken, requireGroupMember, requireRoles } from '../middleware/auth.js';
import FamilyGroupModel from '../models/FamilyGroup.js';
import FamilyIncomeModel from '../models/FamilyIncome.js';
import FamilyExpenseModel from '../models/FamilyExpense.js';
import CustomCategoryModel from '../models/CustomCategory.js';
import CategorySuggestionModel from '../models/CategorySuggestion.js';
import UserModel from '../models/User.js';
import { VALID_CATEGORIES, GLOBAL_CATEGORIES } from '../models/PersonalExpense.js';

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

// 8. Group Dashboard Data
// ONLY USER CAN ADD OR DELETE. TOTAL BALANCE SHOWN REGARDLESS OF MONTHS.
router.get('/groups/:groupId/dashboard', requireGroupMember, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { month, startDate, endDate, allTime } = req.query;

    // 1. All time running balance for group
    const allIncomes = await FamilyIncomeModel.findAll(groupId);
    const allExpenses = await FamilyExpenseModel.findAll(groupId);
    const allTimeTotalIncome = allIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
    const allTimeTotalSpent = allExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const totalBalance = allTimeTotalIncome - allTimeTotalSpent;

    // 2. Period specific records
    let periodIncomes = [];
    let periodExpenses = [];
    let queryPeriod = '';

    if (allTime === 'true') {
      periodIncomes = allIncomes;
      periodExpenses = allExpenses;
      queryPeriod = 'All Time';
    } else if (startDate && endDate) {
      const s = new Date(startDate);
      s.setUTCHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setUTCHours(23, 59, 59, 999);

      periodIncomes = await FamilyIncomeModel.findByDateRange(groupId, s.toISOString(), e.toISOString());
      periodExpenses = await FamilyExpenseModel.findByDateRange(groupId, s.toISOString(), e.toISOString());
      queryPeriod = `${startDate} to ${endDate}`;
    } else {
      const targetMonth = month || getCurrentMonth();
      queryPeriod = targetMonth;
      periodIncomes = await FamilyIncomeModel.findByMonth(groupId, targetMonth);
      periodExpenses = await FamilyExpenseModel.findByMonth(groupId, targetMonth);
    }

    // 3. Compute period metrics
    const groupCustomCats = await CustomCategoryModel.findByGroupId(groupId);
    const monthlyIncome = periodIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
    let monthlySpent = 0;
    const categoryTotals = {};
    VALID_CATEGORIES.forEach(cat => {
      categoryTotals[cat] = 0;
    });
    groupCustomCats.forEach(c => {
      categoryTotals[c.name] = 0;
    });

    periodExpenses.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      monthlySpent += amt;
      const cat = exp.category || 'Others';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    });

    const categoryBreakdown = Object.entries(categoryTotals)
      .filter(([cat, amt]) => VALID_CATEGORIES.includes(cat) || groupCustomCats.some(c => c.name === cat) || amt > 0)
      .map(([cat, amt]) => {
        const pct = monthlySpent > 0 ? Number(((amt / monthlySpent) * 100).toFixed(1)) : 0;
        const customMatch = groupCustomCats.find(c => c.name.toLowerCase() === cat.toLowerCase());
        return {
          category: cat,
          amount: amt,
          percentage: pct,
          color: customMatch ? customMatch.color : (DEFAULT_CATEGORY_COLORS[cat] || DEFAULT_CATEGORY_COLORS.Others),
          icon: customMatch ? customMatch.icon : (DEFAULT_CATEGORY_ICONS[cat] || DEFAULT_CATEGORY_ICONS.Others),
          isCustom: !!customMatch
        };
      });

    const percentSpent = monthlyIncome > 0 ? Number(((monthlySpent / monthlyIncome) * 100).toFixed(1)) : 0;
    const isExceeding80 = monthlyIncome > 0 && monthlySpent >= 0.8 * monthlyIncome;
    const isExceeding100 = monthlyIncome > 0 && monthlySpent > monthlyIncome;

    return res.json({
      group: req.group,
      currentUserRole: req.userRole,
      period: queryPeriod,
      month: month || getCurrentMonth(),
      startDate: startDate || null,
      endDate: endDate || null,
      allTime: allTime === 'true',
      // True Total Running Balance:
      totalBalance,
      remainingBalance: totalBalance,
      allTimeTotalIncome,
      allTimeTotalSpent,
      // Period/Monthly specific:
      totalIncome: monthlyIncome,
      monthlyIncome,
      totalSpent: monthlySpent,
      monthlySpent,
      percentSpent,
      isExceeding80,
      isExceeding100,
      categories: categoryBreakdown,
      categoryBreakdown,
      expenses: periodExpenses,
      incomes: periodIncomes
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
    const { month, startDate, endDate, allTime } = req.query;

    let incomes = [];
    if (allTime === 'true') {
      incomes = await FamilyIncomeModel.findAll(groupId);
    } else if (startDate && endDate) {
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

// 10. Add Group Income entry (User explicit action only)
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

// 12. Delete Group Income entry (User explicit action only)
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

// 13. Add Group Expense (User explicit action only)
router.post('/groups/:groupId/expenses', requireGroupMember, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { amount, category, description, date } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Expense amount must be greater than 0.' });
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0 || category.trim().length > 50) {
      return res.status(400).json({
        error: 'Category must be a non-empty name up to 50 characters.'
      });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ error: 'Description is mandatory.' });
    }

    const expense = await FamilyExpenseModel.create({
      groupId,
      user: req.user,
      amount: Number(amount),
      category: category.trim(),
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

    if (category !== undefined && (!category || typeof category !== 'string' || category.trim().length === 0 || category.trim().length > 50)) {
      return res.status(400).json({
        error: 'Category must be a non-empty name up to 50 characters.'
      });
    }

    if (description !== undefined && (!description || description.trim().length === 0)) {
      return res.status(400).json({ error: 'Description cannot be empty.' });
    }

    const updated = await FamilyExpenseModel.update(expenseId, groupId, {
      amount,
      category: category ? category.trim() : undefined,
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

// 15. Delete Group Expense (User explicit action only)
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

    if (String(req.group.createdBy) === String(targetUserId)) {
      return res.status(400).json({ error: 'The group creator cannot be removed from the group. You can delete the group instead.' });
    }

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

// 17a. Add Member to Group by Email (Admin only)
router.post('/groups/:groupId/members/email', requireGroupMember, requireRoles(['admin']), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email, role = 'member' } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!['admin', 'moderator', 'member'].includes(role)) {
      return res.status(400).json({ error: "Role must be 'admin', 'moderator', or 'member'." });
    }

    const targetUser = await UserModel.findByEmail(email.trim());
    if (!targetUser) {
      return res.status(404).json({ error: `No registered user found with email "${email.trim()}".` });
    }

    const targetUserId = String(targetUser._id || targetUser.id);
    const isAlreadyMember = (req.group.members || []).some(m => String(m.userId) === targetUserId);
    if (isAlreadyMember) {
      return res.status(400).json({ error: `${targetUser.name || targetUser.username} is already a member of this group.` });
    }

    const updatedGroup = await FamilyGroupModel.addMember(groupId, targetUser, role);
    return res.status(200).json({
      message: `${targetUser.name || targetUser.username} added to the group successfully!`,
      group: updatedGroup
    });
  } catch (err) {
    console.error('Add member by email error:', err);
    return res.status(500).json({ error: 'Failed to add member to group.' });
  }
});

// 17b. Delete Family Group (Admin only)
router.delete('/groups/:groupId', requireGroupMember, requireRoles(['admin']), async (req, res) => {
  try {
    const { groupId } = req.params;
    await FamilyExpenseModel.deleteByGroupId(groupId);
    await FamilyIncomeModel.deleteByGroupId(groupId);
    await CustomCategoryModel.deleteByGroupId(groupId);
    await CategorySuggestionModel.deleteByGroupId(groupId);
    await FamilyGroupModel.delete(groupId);
    return res.json({ message: 'Family group deleted successfully!' });
  } catch (err) {
    console.error('Delete family group error:', err);
    return res.status(500).json({ error: 'Failed to delete family group.' });
  }
});

// 18. Get Group Categories (Standard + Group Custom)
router.get('/groups/:groupId/categories', requireGroupMember, async (req, res) => {
  try {
    const { groupId } = req.params;
    const custom = await CustomCategoryModel.findByGroupId(groupId);
    return res.json({
      standard: (GLOBAL_CATEGORIES || VALID_CATEGORIES).map(cat => ({
        name: cat,
        color: DEFAULT_CATEGORY_COLORS[cat] || '#8B5CF6',
        icon: DEFAULT_CATEGORY_ICONS[cat] || 'Tag',
        isCustom: false
      })),
      custom: custom.map(c => ({
        ...c,
        isCustom: true
      }))
    });
  } catch (err) {
    console.error('Fetch group categories error:', err);
    return res.status(500).json({ error: 'Failed to fetch group categories.' });
  }
});

// 19. Create Group Category (Admin only)
router.post('/groups/:groupId/categories', requireGroupMember, requireRoles(['admin']), async (req, res) => {
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

    // Check 20-category cap
    const existingCount = await CustomCategoryModel.countByGroupId(groupId);
    if (existingCount >= 20) {
      return res.status(400).json({ error: 'Maximum limit of 20 custom categories reached for this group.' });
    }

    // Check duplicate in this group (case-insensitive)
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
      message: 'Category added to group successfully!',
      category
    });
  } catch (err) {
    console.error('Create group category error:', err);
    return res.status(500).json({ error: 'Failed to create group category.' });
  }
});

// 20. Update Group Category (Admin only)
router.put('/groups/:groupId/categories/:id', requireGroupMember, requireRoles(['admin']), async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { groupId, id } = req.params;
    const { name, color, icon } = req.body;

    const existing = await CustomCategoryModel.findById(id);
    if (!existing || String(existing.groupId) !== String(groupId)) {
      return res.status(404).json({ error: 'Group category not found.' });
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
      await FamilyExpenseModel.renameCategory(groupId, existing.name, trimmedName);
    }

    return res.json({
      message: 'Group category updated successfully!',
      category: updatedCategory
    });
  } catch (err) {
    console.error('Update group category error:', err);
    return res.status(500).json({ error: 'Failed to update group category.' });
  }
});

// 21. Delete Group Category (Admin only)
router.delete('/groups/:groupId/categories/:id', requireGroupMember, requireRoles(['admin']), async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { groupId, id } = req.params;

    const existing = await CustomCategoryModel.findById(id);
    if (!existing || String(existing.groupId) !== String(groupId)) {
      return res.status(404).json({ error: 'Group category not found.' });
    }

    // Reassign historical group expenses tagged with this category to 'Others'
    await FamilyExpenseModel.renameCategory(groupId, existing.name, 'Others');

    await CustomCategoryModel.delete(id, userId, { groupId });

    return res.json({
      message: 'Group category deleted successfully!'
    });
  } catch (err) {
    console.error('Delete group category error:', err);
    return res.status(500).json({ error: 'Failed to delete group category.' });
  }
});

// 22. Merge Group Categories (Admin only)
router.post('/groups/:groupId/categories/merge', requireGroupMember, requireRoles(['admin']), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { sourceCategory, targetCategory } = req.body;

    if (!sourceCategory || !targetCategory) {
      return res.status(400).json({ error: 'Source and target categories are required.' });
    }
    if (sourceCategory.trim().toLowerCase() === targetCategory.trim().toLowerCase()) {
      return res.status(400).json({ error: 'Source and target categories cannot be the same.' });
    }

    const updatedCount = await FamilyExpenseModel.renameCategory(groupId, sourceCategory.trim(), targetCategory.trim());

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
    console.error('Merge group categories error:', err);
    return res.status(500).json({ error: 'Failed to merge categories.' });
  }
});

// 23. Submit Category Suggestion (Any member)
router.post('/groups/:groupId/category-suggestions', requireGroupMember, async (req, res) => {
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
      groupType: 'family',
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

// 24. Get Category Suggestions (Group members)
router.get('/groups/:groupId/category-suggestions', requireGroupMember, async (req, res) => {
  try {
    const { groupId } = req.params;
    const suggestions = await CategorySuggestionModel.findByGroupId(groupId);
    return res.json({ suggestions });
  } catch (err) {
    console.error('Get category suggestions error:', err);
    return res.status(500).json({ error: 'Failed to fetch category suggestions.' });
  }
});

// 25. Approve Category Suggestion (Admin only)
router.post('/groups/:groupId/category-suggestions/:id/approve', requireGroupMember, requireRoles(['admin']), async (req, res) => {
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

// 26. Reject Category Suggestion (Admin only)
router.post('/groups/:groupId/category-suggestions/:id/reject', requireGroupMember, requireRoles(['admin']), async (req, res) => {
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

export default router;
