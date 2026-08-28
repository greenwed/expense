import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';
import FamilyGroupModel from '../models/FamilyGroup.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'expense-tracker-secure-secret-key-2026';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(401).json({ error: 'User session invalid. Please log in again.' });
    }

    req.user = {
      _id: user._id || user.id,
      id: user.id || user._id,
      name: user.name,
      username: user.username
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

export async function requireGroupMember(req, res, next) {
  const groupId = req.params.groupId || req.body.groupId;
  if (!groupId) {
    return res.status(400).json({ error: 'Group ID is required.' });
  }

  try {
    const group = await FamilyGroupModel.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Family group not found.' });
    }

    const currentUserId = String(req.user._id || req.user.id);
    const member = (group.members || []).find(m => String(m.userId) === currentUserId);

    if (!member) {
      return res.status(403).json({ error: 'You are not a member of this family group.' });
    }

    req.group = group;
    req.userRole = member.role; // 'admin' | 'moderator' | 'member'
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify group membership.' });
  }
}

export function requireRoles(allowedRoles = ['admin']) {
  return (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        error: `Permission denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.userRole || 'none'}`
      });
    }
    next();
  };
}
