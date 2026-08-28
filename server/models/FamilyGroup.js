import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { getIsMongooseConnected, JsonStore } from '../config/db.js';

const GroupMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  username: { type: String, required: true },
  role: { type: String, enum: ['admin', 'moderator', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now }
});

const FamilyGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [GroupMemberSchema],
  inviteToken: { type: String, unique: true, default: () => uuidv4() },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const MongooseFamilyGroup = mongoose.models.FamilyGroup || mongoose.model('FamilyGroup', FamilyGroupSchema);
const groupStore = new JsonStore('family_groups');

export const FamilyGroupModel = {
  async create({ name, user }) {
    const inviteToken = uuidv4();
    const members = [{
      userId: user._id || user.id,
      name: user.name,
      username: user.username,
      role: 'admin',
      joinedAt: new Date().toISOString()
    }];

    if (getIsMongooseConnected()) {
      const group = new MongooseFamilyGroup({
        name,
        createdBy: user._id || user.id,
        members,
        inviteToken
      });
      const saved = await group.save();
      return saved.toObject();
    }

    return groupStore.insert({
      name,
      createdBy: String(user._id || user.id),
      members,
      inviteToken
    });
  },

  async findUserGroups(userId) {
    const uIdStr = String(userId);
    if (getIsMongooseConnected()) {
      const groups = await MongooseFamilyGroup.find({ 'members.userId': userId }).sort({ createdAt: -1 });
      return groups.map(g => g.toObject());
    }
    const groups = groupStore.find(g => {
      return g.members && g.members.some(m => String(m.userId) === uIdStr);
    });
    return groups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findById(groupId) {
    const gIdStr = String(groupId);
    if (getIsMongooseConnected()) {
      const group = await MongooseFamilyGroup.findById(groupId);
      return group ? group.toObject() : null;
    }
    return groupStore.findById(gIdStr);
  },

  async findByInviteToken(token) {
    if (getIsMongooseConnected()) {
      const group = await MongooseFamilyGroup.findOne({ inviteToken: token });
      return group ? group.toObject() : null;
    }
    return groupStore.findOne(g => g.inviteToken === token);
  },

  async renameGroup(groupId, newName) {
    const gIdStr = String(groupId);
    if (getIsMongooseConnected()) {
      const updated = await MongooseFamilyGroup.findByIdAndUpdate(
        groupId,
        { name: newName.trim(), updatedAt: new Date() },
        { new: true }
      );
      return updated ? updated.toObject() : null;
    }
    return groupStore.update(
      g => g.id === gIdStr || g._id === gIdStr,
      { name: newName.trim() }
    );
  },

  async regenerateInviteToken(groupId) {
    const gIdStr = String(groupId);
    const newToken = uuidv4();
    if (getIsMongooseConnected()) {
      const updated = await MongooseFamilyGroup.findByIdAndUpdate(
        groupId,
        { inviteToken: newToken, updatedAt: new Date() },
        { new: true }
      );
      return updated ? updated.toObject() : null;
    }
    return groupStore.update(
      g => g.id === gIdStr || g._id === gIdStr,
      { inviteToken: newToken }
    );
  },

  async addMember(groupId, user, role = 'member') {
    const gIdStr = String(groupId);
    const uIdStr = String(user._id || user.id);

    if (getIsMongooseConnected()) {
      const group = await MongooseFamilyGroup.findById(groupId);
      if (!group) return null;
      const alreadyMember = group.members.some(m => String(m.userId) === uIdStr);
      if (!alreadyMember) {
        group.members.push({
          userId: user._id || user.id,
          name: user.name,
          username: user.username,
          role,
          joinedAt: new Date()
        });
        await group.save();
      }
      return group.toObject();
    }

    const group = groupStore.findById(gIdStr);
    if (!group) return null;
    const members = group.members || [];
    const exists = members.some(m => String(m.userId) === uIdStr);
    if (!exists) {
      members.push({
        userId: uIdStr,
        name: user.name,
        username: user.username,
        role,
        joinedAt: new Date().toISOString()
      });
      return groupStore.update(g => g.id === gIdStr || g._id === gIdStr, { members });
    }
    return group;
  },

  async updateMemberRole(groupId, targetUserId, newRole) {
    const gIdStr = String(groupId);
    const targetIdStr = String(targetUserId);

    if (getIsMongooseConnected()) {
      const group = await MongooseFamilyGroup.findById(groupId);
      if (!group) return null;
      const member = group.members.find(m => String(m.userId) === targetIdStr);
      if (member) {
        member.role = newRole;
        await group.save();
      }
      return group.toObject();
    }

    const group = groupStore.findById(gIdStr);
    if (!group) return null;
    const members = (group.members || []).map(m => {
      if (String(m.userId) === targetIdStr) {
        return { ...m, role: newRole };
      }
      return m;
    });
    return groupStore.update(g => g.id === gIdStr || g._id === gIdStr, { members });
  },

  async removeMember(groupId, targetUserId) {
    const gIdStr = String(groupId);
    const targetIdStr = String(targetUserId);

    if (getIsMongooseConnected()) {
      const group = await MongooseFamilyGroup.findById(groupId);
      if (!group) return null;
      group.members = group.members.filter(m => String(m.userId) !== targetIdStr);
      await group.save();
      return group.toObject();
    }

    const group = groupStore.findById(gIdStr);
    if (!group) return null;
    const members = (group.members || []).filter(m => String(m.userId) !== targetIdStr);
    return groupStore.update(g => g.id === gIdStr || g._id === gIdStr, { members });
  }
};

export default FamilyGroupModel;
