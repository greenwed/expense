import { getPgPool, JsonStore } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const incomeStore = new JsonStore('personal_incomes');

export const PersonalIncomeModel = {
  async create({ userId, amount, description, date }) {
    const parsedDate = date ? new Date(date) : new Date();
    const numAmount = Number(amount);
    const uIdStr = String(userId);
    const id = `inc_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        `INSERT INTO personal_incomes (id, user_id, amount, description, date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [id, uIdStr, numAmount, description.trim(), parsedDate]
      );
      return formatIncome(res.rows[0]);
    }

    return incomeStore.insert({
      id,
      userId: uIdStr,
      amount: numAmount,
      description: description.trim(),
      date: parsedDate.toISOString()
    });
  },

  async findByMonth(userId, month) {
    const startOfMonth = `${month}-01 00:00:00+00`;
    const [year, m] = month.split('-').map(Number);
    const nextMonthYear = m === 12 ? year + 1 : year;
    const nextMonthVal = m === 12 ? 1 : m + 1;
    const endOfMonth = `${nextMonthYear}-${String(nextMonthVal).padStart(2, '0')}-01 00:00:00+00`;
    return this.findByDateRange(userId, startOfMonth, endOfMonth);
  },

  async findByDateRange(userId, startDate, endDate) {
    const uIdStr = String(userId);
    const pool = getPgPool();

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (pool) {
      const res = await pool.query(
        `SELECT * FROM personal_incomes
         WHERE user_id = $1 AND date >= $2 AND date <= $3
         ORDER BY date DESC`,
        [uIdStr, start, end]
      );
      return res.rows.map(formatIncome);
    }

    const incomes = incomeStore.find(e => {
      if (String(e.userId) !== uIdStr) return false;
      const d = new Date(e.date);
      return d >= start && d <= end;
    });

    return incomes.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async findAll(userId) {
    const uIdStr = String(userId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        `SELECT * FROM personal_incomes
         WHERE user_id = $1
         ORDER BY date DESC`,
        [uIdStr]
      );
      return res.rows.map(formatIncome);
    }

    const incomes = incomeStore.find(e => String(e.userId) === uIdStr);
    return incomes.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async carryForward(userId, fromMonth, toMonth) {
    const prevIncomes = await this.findByMonth(userId, fromMonth);
    if (!prevIncomes || prevIncomes.length === 0) return [];

    const targetDate = new Date(`${toMonth}-01T09:00:00.000Z`);
    const created = [];

    for (const inc of prevIncomes) {
      const newInc = await this.create({
        userId,
        amount: inc.amount,
        description: inc.description,
        date: targetDate
      });
      created.push(newInc);
    }

    return created;
  },

  async findById(id) {
    const pool = getPgPool();
    if (pool) {
      const res = await pool.query('SELECT * FROM personal_incomes WHERE id = $1 LIMIT 1', [id]);
      return res.rows[0] ? formatIncome(res.rows[0]) : null;
    }
    return incomeStore.findById(id);
  },

  async update(id, userId, { amount, description, date }) {
    const uIdStr = String(userId);
    const pool = getPgPool();

    if (pool) {
      const current = await this.findById(id);
      if (!current) return null;

      const newAmount = amount !== undefined ? Number(amount) : current.amount;
      const newDesc = description !== undefined ? description.trim() : current.description;
      const newDate = date !== undefined ? new Date(date) : new Date(current.date);

      const res = await pool.query(
        `UPDATE personal_incomes
         SET amount = $1, description = $2, date = $3, updated_at = NOW()
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [newAmount, newDesc, newDate, id, uIdStr]
      );
      return res.rows[0] ? formatIncome(res.rows[0]) : null;
    }

    const updatePayload = {
      updatedAt: new Date().toISOString()
    };
    if (amount !== undefined) updatePayload.amount = Number(amount);
    if (description !== undefined) updatePayload.description = description.trim();
    if (date !== undefined) updatePayload.date = new Date(date).toISOString();

    return incomeStore.update(
      e => (e.id === id || e._id === id) && String(e.userId) === uIdStr,
      updatePayload
    );
  },

  async delete(id, userId) {
    const uIdStr = String(userId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        'DELETE FROM personal_incomes WHERE id = $1 AND user_id = $2',
        [id, uIdStr]
      );
      return res.rowCount > 0;
    }

    const count = incomeStore.delete(e => (e.id === id || e._id === id) && String(e.userId) === uIdStr);
    return count > 0;
  }
};

function formatIncome(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    userId: row.user_id,
    amount: Number(row.amount),
    description: row.description,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export default PersonalIncomeModel;
