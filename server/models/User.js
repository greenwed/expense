import { getPgPool, JsonStore } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const userStore = new JsonStore('users');

export const UserModel = {
  async findOne({ username, email, _id, id }) {
    const pool = getPgPool();
    if (pool) {
      if (username) {
        const res = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1', [username.trim()]);
        return res.rows[0] ? formatUser(res.rows[0]) : null;
      }
      if (email) {
        const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email.trim()]);
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
    if (email) {
      return userStore.findOne(u => u.email && u.email.toLowerCase() === email.toLowerCase());
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

  async findByEmail(email) {
    return this.findOne({ email });
  },

  async findByUsernameOrEmail(identifier) {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        'SELECT * FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $1 LIMIT 1',
        [clean]
      );
      return res.rows[0] ? formatUser(res.rows[0]) : null;
    }

    return userStore.findOne(u => {
      return (
        u.username.toLowerCase() === clean ||
        (u.email && u.email.toLowerCase() === clean)
      );
    });
  },

  async create({ name, username, email, password }) {
    const pool = getPgPool();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const id = `usr_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

    if (pool) {
      const existingUsername = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1', [cleanUsername]);
      if (existingUsername.rows.length > 0) {
        const err = new Error('Username already exists');
        err.code = 11000;
        throw err;
      }

      if (cleanEmail) {
        const existingEmail = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [cleanEmail]);
        if (existingEmail.rows.length > 0) {
          const err = new Error('Email address is already registered');
          err.code = 11000;
          throw err;
        }
      }

      const res = await pool.query(
        'INSERT INTO users (id, name, username, email, password, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
        [id, name.trim(), cleanUsername, cleanEmail, password]
      );
      return formatUser(res.rows[0]);
    }

    const existingU = userStore.findOne(u => u.username.toLowerCase() === cleanUsername);
    if (existingU) {
      const err = new Error('Username already exists');
      err.code = 11000;
      throw err;
    }

    if (cleanEmail) {
      const existingE = userStore.findOne(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (existingE) {
        const err = new Error('Email address is already registered');
        err.code = 11000;
        throw err;
      }
    }

    return userStore.insert({
      id,
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password,
      createdAt: new Date().toISOString()
    });
  },

  async updatePassword(userId, newHashedPassword) {
    const pool = getPgPool();
    const targetId = String(userId);

    if (pool) {
      const res = await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2 RETURNING *',
        [newHashedPassword, targetId]
      );
      return res.rows[0] ? formatUser(res.rows[0]) : null;
    }

    return userStore.update(
      u => u.id === targetId || u._id === targetId,
      { password: newHashedPassword }
    );
  }
};

function formatUser(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    password: row.password,
    createdAt: row.created_at
  };
}

export default UserModel;
