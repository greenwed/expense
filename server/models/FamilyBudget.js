import { getPgPool, JsonStore } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const familyBudgetStore = new JsonStore('family_budgets');

export const FamilyBudgetModel = {
  async getBudget(groupId, month) {
    const gIdStr = String(groupId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        'SELECT * FROM family_budgets WHERE group_id = $1 AND month = $2 LIMIT 1',
        [gIdStr, month]
      );
      if (res.rows[0]) {
        return {
          id: res.rows[0].id,
          _id: res.rows[0].id,
          groupId: res.rows[0].group_id,
          month: res.rows[0].month,
          amount: Number(res.rows[0].amount) || 0,
          updatedBy: res.rows[0].updated_by,
          updatedAt: res.rows[0].updated_at
        };
      }
      return { groupId: gIdStr, month, amount: 0 };
    }

    const budget = familyBudgetStore.findOne(b => String(b.groupId) === gIdStr && b.month === month);
    return budget || { groupId: gIdStr, month, amount: 0 };
  },

  async setBudget(groupId, month, amount, updatedBy) {
    const gIdStr = String(groupId);
    const numAmount = Math.max(0, Number(amount) || 0);
    const pool = getPgPool();

    if (pool) {
      const id = `fbd_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const res = await pool.query(
        `INSERT INTO family_budgets (id, group_id, month, amount, updated_by, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (group_id, month)
         DO UPDATE SET amount = EXCLUDED.amount, updated_by = EXCLUDED.updated_by, updated_at = NOW()
         RETURNING *`,
        [id, gIdStr, month, numAmount, String(updatedBy)]
      );
      const row = res.rows[0];
      return {
        id: row.id,
        _id: row.id,
        groupId: row.group_id,
        month: row.month,
        amount: Number(row.amount),
        updatedBy: row.updated_by,
        updatedAt: row.updated_at
      };
    }

    const existing = familyBudgetStore.findOne(b => String(b.groupId) === gIdStr && b.month === month);
    if (existing) {
      return familyBudgetStore.update(
        b => String(b.groupId) === gIdStr && b.month === month,
        { amount: numAmount, updatedBy: String(updatedBy), updatedAt: new Date().toISOString() }
      );
    } else {
      return familyBudgetStore.insert({
        groupId: gIdStr,
        month,
        amount: numAmount,
        updatedBy: String(updatedBy),
        updatedAt: new Date().toISOString()
      });
    }
  }
};

export default FamilyBudgetModel;
