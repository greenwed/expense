import { getPgPool, JsonStore } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const budgetStore = new JsonStore('personal_budgets');

export const PersonalBudgetModel = {
  async getBudget(userId, month) {
    const uIdStr = String(userId);
    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        'SELECT * FROM personal_budgets WHERE user_id = $1 AND month = $2 LIMIT 1',
        [uIdStr, month]
      );
      if (res.rows[0]) {
        return {
          id: res.rows[0].id,
          _id: res.rows[0].id,
          userId: res.rows[0].user_id,
          month: res.rows[0].month,
          amount: Number(res.rows[0].amount) || 0,
          updatedAt: res.rows[0].updated_at
        };
      }
      return { userId: uIdStr, month, amount: 0 };
    }

    const budget = budgetStore.findOne(b => String(b.userId) === uIdStr && b.month === month);
    return budget || { userId: uIdStr, month, amount: 0 };
  },

  async setBudget(userId, month, amount) {
    const uIdStr = String(userId);
    const numAmount = Math.max(0, Number(amount) || 0);
    const pool = getPgPool();

    if (pool) {
      const id = `pbd_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const res = await pool.query(
        `INSERT INTO personal_budgets (id, user_id, month, amount, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, month)
         DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()
         RETURNING *`,
        [id, uIdStr, month, numAmount]
      );
      const row = res.rows[0];
      return {
        id: row.id,
        _id: row.id,
        userId: row.user_id,
        month: row.month,
        amount: Number(row.amount),
        updatedAt: row.updated_at
      };
    }

    const existing = budgetStore.findOne(b => String(b.userId) === uIdStr && b.month === month);
    if (existing) {
      return budgetStore.update(
        b => String(b.userId) === uIdStr && b.month === month,
        { amount: numAmount, updatedAt: new Date().toISOString() }
      );
    } else {
      return budgetStore.insert({
        userId: uIdStr,
        month,
        amount: numAmount,
        updatedAt: new Date().toISOString()
      });
    }
  }
};

export default PersonalBudgetModel;
