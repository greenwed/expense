import { getPgPool, JsonStore } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { UserModel } from './User.js';

const friendStore = new JsonStore('split_friends');
const inviteStore = new JsonStore('split_invites');

const AVATAR_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#F97316', // Orange
  '#EAB308', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#14B8A6'  // Teal
];

function getRandomColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function formatFriend(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    friendId: row.friend_id || row.friendId,
    friendName: row.friend_name || row.friendName,
    friendUsername: row.friend_username || row.friendUsername,
    avatarColor: row.avatar_color || row.avatarColor || '#6366F1',
    createdAt: row.created_at || row.createdAt
  };
}

export const SplitFriendModel = {
  // Get or create persistent friend invite token for a user
  async getOrCreateInviteToken(userId) {
    const uIdStr = String(userId);
    const pool = getPgPool();

    if (pool) {
      const existing = await pool.query('SELECT * FROM split_invites WHERE user_id = $1 LIMIT 1', [uIdStr]);
      if (existing.rows.length > 0) {
        return existing.rows[0].invite_token;
      }
      const token = `frnd_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const id = `inv_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      await pool.query(
        'INSERT INTO split_invites (id, user_id, invite_token, created_at) VALUES ($1, $2, $3, NOW())',
        [id, uIdStr, token]
      );
      return token;
    }

    const existing = inviteStore.findOne(inv => String(inv.userId) === uIdStr);
    if (existing) return existing.inviteToken;

    const token = `frnd_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    inviteStore.insert({
      userId: uIdStr,
      inviteToken: token
    });
    return token;
  },

  async findUserByInviteToken(token) {
    const pool = getPgPool();
    if (pool) {
      const res = await pool.query('SELECT user_id FROM split_invites WHERE invite_token = $1 LIMIT 1', [token]);
      if (res.rows.length === 0) return null;
      return UserModel.findById(res.rows[0].user_id);
    }

    const inv = inviteStore.findOne(i => i.inviteToken === token);
    if (!inv) return null;
    return UserModel.findById(inv.userId);
  },

  // Add mutual friend connection
  async addMutualFriend(user1, user2) {
    const u1Id = String(user1._id || user1.id);
    const u2Id = String(user2._id || user2.id);
    if (u1Id === u2Id) return false;

    const color1 = getRandomColor(user1.username || user1.name);
    const color2 = getRandomColor(user2.username || user2.name);

    const pool = getPgPool();
    if (pool) {
      const id1 = `frd_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
      const id2 = `frd_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

      await pool.query(
        `INSERT INTO split_friends (id, user_id, friend_id, friend_name, friend_username, avatar_color, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (user_id, friend_id) DO NOTHING`,
        [id1, u1Id, u2Id, user2.name, user2.username, color2]
      );

      await pool.query(
        `INSERT INTO split_friends (id, user_id, friend_id, friend_name, friend_username, avatar_color, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (user_id, friend_id) DO NOTHING`,
        [id2, u2Id, u1Id, user1.name, user1.username, color1]
      );
      return true;
    }

    // JSON fallback
    const existing1 = friendStore.findOne(f => String(f.userId) === u1Id && String(f.friendId) === u2Id);
    if (!existing1) {
      friendStore.insert({
        userId: u1Id,
        friendId: u2Id,
        friendName: user2.name,
        friendUsername: user2.username,
        avatarColor: color2
      });
    }

    const existing2 = friendStore.findOne(f => String(f.userId) === u2Id && String(f.friendId) === u1Id);
    if (!existing2) {
      friendStore.insert({
        userId: u2Id,
        friendId: u1Id,
        friendName: user1.name,
        friendUsername: user1.username,
        avatarColor: color1
      });
    }

    return true;
  },

  // List all friends of a user
  async findUserFriends(userId) {
    const uIdStr = String(userId);
    const pool = getPgPool();

    if (pool) {
      const res = await pool.query(
        'SELECT * FROM split_friends WHERE user_id = $1 ORDER BY friend_name ASC',
        [uIdStr]
      );
      return res.rows.map(formatFriend);
    }

    const friends = friendStore.find(f => String(f.userId) === uIdStr);
    return friends.map(formatFriend).sort((a, b) => a.friendName.localeCompare(b.friendName));
  }
};

export default SplitFriendModel;
