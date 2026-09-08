import { getPgPool, JsonStore } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const categoryStore = new JsonStore('custom_categories');

function formatCategory(row) {
  if (!row) return null;
  return {
    id: row.id || row._id,
    userId: String(row.user_id || row.userId),
    groupId: row.group_id ? String(row.group_id) : (row.groupId ? String(row.groupId) : null),
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
        'SELECT * FROM custom_categories WHERE user_id = $1 AND group_id IS NULL ORDER BY created_at ASC',
        [uId]
      );
      return res.rows.map(formatCategory);
    }
    return categoryStore
      .find(c => String(c.userId) === uId && !c.groupId)
      .map(formatCategory);
  },

  async findByGroupId(groupId) {
    if (!groupId) return [];
    const gId = String(groupId);
    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        'SELECT * FROM custom_categories WHERE group_id = $1 ORDER BY created_at ASC',
        [gId]
      );
      return res.rows.map(formatCategory);
    }
    return categoryStore
      .find(c => String(c.groupId) === gId)
      .map(formatCategory);
  },

  async findByName(userId, name) {
    if (!name) return null;
    const uId = String(userId);
    const trimmed = name.trim();
    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        'SELECT * FROM custom_categories WHERE user_id = $1 AND group_id IS NULL AND LOWER(name) = LOWER($2) LIMIT 1',
        [uId, trimmed]
      );
      return res.rows.length > 0 ? formatCategory(res.rows[0]) : null;
    }
    const item = categoryStore.findOne(
      c => String(c.userId) === uId && !c.groupId && String(c.name).toLowerCase() === trimmed.toLowerCase()
    );
    return item ? formatCategory(item) : null;
  },

  async findByNameInGroup(groupId, name) {
    if (!groupId || !name) return null;
    const gId = String(groupId);
    const trimmed = name.trim();
    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        'SELECT * FROM custom_categories WHERE group_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1',
        [gId, trimmed]
      );
      return res.rows.length > 0 ? formatCategory(res.rows[0]) : null;
    }
    const item = categoryStore.findOne(
      c => String(c.groupId) === gId && String(c.name).toLowerCase() === trimmed.toLowerCase()
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

  async create({ userId, groupId = null, name, color, icon = 'Tag' }) {
    const id = `cat_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const uId = String(userId);
    const gId = groupId ? String(groupId) : null;
    const trimmedName = name.trim();
    const cleanColor = color || '#6366F1';
    const cleanIcon = icon || 'Tag';
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        `INSERT INTO custom_categories (id, user_id, group_id, name, color, icon, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [id, uId, gId, trimmedName, cleanColor, cleanIcon]
      );
      return formatCategory(res.rows[0]);
    }

    const item = categoryStore.insert({
      id,
      userId: uId,
      groupId: gId,
      name: trimmedName,
      color: cleanColor,
      icon: cleanIcon
    });
    return formatCategory(item);
  },

  async update(id, userId, { name, color, icon, groupId = null }) {
    const uId = String(userId);
    const gId = groupId ? String(groupId) : null;
    const pool = getPgPool();
    if (pool) {
      const updates = [];
      const values = [id];
      let idx = 2;

      if (name !== undefined) {
        updates.push(`name = $${idx++}`);
        values.push(name.trim());
      }
      if (color !== undefined) {
        updates.push(`color = $${idx++}`);
        values.push(color.trim());
      }
      if (icon !== undefined) {
        updates.push(`icon = $${idx++}`);
        values.push(icon.trim());
      }

      if (updates.length === 0) {
        return this.findById(id);
      }

      updates.push(`updated_at = NOW()`);
      let whereClause = `WHERE id = $1`;
      if (gId) {
        whereClause += ` AND group_id = $${idx++}`;
        values.push(gId);
      } else {
        whereClause += ` AND user_id = $${idx++}`;
        values.push(uId);
      }

      const query = `
        UPDATE custom_categories
        SET ${updates.join(', ')}
        ${whereClause}
        RETURNING *
      `;
      const res = await pool.query(query, values);
      return res.rows.length > 0 ? formatCategory(res.rows[0]) : null;
    }

    const item = categoryStore.findOne(c =>
      c.id === id && (gId ? String(c.groupId) === gId : String(c.userId) === uId)
    );
    if (!item) return null;

    const updated = categoryStore.update(
      c => c.id === id && (gId ? String(c.groupId) === gId : String(c.userId) === uId),
      existing => ({
        ...existing,
        name: name !== undefined ? name.trim() : existing.name,
        color: color !== undefined ? color.trim() : existing.color,
        icon: icon !== undefined ? icon.trim() : existing.icon,
        updatedAt: new Date().toISOString()
      })
    );
    return updated ? formatCategory(updated) : null;
  },

  async delete(id, userId, { groupId = null } = {}) {
    const uId = String(userId);
    const gId = groupId ? String(groupId) : null;
    const pool = getPgPool();
    if (pool) {
      let query = 'DELETE FROM custom_categories WHERE id = $1';
      const values = [id];
      if (gId) {
        query += ' AND group_id = $2';
        values.push(gId);
      } else {
        query += ' AND user_id = $2';
        values.push(uId);
      }
      query += ' RETURNING id';
      const res = await pool.query(query, values);
      return res.rowCount > 0;
    }

    const count = categoryStore.delete(c =>
      c.id === id && (gId ? String(c.groupId) === gId : String(c.userId) === uId)
    );
    return count > 0;
  },

  async deleteByGroupId(groupId) {
    const gId = String(groupId);
    const pool = getPgPool();
    if (pool) {
      await pool.query('DELETE FROM custom_categories WHERE group_id = $1', [gId]);
      return true;
    }
    return categoryStore.delete(c => String(c.groupId) === gId);
  }
};

export default CustomCategoryModel;
