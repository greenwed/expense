import { getPgPool, JsonStore } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const splitExpenseStore = new JsonStore('split_expenses');

function formatExpense(row) {
  if (!row) return null;
  let participants = row.participants;
  if (typeof participants === 'string') {
    try { participants = JSON.parse(participants); } catch (e) { participants = []; }
  }
  return {
    id: row.id,
    _id: row.id,
    groupId: row.group_id || row.groupId || null,
    payerId: String(row.payer_id || row.payerId),
    payerName: row.payer_name || row.payerName,
    amount: Number(row.amount),
    description: row.description,
    category: row.category || 'Others',
    date: row.date,
    splitMethod: row.split_method || row.splitMethod || 'equal',
    participants: participants || [],
    createdBy: String(row.created_by || row.createdBy),
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

export const SplitExpenseModel = {
  async create({
    groupId = null,
    payerId,
    payerName,
    amount,
    description,
    category = 'Others',
    date = new Date().toISOString(),
    splitMethod = 'equal',
    participants = [],
    user
  }) {
    const id = `spe_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const createdBy = String(user._id || user.id);
    const parsedAmount = Number(amount);

    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        `INSERT INTO split_expenses 
         (id, group_id, payer_id, payer_name, amount, description, category, date, split_method, participants, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
         RETURNING *`,
        [
          id,
          groupId ? String(groupId) : null,
          String(payerId),
          payerName,
          parsedAmount,
          description.trim(),
          category,
          date,
          splitMethod,
          JSON.stringify(participants),
          createdBy
        ]
      );
      return formatExpense(res.rows[0]);
    }

    const inserted = splitExpenseStore.insert({
      id,
      groupId: groupId ? String(groupId) : null,
      payerId: String(payerId),
      payerName,
      amount: parsedAmount,
      description: description.trim(),
      category,
      date,
      splitMethod,
      participants,
      createdBy
    });
    return formatExpense(inserted);
  },

  async findByGroup(groupId) {
    const gIdStr = String(groupId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        'SELECT * FROM split_expenses WHERE group_id = $1 ORDER BY date DESC, created_at DESC',
        [gIdStr]
      );
      return res.rows.map(formatExpense);
    }

    const items = splitExpenseStore.find(e => String(e.groupId) === gIdStr);
    return items.map(formatExpense).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async findUserExpenses(userId) {
    const uIdStr = String(userId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query('SELECT * FROM split_expenses ORDER BY date DESC, created_at DESC');
      return res.rows.map(formatExpense).filter(e => {
        const isPayer = String(e.payerId) === uIdStr;
        const isParticipant = (e.participants || []).some(p => String(p.userId) === uIdStr);
        return isPayer || isParticipant;
      });
    }

    const items = splitExpenseStore.find(e => {
      const isPayer = String(e.payerId) === uIdStr;
      const isParticipant = (e.participants || []).some(p => String(p.userId) === uIdStr);
      return isPayer || isParticipant;
    });
    return items.map(formatExpense).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async findById(expenseId) {
    const idStr = String(expenseId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query('SELECT * FROM split_expenses WHERE id = $1 LIMIT 1', [idStr]);
      return res.rows[0] ? formatExpense(res.rows[0]) : null;
    }

    const item = splitExpenseStore.findById(idStr);
    return formatExpense(item);
  },

  async delete(expenseId) {
    const idStr = String(expenseId);
    const pool = getPgPool();

    if (pool) {
      await pool.query('DELETE FROM split_expenses WHERE id = $1', [idStr]);
      return true;
    }

    splitExpenseStore.delete(e => e.id === idStr || e._id === idStr);
    return true;
  }
};

export default SplitExpenseModel;
