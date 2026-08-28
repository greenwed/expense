import mongoose from 'mongoose';
import { getIsMongooseConnected, JsonStore } from '../config/db.js';

const FamilyBudgetSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyGroup', required: true },
  month: { type: String, required: true }, // Format: YYYY-MM
  amount: { type: Number, required: true, default: 0 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});

FamilyBudgetSchema.index({ groupId: 1, month: 1 }, { unique: true });

const MongooseFamilyBudget = mongoose.models.FamilyBudget || mongoose.model('FamilyBudget', FamilyBudgetSchema);
const familyBudgetStore = new JsonStore('family_budgets');

export const FamilyBudgetModel = {
  async getBudget(groupId, month) {
    const gIdStr = String(groupId);
    if (getIsMongooseConnected()) {
      const budget = await MongooseFamilyBudget.findOne({ groupId, month });
      return budget ? budget.toObject() : { groupId, month, amount: 0 };
    }
    const budget = familyBudgetStore.findOne(b => String(b.groupId) === gIdStr && b.month === month);
    return budget || { groupId: gIdStr, month, amount: 0 };
  },

  async setBudget(groupId, month, amount, updatedBy) {
    const gIdStr = String(groupId);
    const numAmount = Math.max(0, Number(amount) || 0);

    if (getIsMongooseConnected()) {
      const budget = await MongooseFamilyBudget.findOneAndUpdate(
        { groupId, month },
        { amount: numAmount, updatedBy, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      return budget.toObject();
    }

    const existing = familyBudgetStore.findOne(b => String(b.groupId) === gIdStr && b.month === month);
    if (existing) {
      return familyBudgetStore.update(
        b => String(b.groupId) === gIdStr && b.month === month,
        { amount: numAmount, updatedBy: String(updatedBy), updatedAt: new Date().toISOString() }
      );
    } else {
      return familyBudgetStore.insert({
        groupId: gIdStr,
        month,
        amount: numAmount,
        updatedBy: String(updatedBy),
        updatedAt: new Date().toISOString()
      });
    }
  }
};

export default FamilyBudgetModel;
