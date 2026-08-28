import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import PersonalBudgetModel from '../models/PersonalBudget.js';
import PersonalExpenseModel, { VALID_CATEGORIES } from '../models/PersonalExpense.js';

const router = express.Router();

// Helper to get current YYYY-MM
function getCurrentMonth() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// All personal routes require authentication
router.use(authenticateToken);

// Dashboard summary for a specific month
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const month = req.query.month || getCurrentMonth();

    // 1. Get Budget
    const budgetDoc = await PersonalBudgetModel.getBudget(userId, month);
    const budget = budgetDoc ? Number(budgetDoc.amount) : 0;

    // 2. Get Expenses for the month
    const expenses = await PersonalExpenseModel.findByMonth(userId, month);

    // 3. Compute Metrics & Category Breakdown
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
    console.error('Personal dashboard error:', err);
    return res.status(500).json({ error: 'Failed to fetch personal dashboard data.' });
  }
});

// Set or Update Monthly Budget
router.post('/budget', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { month, amount } = req.body;

    const targetMonth = month || getCurrentMonth();
    if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
      return res.status(400).json({ error: 'Month must be in YYYY-MM format.' });
    }

    if (amount === undefined || isNaN(Number(amount)) || Number(amount) < 0) {
      return res.status(400).json({ error: 'Budget amount must be a non-negative number.' });
    }

    const updatedBudget = await PersonalBudgetModel.setBudget(userId, targetMonth, Number(amount));
    return res.json({
      message: 'Monthly budget updated successfully!',
      budget: updatedBudget
    });
  } catch (err) {
    console.error('Set personal budget error:', err);
    return res.status(500).json({ error: 'Failed to update personal budget.' });
  }
});

// Get Expenses for a specific month
router.get('/expenses', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const month = req.query.month || getCurrentMonth();

    const expenses = await PersonalExpenseModel.findByMonth(userId, month);
    return res.json({ month, expenses });
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
