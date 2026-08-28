import { getPgPool, JsonStore } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const groupStore = new JsonStore('family_groups');

export const FamilyGroupModel = {
  async create({ name, user }) {
    const inviteToken = uuidv4();
    const id = `grp_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const userId = String(user._id || user.id);
    const members = [{
      userId,
      name: user.name,
      username: user.username,
      role: 'admin',
      joinedAt: new Date().toISOString()
    }];

    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        `INSERT INTO family_groups (id, name, created_by, members, invite_token, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [id, name.trim(), userId, JSON.stringify(members), inviteToken]
      );
      return formatGroup(res.rows[0]);
    }

    return groupStore.insert({
      id,
      name: name.trim(),
      createdBy: userId,
      members,
      inviteToken
    });
  },

  async findUserGroups(userId) {
    const uIdStr = String(userId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query('SELECT * FROM family_groups ORDER BY created_at DESC');
      const filtered = res.rows.map(formatGroup).filter(g => {
        return (g.members || []).some(m => String(m.userId) === uIdStr);
      });
      return filtered;
    }

    const groups = groupStore.find(g => {
      return g.members && g.members.some(m => String(m.userId) === uIdStr);
    });
    return groups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findById(groupId) {
    const gIdStr = String(groupId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query('SELECT * FROM family_groups WHERE id = $1 LIMIT 1', [gIdStr]);
      return res.rows[0] ? formatGroup(res.rows[0]) : null;
    }

    return groupStore.findById(gIdStr);
  },

  async findByInviteToken(token) {
    const pool = getPgPool();
    if (pool) {
      const res = await pool.query('SELECT * FROM family_groups WHERE invite_token = $1 LIMIT 1', [token]);
      return res.rows[0] ? formatGroup(res.rows[0]) : null;
    }
    return groupStore.findOne(g => g.inviteToken === token);
  },

  async renameGroup(groupId, newName) {
    const gIdStr = String(groupId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        'UPDATE family_groups SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [newName.trim(), gIdStr]
      );
      return res.rows[0] ? formatGroup(res.rows[0]) : null;
    }

    return groupStore.update(
      g => g.id === gIdStr || g._id === gIdStr,
      { name: newName.trim() }
    );
  },

  async regenerateInviteToken(groupId) {
    const gIdStr = String(groupId);
    const newToken = uuidv4();
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        'UPDATE family_groups SET invite_token = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [newToken, gIdStr]
      );
      return res.rows[0] ? formatGroup(res.rows[0]) : null;
    }

    return groupStore.update(
      g => g.id === gIdStr || g._id === gIdStr,
      { inviteToken: newToken }
    );
  },

  async addMember(groupId, user, role = 'member') {
    const gIdStr = String(groupId);
    const uIdStr = String(user._id || user.id);
    const group = await this.findById(gIdStr);
    if (!group) return null;

    const members = group.members || [];
    const exists = members.some(m => String(m.userId) === uIdStr);
    if (exists) return group;

    members.push({
      userId: uIdStr,
      name: user.name,
      username: user.username,
      role,
      joinedAt: new Date().toISOString()
    });

    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        'UPDATE family_groups SET members = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [JSON.stringify(members), gIdStr]
      );
      return res.rows[0] ? formatGroup(res.rows[0]) : null;
    }

    return groupStore.update(g => g.id === gIdStr || g._id === gIdStr, { members });
  },

  async updateMemberRole(groupId, targetUserId, newRole) {
    const gIdStr = String(groupId);
    const targetIdStr = String(targetUserId);
    const group = await this.findById(gIdStr);
    if (!group) return null;

    const members = (group.members || []).map(m => {
      if (String(m.userId) === targetIdStr) {
        return { ...m, role: newRole };
      }
      return m;
    });

    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        'UPDATE family_groups SET members = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [JSON.stringify(members), gIdStr]
      );
      return res.rows[0] ? formatGroup(res.rows[0]) : null;
    }

    return groupStore.update(g => g.id === gIdStr || g._id === gIdStr, { members });
  },

  async removeMember(groupId, targetUserId) {
    const gIdStr = String(groupId);
    const targetIdStr = String(targetUserId);
    const group = await this.findById(gIdStr);
    if (!group) return null;

    const members = (group.members || []).filter(m => String(m.userId) !== targetIdStr);

    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        'UPDATE family_groups SET members = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [JSON.stringify(members), gIdStr]
      );
      return res.rows[0] ? formatGroup(res.rows[0]) : null;
    }

    return groupStore.update(g => g.id === gIdStr || g._id === gIdStr, { members });
  }
};

function formatGroup(row) {
  if (!row) return null;
  const rawMembers = typeof row.members === 'string' ? JSON.parse(row.members) : row.members;
  return {
    id: row.id,
    _id: row.id,
    name: row.name,
    createdBy: row.created_by,
    members: rawMembers || [],
    inviteToken: row.invite_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export default FamilyGroupModel;
