import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let isMongooseConnected = false;

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log(`ℹ️ No MONGODB_URI provided. Using persistent local storage store at ${DATA_DIR}`);
    isMongooseConnected = false;
    return;
  }
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    isMongooseConnected = true;
    console.log(`✅ MongoDB Connected successfully to: ${mongoUri}`);
  } catch (err) {
    console.warn(`⚠️ MongoDB connection failed (${err.message}). Using persistent JSON storage store at ${DATA_DIR}`);
    isMongooseConnected = false;
    await mongoose.disconnect().catch(() => {});
  }
}

export function getIsMongooseConnected() {
  return isMongooseConnected;
}

// Persistent JSON Store helper for standalone zero-dependency runtime
export class JsonStore {
  constructor(collectionName) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data || '[]');
    } catch (e) {
      return [];
    }
  }

  write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  find(filterFn) {
    const items = this.read();
    return filterFn ? items.filter(filterFn) : items;
  }

  findOne(filterFn) {
    const items = this.read();
    return items.find(filterFn) || null;
  }

  findById(id) {
    const items = this.read();
    return items.find(item => item.id === id || item._id === id) || null;
  }

  insert(item) {
    const items = this.read();
    const id = item._id || item.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newItem = {
      _id: id,
      id: id,
      ...item,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(newItem);
    this.write(items);
    return newItem;
  }

  update(filterFn, updateData) {
    const items = this.read();
    let updatedItem = null;
    const nextItems = items.map(item => {
      if (filterFn(item)) {
        updatedItem = {
          ...item,
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        return updatedItem;
      }
      return item;
    });
    this.write(nextItems);
    return updatedItem;
  }

  delete(filterFn) {
    const items = this.read();
    const nextItems = items.filter(item => !filterFn(item));
    const deletedCount = items.length - nextItems.length;
    this.write(nextItems);
    return deletedCount;
  }
}
