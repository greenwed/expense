import mongoose from 'mongoose';
import { getIsMongooseConnected, JsonStore } from '../config/db.js';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const MongooseUser = mongoose.models.User || mongoose.model('User', UserSchema);
const userStore = new JsonStore('users');

export const UserModel = {
  async findOne({ username, _id }) {
    if (getIsMongooseConnected()) {
      if (username) return MongooseUser.findOne({ username: username.toLowerCase() });
      if (_id) return MongooseUser.findById(_id);
    }
    if (username) {
      return userStore.findOne(u => u.username.toLowerCase() === username.toLowerCase());
    }
    if (_id) {
      return userStore.findById(_id);
    }
    return null;
  },

  async findById(id) {
    if (getIsMongooseConnected()) {
      return MongooseUser.findById(id);
    }
    return userStore.findById(id);
  },

  async create({ name, username, password }) {
    if (getIsMongooseConnected()) {
      const user = new MongooseUser({ name, username: username.toLowerCase(), password });
      return await user.save();
    }
    const existing = userStore.findOne(u => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      const err = new Error('Username already exists');
      err.code = 11000;
      throw err;
    }
    return userStore.insert({
      name,
      username: username.toLowerCase(),
      password,
      createdAt: new Date().toISOString()
    });
  },

  async findByIds(ids) {
    if (getIsMongooseConnected()) {
      return MongooseUser.find({ _id: { $in: ids } });
    }
    return userStore.find(u => ids.includes(u._id) || ids.includes(u.id));
  }
};

export default UserModel;
