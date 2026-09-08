import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import PersonalIncomeModel from '../models/PersonalIncome.js';
import PersonalExpenseModel, { VALID_CATEGORIES } from '../models/PersonalExpense.js';
import CustomCategoryModel from '../models/CustomCategory.js';

const DEFAULT_CATEGORY_COLORS = {
  Food: '#0EA5E9',
  Shopping: '#F97316',
  Entertainment: '#8B5CF6',
  Medical: '#10B981',
  Transport: '#6366F1',
  Others: '#F43F5E'
};

const DEFAULT_CATEGORY_ICONS = {
  Food: 'Utensils',
  Shopping: 'ShoppingBag',
  Entertainment: 'Film',
  Medical: 'HeartPulse',
  Transport: 'Car',
  Others: 'MoreHorizontal'
};

const router = express.Router();

function getCurrentMonth() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

router.use(authenticateToken);

// Categories Endpoints
// 1. Get all available categories (standard + custom)
router.get('/categories', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const custom = await CustomCategoryModel.findByUserId(userId);
    return res.json({
      standard: VALID_CATEGORIES.map(cat => ({
        name: cat,
        color: DEFAULT_CATEGORY_COLORS[cat] || '#8B5CF6',
        icon: DEFAULT_CATEGORY_ICONS[cat] || 'Tag',
        isCustom: false
      })),
      custom
    });
  } catch (err) {
    console.error('Get categories error:', err);
    return res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// 2. Create custom category
router.post('/categories', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
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

    const existing = await CustomCategoryModel.findByName(userId, trimmedName);
    if (existing) {
      return res.status(400).json({ error: `Category "${trimmedName}" already exists.` });
    }

    const cleanColor = (color && typeof color === 'string' && color.trim()) ? color.trim() : '#6366F1';
    const cleanIcon = (icon && typeof icon === 'string' && icon.trim()) ? icon.trim() : 'Tag';

    const category = await CustomCategoryModel.create({
      userId,
      name: trimmedName,
      color: cleanColor,
      icon: cleanIcon
    });

    return res.status(201).json({
      message: 'Category created successfully!',
      category
    });
  } catch (err) {
    console.error('Create category error:', err);
    return res.status(500).json({ error: 'Failed to create category.' });
  }
});

// 3. Edit custom category
router.put('/categories/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { name, color, icon } = req.body;

    const existing = await CustomCategoryModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    if (String(existing.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Not authorized to edit this category.' });
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

      const duplicate = await CustomCategoryModel.findByName(userId, trimmedName);
      if (duplicate && String(duplicate.id || duplicate._id) !== String(id)) {
        return res.status(400).json({ error: `Category "${trimmedName}" already exists.` });
      }
    }

    const updatedCategory = await CustomCategoryModel.update(id, userId, {
      name: trimmedName,
      color: color !== undefined ? String(color).trim() : undefined,
      icon: icon !== undefined ? String(icon).trim() : undefined
    });

    // If category name was renamed, migrate all expenses using the old name
    if (trimmedName.toLowerCase() !== existing.name.toLowerCase()) {
      await PersonalExpenseModel.renameCategory(userId, existing.name, trimmedName);
    }

    return res.json({
      message: 'Category updated successfully!',
      category: updatedCategory
    });
  } catch (err) {
    console.error('Update category error:', err);
    return res.status(500).json({ error: 'Failed to update category.' });
  }
});

// 4. Delete custom category
router.delete('/categories/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const existing = await CustomCategoryModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    if (String(existing.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Not authorized to delete this category.' });
    }

    // Reassign historical expenses tagged with this category to 'Others'
    await PersonalExpenseModel.renameCategory(userId, existing.name, 'Others');

    await CustomCategoryModel.delete(id, userId);
    return res.json({
      message: `Category "${existing.name}" deleted successfully and expenses reassigned to "Others".`,
      deletedId: id
    });
  } catch (err) {
    console.error('Delete category error:', err);
    return res.status(500).json({ error: 'Failed to delete category.' });
  }
});

// Dashboard / Report summary
// ONLY USER CAN ADD OR DELETE INCOME AND EXPENSE. NO AUTOMATIC INSERTION.
// TOTAL BALANCE IS SHOWN REGARDLESS OF MONTHS.
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { month, startDate, endDate, allTime } = req.query;

    // 1. Calculate All-Time running totals for Total Balance regardless of months
    const allIncomes = await PersonalIncomeModel.findAll(userId);
    const allExpenses = await PersonalExpenseModel.findAll(userId);
    const allTimeTotalIncome = allIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
    const allTimeTotalSpent = allExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const totalBalance = allTimeTotalIncome - allTimeTotalSpent;

    // 2. Fetch period-specific records
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

      periodIncomes = await PersonalIncomeModel.findByDateRange(userId, s.toISOString(), e.toISOString());
      periodExpenses = await PersonalExpenseModel.findByDateRange(userId, s.toISOString(), e.toISOString());
      queryPeriod = `${startDate} to ${endDate}`;
    } else {
      const targetMonth = month || getCurrentMonth();
      queryPeriod = targetMonth;
      periodIncomes = await PersonalIncomeModel.findByMonth(userId, targetMonth);
      periodExpenses = await PersonalExpenseModel.findByMonth(userId, targetMonth);
    }

    // 3. Compute period metrics (strictly what user added, 0 if nothing added)
    const customCats = await CustomCategoryModel.findByUserId(userId);
    const monthlyIncome = periodIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
    let monthlySpent = 0;
    const categoryTotals = {};
    VALID_CATEGORIES.forEach(cat => {
      categoryTotals[cat] = 0;
    });
    customCats.forEach(c => {
      categoryTotals[c.name] = 0;
    });

    periodExpenses.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      monthlySpent += amt;
      const cat = exp.category || 'Others';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    });

    const categoryBreakdown = Object.entries(categoryTotals)
      .filter(([cat, amt]) => VALID_CATEGORIES.includes(cat) || customCats.some(c => c.name === cat) || amt > 0)
      .map(([cat, amt]) => {
        const pct = monthlySpent > 0 ? Number(((amt / monthlySpent) * 100).toFixed(1)) : 0;
        const customMatch = customCats.find(c => c.name.toLowerCase() === cat.toLowerCase());
        return {
          category: cat,
          amount: amt,
          percentage: pct,
          color: customMatch?.color || DEFAULT_CATEGORY_COLORS[cat] || '#8B5CF6',
          icon: customMatch?.icon || DEFAULT_CATEGORY_ICONS[cat] || 'Tag',
          isCustom: Boolean(customMatch)
        };
      });

    const percentSpent = monthlyIncome > 0 ? Number(((monthlySpent / monthlyIncome) * 100).toFixed(1)) : 0;
    const isExceeding80 = monthlyIncome > 0 && monthlySpent >= 0.8 * monthlyIncome;
    const isExceeding100 = monthlyIncome > 0 && monthlySpent > monthlyIncome;

    return res.json({
      period: queryPeriod,
      month: month || getCurrentMonth(),
      startDate: startDate || null,
      endDate: endDate || null,
      allTime: allTime === 'true',
      // True Total Balance across all months:
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
    console.error('Personal dashboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch personal dashboard data.' });
  }
});

// Get Incomes
router.get('/incomes', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { month, startDate, endDate, allTime } = req.query;

    let incomes = [];
    if (allTime === 'true') {
      incomes = await PersonalIncomeModel.findAll(userId);
    } else if (startDate && endDate) {
      incomes = await PersonalIncomeModel.findByDateRange(userId, startDate, endDate);
    } else {
      const targetMonth = month || getCurrentMonth();
      incomes = await PersonalIncomeModel.findByMonth(userId, targetMonth);
    }

    return res.json({ incomes });
  } catch (err) {
    console.error('Get personal incomes error:', err);
    return res.status(500).json({ error: 'Failed to fetch incomes.' });
  }
});

// Add new Income entry (User explicit action only)
router.post('/incomes', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { amount, description, date } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Income amount must be greater than 0.' });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return res.status(400).json({ error: 'Income description is mandatory (e.g. Salary, Share, Gift).' });
    }

    const income = await PersonalIncomeModel.create({
      userId,
      amount: Number(amount),
      description: description.trim(),
      date: date ? new Date(date) : new Date()
    });

    return res.status(201).json({
      message: 'Income added successfully!',
      income
    });
  } catch (err) {
    console.error('Add personal income error:', err);
    return res.status(500).json({ error: 'Failed to add income.' });
  }
});

// Edit existing Income entry
router.put('/incomes/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { amount, description, date } = req.body;

    const existing = await PersonalIncomeModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Income entry not found.' });
    }

    if (String(existing.userId) !== String(userId)) {
      return res.status(403).json({ error: 'You are not authorized to edit this income entry.' });
    }

    if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
      return res.status(400).json({ error: 'Income amount must be greater than 0.' });
    }

    if (description !== undefined && (!description || description.trim().length === 0)) {
      return res.status(400).json({ error: 'Income description cannot be empty.' });
    }

    const updated = await PersonalIncomeModel.update(id, userId, {
      amount,
      description: description ? description.trim() : undefined,
      date
    });

    return res.json({
      message: 'Income updated successfully!',
      income: updated
    });
  } catch (err) {
    console.error('Edit personal income error:', err);
    return res.status(500).json({ error: 'Failed to update income.' });
  }
});

// Delete Income entry (User explicit action only)
router.delete('/incomes/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const existing = await PersonalIncomeModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Income entry not found.' });
    }

    if (String(existing.userId) !== String(userId)) {
      return res.status(403).json({ error: 'You are not authorized to delete this income entry.' });
    }

    await PersonalIncomeModel.delete(id, userId);
    return res.json({ message: 'Income entry deleted successfully!' });
  } catch (err) {
    console.error('Delete personal income error:', err);
    return res.status(500).json({ error: 'Failed to delete income.' });
  }
});

// Get Expenses
router.get('/expenses', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { month, startDate, endDate, allTime } = req.query;

    let expenses = [];
    if (allTime === 'true') {
      expenses = await PersonalExpenseModel.findAll(userId);
    } else if (startDate && endDate) {
      expenses = await PersonalExpenseModel.findByDateRange(userId, startDate, endDate);
    } else {
      const targetMonth = month || getCurrentMonth();
      expenses = await PersonalExpenseModel.findByMonth(userId, targetMonth);
    }

    return res.json({ expenses });
  } catch (err) {
    console.error('Get personal expenses error:', err);
    return res.status(500).json({ error: 'Failed to fetch expenses.' });
  }
});

// Add new expense (User explicit action only)
router.post('/expenses', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
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

    const expense = await PersonalExpenseModel.create({
      userId,
      amount: Number(amount),
      category: category.trim(),
      description: description.trim(),
      date: date ? new Date(date) : new Date()
    });

    return res.status(201).json({
      message: 'Expense added successfully!',
      expense
    });
  } catch (err) {
    console.error('Add personal expense error:', err);
    return res.status(500).json({ error: 'Failed to add expense.' });
  }
});

// Edit existing expense
router.put('/expenses/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const { amount, category, description, date } = req.body;

    const existing = await PersonalExpenseModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    if (String(existing.userId) !== String(userId)) {
      return res.status(403).json({ error: 'You are not authorized to edit this expense.' });
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

    const updated = await PersonalExpenseModel.update(id, userId, {
      amount,
      category: category ? category.trim() : undefined,
      description: description ? description.trim() : undefined,
      date
    });

    return res.json({
      message: 'Expense updated successfully!',
      expense: updated
    });
  } catch (err) {
    console.error('Edit personal expense error:', err);
    return res.status(500).json({ error: 'Failed to update expense.' });
  }
});

// Delete expense (User explicit action only)
router.delete('/expenses/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const existing = await PersonalExpenseModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    if (String(existing.userId) !== String(userId)) {
      return res.status(403).json({ error: 'You are not authorized to delete this expense.' });
    }

    await PersonalExpenseModel.delete(id, userId);
    return res.json({ message: 'Expense deleted successfully!' });
  } catch (err) {
    console.error('Delete personal expense error:', err);
    return res.status(500).json({ error: 'Failed to delete expense.' });
  }
});

export default router;
