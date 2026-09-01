import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import PersonalIncomeModel from '../models/PersonalIncome.js';
import PersonalExpenseModel, { VALID_CATEGORIES } from '../models/PersonalExpense.js';

const router = express.Router();

function getCurrentMonth() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

router.use(authenticateToken);

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
    const monthlyIncome = periodIncomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
    let monthlySpent = 0;
    const categoryTotals = {};
    VALID_CATEGORIES.forEach(cat => {
      categoryTotals[cat] = 0;
    });

    periodExpenses.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      monthlySpent += amt;
      const cat = VALID_CATEGORIES.includes(exp.category) ? exp.category : 'Others';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    });

    const categoryBreakdown = VALID_CATEGORIES.map(cat => {
      const amt = categoryTotals[cat] || 0;
      const pct = monthlySpent > 0 ? Number(((amt / monthlySpent) * 100).toFixed(1)) : 0;
      return {
        category: cat,
        amount: amt,
        percentage: pct
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
