import { getPgPool, JsonStore } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const categoryStore = new JsonStore('custom_categories');

function formatCategory(row) {
  if (!row) return null;
  return {
    id: row.id || row._id,
    userId: String(row.user_id || row.userId),
    name: row.name,
    color: row.color,
    icon: row.icon || 'Tag',
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

export const CustomCategoryModel = {
  async findByUserId(userId) {
    const uId = String(userId);
    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        'SELECT * FROM custom_categories WHERE user_id = $1 ORDER BY created_at ASC',
        [uId]
      );
      return res.rows.map(formatCategory);
    }
    return categoryStore
      .find(c => String(c.userId) === uId)
      .map(formatCategory);
  },

  async findByName(userId, name) {
    if (!name) return null;
    const uId = String(userId);
    const trimmed = name.trim();
    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        'SELECT * FROM custom_categories WHERE user_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1',
        [uId, trimmed]
      );
      return res.rows.length > 0 ? formatCategory(res.rows[0]) : null;
    }
    const item = categoryStore.findOne(
      c => String(c.userId) === uId && String(c.name).toLowerCase() === trimmed.toLowerCase()
    );
    return item ? formatCategory(item) : null;
  },

  async findById(id) {
    if (!id) return null;
    const pool = getPgPool();
    if (pool) {
      const res = await pool.query('SELECT * FROM custom_categories WHERE id = $1 LIMIT 1', [id]);
      return res.rows.length > 0 ? formatCategory(res.rows[0]) : null;
    }
    const item = categoryStore.findById(id);
    return item ? formatCategory(item) : null;
  },

  async create({ userId, name, color, icon = 'Tag' }) {
    const id = `cat_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const uId = String(userId);
    const trimmedName = name.trim();
    const cleanColor = color || '#6366F1';
    const cleanIcon = icon || 'Tag';
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        `INSERT INTO custom_categories (id, user_id, name, color, icon, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [id, uId, trimmedName, cleanColor, cleanIcon]
      );
      return formatCategory(res.rows[0]);
    }

    const item = categoryStore.insert({
      id,
      userId: uId,
      name: trimmedName,
      color: cleanColor,
      icon: cleanIcon
    });
    return formatCategory(item);
  },

  async delete(id, userId) {
    const uId = String(userId);
    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        'DELETE FROM custom_categories WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, uId]
      );
      return res.rowCount > 0;
    }

    const count = categoryStore.delete(c => c.id === id && String(c.userId) === uId);
    return count > 0;
  }
};

export default CustomCategoryModel;
