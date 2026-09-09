import { getPgPool, JsonStore } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const suggestionStore = new JsonStore('category_suggestions');

function formatSuggestion(row) {
  if (!row) return null;
  return {
    id: row.id || row._id,
    groupId: String(row.group_id || row.groupId),
    groupType: row.group_type || row.groupType || 'family',
    userId: String(row.user_id || row.userId),
    userName: row.user_name || row.userName || 'Member',
    name: row.name,
    reason: row.reason || '',
    status: row.status || 'pending', // 'pending' | 'approved' | 'rejected'
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

export const CategorySuggestionModel = {
  async create({ groupId, groupType = 'family', userId, userName, name, reason = '' }) {
    const id = `csug_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const gId = String(groupId);
    const uId = String(userId);
    const trimmedName = name.trim();
    const trimmedReason = (reason || '').trim();
    const pool = getPgPool();

    if (pool) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS category_suggestions (
          id VARCHAR(100) PRIMARY KEY,
          group_id VARCHAR(100) NOT NULL,
          group_type VARCHAR(50) DEFAULT 'family',
          user_id VARCHAR(100) NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          name VARCHAR(100) NOT NULL,
          reason TEXT DEFAULT '',
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_cat_sug_group_id ON category_suggestions(group_id);
      `);

      const res = await pool.query(
        `INSERT INTO category_suggestions (id, group_id, group_type, user_id, user_name, name, reason, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW(), NOW())
         RETURNING *`,
        [id, gId, groupType, uId, userName, trimmedName, trimmedReason]
      );
      return formatSuggestion(res.rows[0]);
    }

    const item = suggestionStore.insert({
      id,
      groupId: gId,
      groupType,
      userId: uId,
      userName,
      name: trimmedName,
      reason: trimmedReason,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    return formatSuggestion(item);
  },

  async findByGroupId(groupId) {
    if (!groupId) return [];
    const gId = String(groupId);
    const pool = getPgPool();
    if (pool) {
      try {
        const res = await pool.query(
          'SELECT * FROM category_suggestions WHERE group_id = $1 ORDER BY created_at DESC',
          [gId]
        );
        return res.rows.map(formatSuggestion);
      } catch (err) {
        return [];
      }
    }
    return suggestionStore
      .find(s => String(s.groupId) === gId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(formatSuggestion);
  },

  async findById(id) {
    if (!id) return null;
    const pool = getPgPool();
    if (pool) {
      try {
        const res = await pool.query('SELECT * FROM category_suggestions WHERE id = $1 LIMIT 1', [id]);
        return res.rows.length > 0 ? formatSuggestion(res.rows[0]) : null;
      } catch (err) {
        return null;
      }
    }
    const item = suggestionStore.findById(id);
    return item ? formatSuggestion(item) : null;
  },

  async updateStatus(id, status) {
    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        'UPDATE category_suggestions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, id]
      );
      return res.rows.length > 0 ? formatSuggestion(res.rows[0]) : null;
    }
    const item = suggestionStore.update(
      s => s.id === id,
      existing => ({
        ...existing,
        status,
        updatedAt: new Date().toISOString()
      })
    );
    return item ? formatSuggestion(item) : null;
  },

  async delete(id) {
    const pool = getPgPool();
    if (pool) {
      await pool.query('DELETE FROM category_suggestions WHERE id = $1', [id]);
      return true;
    }
    return suggestionStore.delete(s => s.id === id) > 0;
  },

  async deleteByGroupId(groupId) {
    const gId = String(groupId);
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query('DELETE FROM category_suggestions WHERE group_id = $1', [gId]);
      } catch (e) {}
      return true;
    }
    return suggestionStore.delete(s => String(s.groupId) === gId) > 0;
  }
};

export default CategorySuggestionModel;
