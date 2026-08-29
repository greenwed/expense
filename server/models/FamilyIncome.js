import { getPgPool, JsonStore } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const familyIncomeStore = new JsonStore('family_incomes');

export const FamilyIncomeModel = {
  async create({ groupId, user, amount, description, date }) {
    const parsedDate = date ? new Date(date) : new Date();
    const numAmount = Number(amount);
    const uId = String(user._id || user.id);
    const gId = String(groupId);
    const id = `finc_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        `INSERT INTO family_incomes (id, group_id, user_id, user_name, user_username, amount, description, date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING *`,
        [id, gId, uId, user.name, user.username, numAmount, description.trim(), parsedDate]
      );
      return formatFamilyIncome(res.rows[0]);
    }

    return familyIncomeStore.insert({
      id,
      groupId: gId,
      userId: uId,
      userName: user.name,
      userUsername: user.username,
      amount: numAmount,
      description: description.trim(),
      date: parsedDate.toISOString()
    });
  },

  async findByMonth(groupId, month) {
    const startOfMonth = `${month}-01 00:00:00+00`;
    const [year, m] = month.split('-').map(Number);
    const nextMonthYear = m === 12 ? year + 1 : year;
    const nextMonthVal = m === 12 ? 1 : m + 1;
    const endOfMonth = `${nextMonthYear}-${String(nextMonthVal).padStart(2, '0')}-01 00:00:00+00`;
    return this.findByDateRange(groupId, startOfMonth, endOfMonth);
  },

  async findByDateRange(groupId, startDate, endDate) {
    const gIdStr = String(groupId);
    const pool = getPgPool();

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (pool) {
      const res = await pool.query(
        `SELECT * FROM family_incomes
         WHERE group_id = $1 AND date >= $2 AND date <= $3
         ORDER BY date DESC`,
        [gIdStr, start, end]
      );
      return res.rows.map(formatFamilyIncome);
    }

    const incomes = familyIncomeStore.find(e => {
      if (String(e.groupId) !== gIdStr) return false;
      const d = new Date(e.date);
      return d >= start && d <= end;
    });

    return incomes.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async findById(incomeId) {
    const iIdStr = String(incomeId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query('SELECT * FROM family_incomes WHERE id = $1 LIMIT 1', [iIdStr]);
      return res.rows[0] ? formatFamilyIncome(res.rows[0]) : null;
    }

    return familyIncomeStore.findById(iIdStr);
  },

  async update(incomeId, groupId, { amount, description, date }) {
    const iIdStr = String(incomeId);
    const gIdStr = String(groupId);
    const pool = getPgPool();

    if (pool) {
      const current = await this.findById(iIdStr);
      if (!current) return null;

      const newAmount = amount !== undefined ? Number(amount) : current.amount;
      const newDesc = description !== undefined ? description.trim() : current.description;
      const newDate = date !== undefined ? new Date(date) : new Date(current.date);

      const res = await pool.query(
        `UPDATE family_incomes
         SET amount = $1, description = $2, date = $3, updated_at = NOW()
         WHERE id = $4 AND group_id = $5
         RETURNING *`,
        [newAmount, newDesc, newDate, iIdStr, gIdStr]
      );
      return res.rows[0] ? formatFamilyIncome(res.rows[0]) : null;
    }

    const updatePayload = {
      updatedAt: new Date().toISOString()
    };
    if (amount !== undefined) updatePayload.amount = Number(amount);
    if (description !== undefined) updatePayload.description = description.trim();
    if (date !== undefined) updatePayload.date = new Date(date).toISOString();

    return familyIncomeStore.update(
      e => (e.id === iIdStr || e._id === iIdStr) && String(e.groupId) === gIdStr,
      updatePayload
    );
  },

  async delete(incomeId, groupId) {
    const iIdStr = String(incomeId);
    const gIdStr = String(groupId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        'DELETE FROM family_incomes WHERE id = $1 AND group_id = $2',
        [iIdStr, gIdStr]
      );
      return res.rowCount > 0;
    }

    const count = familyIncomeStore.delete(
      e => (e.id === iIdStr || e._id === iIdStr) && String(e.groupId) === gIdStr
    );
    return count > 0;
  }
};

function formatFamilyIncome(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    userName: row.user_name,
    userUsername: row.user_username,
    amount: Number(row.amount),
    description: row.description,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export default FamilyIncomeModel;
