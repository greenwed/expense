import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import PersonalBudgetModel from '../models/PersonalBudget.js';
import PersonalIncomeModel from '../models/PersonalIncome.js';
import PersonalExpenseModel, { VALID_CATEGORIES } from '../models/PersonalExpense.js';

const router = express.Router();

function getCurrentMonth() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

router.use(authenticateToken);

// Dashboard / Report summary (supports month OR custom startDate & endDate)
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { month, startDate, endDate } = req.query;

    let incomes = [];
    let expenses = [];
    let queryPeriod = '';

    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setUTCHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setUTCHours(23, 59, 59, 999);

      incomes = await PersonalIncomeModel.findByDateRange(userId, s.toISOString(), e.toISOString());
      expenses = await PersonalExpenseModel.findByDateRange(userId, s.toISOString(), e.toISOString());
      queryPeriod = `${startDate} to ${endDate}`;
    } else {
      const targetMonth = month || getCurrentMonth();
      incomes = await PersonalIncomeModel.findByMonth(userId, targetMonth);
      expenses = await PersonalExpenseModel.findByMonth(userId, targetMonth);
      queryPeriod = targetMonth;
    }

    // 1. Compute Incomes
    let totalIncome = incomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

    // Fallback to legacy budget if monthly query and no explicit incomes
    if (totalIncome === 0 && !startDate && !endDate) {
      const targetMonth = month || getCurrentMonth();
      const budgetDoc = await PersonalBudgetModel.getBudget(userId, targetMonth);
      if (budgetDoc && Number(budgetDoc.amount) > 0) {
        totalIncome = Number(budgetDoc.amount);
      }
    }

    // 2. Compute Expenses & Category Breakdown
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
    console.error('Personal dashboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch personal dashboard data.' });
  }
});

// Get Incomes
router.get('/incomes', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { month, startDate, endDate } = req.query;

    let incomes = [];
    if (startDate && endDate) {
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

// Add new Income entry
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

// Delete Income entry
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
    const { month, startDate, endDate } = req.query;

    let expenses = [];
    if (startDate && endDate) {
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

// Add new expense
router.post('/expenses', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
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

    const expense = await PersonalExpenseModel.create({
      userId,
      amount: Number(amount),
      category,
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

    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    if (description !== undefined && (!description || description.trim().length === 0)) {
      return res.status(400).json({ error: 'Description cannot be empty.' });
    }

    const updated = await PersonalExpenseModel.update(id, userId, {
      amount,
      category,
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

// Delete expense
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
