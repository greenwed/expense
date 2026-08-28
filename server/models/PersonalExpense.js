import mongoose from 'mongoose';
import { getIsMongooseConnected, JsonStore } from '../config/db.js';

export const VALID_CATEGORIES = ['Food', 'Shopping', 'Entertainment', 'Medical', 'Transport', 'Others'];

const PersonalExpenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  category: { type: String, required: true, enum: VALID_CATEGORIES },
  description: { type: String, required: true, trim: true },
  date: { type: Date, required: true, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const MongoosePersonalExpense = mongoose.models.PersonalExpense || mongoose.model('PersonalExpense', PersonalExpenseSchema);
const expenseStore = new JsonStore('personal_expenses');

export const PersonalExpenseModel = {
  async create({ userId, amount, category, description, date }) {
    const parsedDate = date ? new Date(date) : new Date();
    const numAmount = Number(amount);
    
    if (getIsMongooseConnected()) {
      const exp = new MongoosePersonalExpense({
        userId,
        amount: numAmount,
        category,
        description,
        date: parsedDate
      });
      const saved = await exp.save();
      return saved.toObject();
    }

    return expenseStore.insert({
      userId: String(userId),
      amount: numAmount,
      category,
      description,
      date: parsedDate.toISOString()
    });
  },

  async findByMonth(userId, month) {
    const uIdStr = String(userId);
    // Month format: YYYY-MM
    if (getIsMongooseConnected()) {
      const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
      const [year, m] = month.split('-').map(Number);
      const endOfMonth = new Date(Date.UTC(year, m, 1, 0, 0, 0, 0));

      const expenses = await MongoosePersonalExpense.find({
        userId,
        date: { $gte: startOfMonth, $lt: endOfMonth }
      }).sort({ date: -1 });

      return expenses.map(e => e.toObject());
    }

    const expenses = expenseStore.find(e => {
      if (String(e.userId) !== uIdStr) return false;
      const d = new Date(e.date);
      const itemMonth = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      return itemMonth === month;
    });

    return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async findById(id) {
    if (getIsMongooseConnected()) {
      const exp = await MongoosePersonalExpense.findById(id);
      return exp ? exp.toObject() : null;
    }
    return expenseStore.findById(id);
  },

  async update(id, userId, { amount, category, description, date }) {
    const uIdStr = String(userId);
    const updateData = {};
    if (amount !== undefined) updateData.amount = Number(amount);
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = new Date(date);
    updateData.updatedAt = new Date();

    if (getIsMongooseConnected()) {
      const updated = await MongoosePersonalExpense.findOneAndUpdate(
        { _id: id, userId },
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

    return expenseStore.update(
      e => (e.id === id || e._id === id) && String(e.userId) === uIdStr,
      updatePayload
    );
  },

  async delete(id, userId) {
    const uIdStr = String(userId);
    if (getIsMongooseConnected()) {
      const res = await MongoosePersonalExpense.deleteOne({ _id: id, userId });
      return res.deletedCount > 0;
    }
    const count = expenseStore.delete(e => (e.id === id || e._id === id) && String(e.userId) === uIdStr);
    return count > 0;
  }
};

export default PersonalExpenseModel;
