import { getPgPool, JsonStore } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const settlementStore = new JsonStore('split_settlements');

function formatSettlement(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    groupId: row.group_id || row.groupId || null,
    payerId: String(row.payer_id || row.payerId),
    payerName: row.payer_name || row.payerName,
    payeeId: String(row.payee_id || row.payeeId),
    payeeName: row.payee_name || row.payeeName,
    amount: Number(row.amount),
    date: row.date,
    note: row.note || 'Settled Up',
    createdAt: row.created_at || row.createdAt
  };
}

export const SplitSettlementModel = {
  async create({
    groupId = null,
    payerId,
    payerName,
    payeeId,
    payeeName,
    amount,
    date = new Date().toISOString(),
    note = 'Settled Up'
  }) {
    const id = `stl_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const parsedAmount = Number(amount);

    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        `INSERT INTO split_settlements
         (id, group_id, payer_id, payer_name, payee_id, payee_name, amount, date, note, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         RETURNING *`,
        [
          id,
          groupId ? String(groupId) : null,
          String(payerId),
          payerName,
          String(payeeId),
          payeeName,
          parsedAmount,
          date,
          note
        ]
      );
      return formatSettlement(res.rows[0]);
    }

    const inserted = settlementStore.insert({
      id,
      groupId: groupId ? String(groupId) : null,
      payerId: String(payerId),
      payerName,
      payeeId: String(payeeId),
      payeeName,
      amount: parsedAmount,
      date,
      note
    });
    return formatSettlement(inserted);
  },

  async findByGroup(groupId) {
    const gIdStr = String(groupId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        'SELECT * FROM split_settlements WHERE group_id = $1 ORDER BY date DESC, created_at DESC',
        [gIdStr]
      );
      return res.rows.map(formatSettlement);
    }

    const items = settlementStore.find(s => String(s.groupId) === gIdStr);
    return items.map(formatSettlement).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async findUserSettlements(userId) {
    const uIdStr = String(userId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        'SELECT * FROM split_settlements WHERE payer_id = $1 OR payee_id = $1 ORDER BY date DESC, created_at DESC',
        [uIdStr]
      );
      return res.rows.map(formatSettlement);
    }

    const items = settlementStore.find(s => String(s.payerId) === uIdStr || String(s.payeeId) === uIdStr);
    return items.map(formatSettlement).sort((a, b) => new Date(b.date) - new Date(a.date));
  }
};

export default SplitSettlementModel;
