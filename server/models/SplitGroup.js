import { getPgPool, JsonStore } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { UserModel } from './User.js';

const splitGroupStore = new JsonStore('split_groups');

const AVATAR_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
  '#F97316', '#EAB308', '#10B981', '#06B6D4', '#3B82F6'
];

function getRandomColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatGroup(row) {
  if (!row) return null;
  let members = row.members;
  if (typeof members === 'string') {
    try { members = JSON.parse(members); } catch (e) { members = []; }
  }
  return {
    id: row.id,
    _id: row.id,
    name: row.name,
    createdBy: row.created_by || row.createdBy,
    members: members || [],
    inviteToken: row.invite_token || row.inviteToken,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

export const SplitGroupModel = {
  async create({ name, user, initialMembers = [] }) {
    const inviteToken = uuidv4();
    const id = `spg_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const userId = String(user._id || user.id);

    const members = [{
      userId,
      name: user.name,
      username: user.username,
      avatarColor: getRandomColor(user.username || user.name),
      role: 'admin',
      joinedAt: new Date().toISOString()
    }];

    // Add initial friends if provided
    for (const m of initialMembers) {
      const mId = String(m._id || m.id || m.userId);
      if (mId && mId !== userId && !members.some(x => x.userId === mId)) {
        members.push({
          userId: mId,
          name: m.name || m.friendName,
          username: m.username || m.friendUsername,
          avatarColor: m.avatarColor || getRandomColor(m.name || mId),
          role: 'member',
          joinedAt: new Date().toISOString()
        });
      }
    }

    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        `INSERT INTO split_groups (id, name, created_by, members, invite_token, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [id, name.trim(), userId, JSON.stringify(members), inviteToken]
      );
      return formatGroup(res.rows[0]);
    }

    return splitGroupStore.insert({
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
      const res = await pool.query('SELECT * FROM split_groups ORDER BY created_at DESC');
      return res.rows.map(formatGroup).filter(g => {
        return (g.members || []).some(m => String(m.userId) === uIdStr);
      });
    }

    const groups = splitGroupStore.find(g => {
      return g.members && g.members.some(m => String(m.userId) === uIdStr);
    });
    return groups.map(formatGroup).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findById(groupId) {
    const gIdStr = String(groupId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query('SELECT * FROM split_groups WHERE id = $1 LIMIT 1', [gIdStr]);
      return res.rows[0] ? formatGroup(res.rows[0]) : null;
    }

    const g = splitGroupStore.findById(gIdStr);
    return formatGroup(g);
  },

  async findByInviteToken(token) {
    const pool = getPgPool();
    if (pool) {
      const res = await pool.query('SELECT * FROM split_groups WHERE invite_token = $1 LIMIT 1', [token]);
      return res.rows[0] ? formatGroup(res.rows[0]) : null;
    }
    const g = splitGroupStore.findOne(grp => grp.inviteToken === token);
    return formatGroup(g);
  },

  async addMember(groupId, user) {
    const group = await this.findById(groupId);
    if (!group) throw new Error('Split group not found.');

    const userId = String(user._id || user.id);
    const isMember = (group.members || []).some(m => String(m.userId) === userId);
    if (isMember) return group;

    const newMembers = [
      ...group.members,
      {
        userId,
        name: user.name,
        username: user.username,
        avatarColor: getRandomColor(user.username || user.name),
        role: 'member',
        joinedAt: new Date().toISOString()
      }
    ];

    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        'UPDATE split_groups SET members = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [JSON.stringify(newMembers), String(groupId)]
      );
      return formatGroup(res.rows[0]);
    }

    return formatGroup(splitGroupStore.update(
      g => g.id === String(groupId) || g._id === String(groupId),
      { members: newMembers }
    ));
  },

  async removeMember(groupId, targetUserId) {
    const group = await this.findById(groupId);
    if (!group) throw new Error('Split group not found.');

    const newMembers = (group.members || []).filter(m => String(m.userId) !== String(targetUserId));
    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        'UPDATE split_groups SET members = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [JSON.stringify(newMembers), String(groupId)]
      );
      return formatGroup(res.rows[0]);
    }

    return formatGroup(splitGroupStore.update(
      g => g.id === String(groupId) || g._id === String(groupId),
      { members: newMembers }
    ));
  },

  async updateName(groupId, name) {
    const gIdStr = String(groupId);
    const pool = getPgPool();
    if (pool) {
      const res = await pool.query(
        'UPDATE split_groups SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [name.trim(), gIdStr]
      );
      return formatGroup(res.rows[0]);
    }

    return formatGroup(splitGroupStore.update(
      g => g.id === gIdStr || g._id === gIdStr,
      { name: name.trim() }
    ));
  },

  async deleteGroup(groupId) {
    const gIdStr = String(groupId);
    const pool = getPgPool();
    if (pool) {
      await pool.query('DELETE FROM split_expenses WHERE group_id = $1', [gIdStr]);
      await pool.query('DELETE FROM split_settlements WHERE group_id = $1', [gIdStr]);
      await pool.query('DELETE FROM split_activities WHERE group_id = $1', [gIdStr]);
      await pool.query('DELETE FROM split_groups WHERE id = $1', [gIdStr]);
      return true;
    }

    const expenseStore = new JsonStore('split_expenses');
    const settlementStore = new JsonStore('split_settlements');
    const activityStore = new JsonStore('split_activities');

    expenseStore.delete(e => String(e.groupId) === gIdStr);
    settlementStore.delete(s => String(s.groupId) === gIdStr);
    activityStore.delete(a => String(a.groupId) === gIdStr);
    splitGroupStore.delete(g => g.id === gIdStr || g._id === gIdStr);
    return true;
  }
};

export default SplitGroupModel;
