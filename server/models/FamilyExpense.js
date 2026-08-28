import mongoose from 'mongoose';
import { VALID_CATEGORIES } from './PersonalExpense.js';
import { getIsMongooseConnected, JsonStore } from '../config/db.js';

const FamilyExpenseSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyGroup', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userUsername: { type: String, required: true },
  amount: { type: Number, required: true, min: 0.01 },
  category: { type: String, required: true, enum: VALID_CATEGORIES },
  description: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const MongooseFamilyExpense = mongoose.models.FamilyExpense || mongoose.model('FamilyExpense', FamilyExpenseSchema);
const familyExpenseStore = new JsonStore('family_expenses');

export const FamilyExpenseModel = {
  async create({ groupId, user, amount, category, description, date }) {
    const parsedDate = date ? new Date(date) : new Date();
    const numAmount = Number(amount);
    const uId = user._id || user.id;

    if (getIsMongooseConnected()) {
      const exp = new MongooseFamilyExpense({
        groupId,
        userId: uId,
        userName: user.name,
        userUsername: user.username,
        amount: numAmount,
        category,
        description,
        date: parsedDate
      });
      const saved = await exp.save();
      return saved.toObject();
    }

    return familyExpenseStore.insert({
      groupId: String(groupId),
      userId: String(uId),
      userName: user.name,
      userUsername: user.username,
      amount: numAmount,
      category,
      description,
      date: parsedDate.toISOString()
    });
  },

  async findByMonth(groupId, month) {
    const gIdStr = String(groupId);
    if (getIsMongooseConnected()) {
      const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
      const [year, m] = month.split('-').map(Number);
      const endOfMonth = new Date(Date.UTC(year, m, 1, 0, 0, 0, 0));

      const expenses = await MongooseFamilyExpense.find({
        groupId,
        date: { $gte: startOfMonth, $lt: endOfMonth }
      }).sort({ date: -1 });

      return expenses.map(e => e.toObject());
    }

    const expenses = familyExpenseStore.find(e => {
      if (String(e.groupId) !== gIdStr) return false;
      const d = new Date(e.date);
      const itemMonth = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      return itemMonth === month;
    });

    return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async findById(expenseId) {
    const eIdStr = String(expenseId);
    if (getIsMongooseConnected()) {
      const exp = await MongooseFamilyExpense.findById(expenseId);
      return exp ? exp.toObject() : null;
    }
    return familyExpenseStore.findById(eIdStr);
  },

  async update(expenseId, groupId, { amount, category, description, date }) {
    const eIdStr = String(expenseId);
    const gIdStr = String(groupId);
    const updateData = {};
    if (amount !== undefined) updateData.amount = Number(amount);
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    updateData.updatedAt = new Date();

    if (getIsMongooseConnected()) {
      const updated = await MongooseFamilyExpense.findOneAndUpdate(
        { _id: expenseId, groupId },
        updateData,
        { new: true }
      );
      return updated ? updated.toObject() : null;
    }

    const updatePayload = {
      ...updateData,
      updatedAt: updateData.updatedAt ? updateData.updatedAt.toISOString() : new Date().toISOString()
    };
    if (updateData.date) {
      updatePayload.date = updateData.date.toISOString();
    } else {
      delete updatePayload.date;
    }

    return familyExpenseStore.update(
      e => (e.id === eIdStr || e._id === eIdStr) && String(e.groupId) === gIdStr,
      updatePayload
    );
  },

  async delete(expenseId, groupId) {
    const eIdStr = String(expenseId);
    const gIdStr = String(groupId);

    if (getIsMongooseConnected()) {
      const res = await MongooseFamilyExpense.deleteOne({ _id: expenseId, groupId });
      return res.deletedCount > 0;
    }

    const count = familyExpenseStore.delete(
      e => (e.id === eIdStr || e._id === eIdStr) && String(e.groupId) === gIdStr
    );
    return count > 0;
  }
};

export default FamilyExpenseModel;
