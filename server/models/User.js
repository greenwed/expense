import { getPgPool, JsonStore } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const userStore = new JsonStore('users');

export const UserModel = {
  async findOne({ username, _id, id }) {
    const pool = getPgPool();
    if (pool) {
      if (username) {
        const res = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1', [username.trim()]);
        return res.rows[0] ? formatUser(res.rows[0]) : null;
      }
      const targetId = _id || id;
      if (targetId) {
        const res = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [targetId]);
        return res.rows[0] ? formatUser(res.rows[0]) : null;
      }
      return null;
    }

    if (username) {
      return userStore.findOne(u => u.username.toLowerCase() === username.toLowerCase());
    }
    const targetId = _id || id;
    if (targetId) {
      return userStore.findById(targetId);
    }
    return null;
  },

  async findById(id) {
    return this.findOne({ id });
  },

  async create({ name, username, password }) {
    const pool = getPgPool();
    const cleanUsername = username.trim().toLowerCase();
    const id = `usr_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

    if (pool) {
      const existing = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1', [cleanUsername]);
      if (existing.rows.length > 0) {
        const err = new Error('Username already exists');
        err.code = 11000;
        throw err;
      }

      const res = await pool.query(
        'INSERT INTO users (id, name, username, password, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
        [id, name.trim(), cleanUsername, password]
      );
      return formatUser(res.rows[0]);
    }

    const existing = userStore.findOne(u => u.username.toLowerCase() === cleanUsername);
    if (existing) {
      const err = new Error('Username already exists');
      err.code = 11000;
      throw err;
    }

    return userStore.insert({
      id,
      name: name.trim(),
      username: cleanUsername,
      password,
      createdAt: new Date().toISOString()
    });
  }
};

function formatUser(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    username: row.username,
    password: row.password,
    createdAt: row.created_at
  };
}

export default UserModel;
