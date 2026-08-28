import { getPgPool, JsonStore } from '../config/db.js';
import { VALID_CATEGORIES } from './PersonalExpense.js';
import { v4 as uuidv4 } from 'uuid';

const familyExpenseStore = new JsonStore('family_expenses');

export const FamilyExpenseModel = {
  async create({ groupId, user, amount, category, description, date }) {
    const parsedDate = date ? new Date(date) : new Date();
    const numAmount = Number(amount);
    const uId = String(user._id || user.id);
    const gId = String(groupId);
    const id = `fex_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        `INSERT INTO family_expenses (id, group_id, user_id, user_name, user_username, amount, category, description, date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         RETURNING *`,
        [id, gId, uId, user.name, user.username, numAmount, category, description, parsedDate]
      );
      return formatFamilyExpense(res.rows[0]);
    }

    return familyExpenseStore.insert({
      id,
      groupId: gId,
      userId: uId,
      userName: user.name,
      userUsername: user.username,
      amount: numAmount,
      category,
      description,
      date: parsedDate.toISOString()
    });
  },

  async findByMonth(groupId, month) {
    const gIdStr = String(groupId);
    const pool = getPgPool();

    if (pool) {
      const startOfMonth = `${month}-01 00:00:00+00`;
      const [year, m] = month.split('-').map(Number);
      const nextMonthYear = m === 12 ? year + 1 : year;
      const nextMonthVal = m === 12 ? 1 : m + 1;
      const endOfMonth = `${nextMonthYear}-${String(nextMonthVal).padStart(2, '0')}-01 00:00:00+00`;

      const res = await pool.query(
        `SELECT * FROM family_expenses
         WHERE group_id = $1 AND date >= $2 AND date < $3
         ORDER BY date DESC`,
        [gIdStr, startOfMonth, endOfMonth]
      );
      return res.rows.map(formatFamilyExpense);
    }

    const expenses = familyExpenseStore.find(e => {
      if (String(e.groupId) !== gIdStr) return false;
      const d = new Date(e.date);
      const itemMonth = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      return itemMonth === month;
    });

    return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async findById(expenseId) {
    const eIdStr = String(expenseId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query('SELECT * FROM family_expenses WHERE id = $1 LIMIT 1', [eIdStr]);
      return res.rows[0] ? formatFamilyExpense(res.rows[0]) : null;
    }

    return familyExpenseStore.findById(eIdStr);
  },

  async update(expenseId, groupId, { amount, category, description, date }) {
    const eIdStr = String(expenseId);
    const gIdStr = String(groupId);
    const pool = getPgPool();

    if (pool) {
      const current = await this.findById(eIdStr);
      if (!current) return null;

      const newAmount = amount !== undefined ? Number(amount) : current.amount;
      const newCategory = category !== undefined ? category : current.category;
      const newDesc = description !== undefined ? description : current.description;
      const newDate = date !== undefined ? new Date(date) : new Date(current.date);

      const res = await pool.query(
        `UPDATE family_expenses
         SET amount = $1, category = $2, description = $3, date = $4, updated_at = NOW()
         WHERE id = $5 AND group_id = $6
         RETURNING *`,
        [newAmount, newCategory, newDesc, newDate, eIdStr, gIdStr]
      );
      return res.rows[0] ? formatFamilyExpense(res.rows[0]) : null;
    }

    const updatePayload = {
      updatedAt: new Date().toISOString()
    };
    if (amount !== undefined) updatePayload.amount = Number(amount);
    if (category !== undefined) updatePayload.category = category;
    if (description !== undefined) updatePayload.description = description;
    if (date !== undefined) updatePayload.date = new Date(date).toISOString();

    return familyExpenseStore.update(
      e => (e.id === eIdStr || e._id === eIdStr) && String(e.groupId) === gIdStr,
      updatePayload
    );
  },

  async delete(expenseId, groupId) {
    const eIdStr = String(expenseId);
    const gIdStr = String(groupId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        'DELETE FROM family_expenses WHERE id = $1 AND group_id = $2',
        [eIdStr, gIdStr]
      );
      return res.rowCount > 0;
    }

    const count = familyExpenseStore.delete(
      e => (e.id === eIdStr || e._id === eIdStr) && String(e.groupId) === gIdStr
    );
    return count > 0;
  }
};

function formatFamilyExpense(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    userName: row.user_name,
    userUsername: row.user_username,
    amount: Number(row.amount),
    category: row.category,
    description: row.description,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export default FamilyExpenseModel;
