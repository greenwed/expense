import { getPgPool, JsonStore } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const activityStore = new JsonStore('split_activities');

function formatActivity(row) {
  if (!row) return null;
  let details = row.details;
  if (typeof details === 'string') {
    try { details = JSON.parse(details); } catch (e) { details = {}; }
  }
  return {
    id: row.id,
    _id: row.id,
    groupId: row.group_id || row.groupId || null,
    userId: String(row.user_id || row.userId),
    userName: row.user_name || row.userName,
    type: row.type,
    details: details || {},
    createdAt: row.created_at || row.createdAt
  };
}

export const SplitActivityModel = {
  async log({ groupId = null, user, type, details = {} }) {
    const id = `act_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const userId = String(user._id || user.id);
    const userName = user.name || user.username || 'User';

    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        `INSERT INTO split_activities (id, group_id, user_id, user_name, type, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [id, groupId ? String(groupId) : null, userId, userName, type, JSON.stringify(details)]
      );
      return formatActivity(res.rows[0]);
    }

    const inserted = activityStore.insert({
      id,
      groupId: groupId ? String(groupId) : null,
      userId,
      userName,
      type,
      details
    });
    return formatActivity(inserted);
  },

  async findRecent(limit = 50) {
    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        'SELECT * FROM split_activities ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return res.rows.map(formatActivity);
    }

    const items = activityStore.read();
    return items.map(formatActivity).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
  }
};

export default SplitActivityModel;
