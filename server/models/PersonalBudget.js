import mongoose from 'mongoose';
import { getIsMongooseConnected, JsonStore } from '../config/db.js';

const PersonalBudgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true }, // Format: YYYY-MM
  amount: { type: Number, required: true, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

PersonalBudgetSchema.index({ userId: 1, month: 1 }, { unique: true });

const MongoosePersonalBudget = mongoose.models.PersonalBudget || mongoose.model('PersonalBudget', PersonalBudgetSchema);
const budgetStore = new JsonStore('personal_budgets');

export const PersonalBudgetModel = {
  async getBudget(userId, month) {
    const uIdStr = String(userId);
    if (getIsMongooseConnected()) {
      const budget = await MongoosePersonalBudget.findOne({ userId, month });
      return budget ? budget.toObject() : { userId, month, amount: 0 };
    }
    const budget = budgetStore.findOne(b => String(b.userId) === uIdStr && b.month === month);
    return budget || { userId: uIdStr, month, amount: 0 };
  },

  async setBudget(userId, month, amount) {
    const uIdStr = String(userId);
    const numAmount = Math.max(0, Number(amount) || 0);

    if (getIsMongooseConnected()) {
      const budget = await MongoosePersonalBudget.findOneAndUpdate(
        { userId, month },
        { amount: numAmount, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      return budget.toObject();
    }

    const existing = budgetStore.findOne(b => String(b.userId) === uIdStr && b.month === month);
    if (existing) {
      return budgetStore.update(
        b => String(b.userId) === uIdStr && b.month === month,
        { amount: numAmount, updatedAt: new Date().toISOString() }
      );
    } else {
      return budgetStore.insert({
        userId: uIdStr,
        month,
        amount: numAmount,
        updatedAt: new Date().toISOString()
      });
    }
  }
};

export default PersonalBudgetModel;
