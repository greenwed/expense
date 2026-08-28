import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let pgPool = null;
let isPgConnected = false;

export async function connectDB() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;

  if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
    try {
      pgPool = new Pool({
        connectionString: dbUrl,
        ssl: {
          rejectUnauthorized: false
        },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      // Test connection
      const client = await pgPool.connect();
      client.release();
      isPgConnected = true;
      console.log('✅ Connected successfully to Neon Serverless PostgreSQL Database!');

      // Initialize database tables if they do not exist
      await initPostgresSchema(pgPool);
      return;
    } catch (err) {
      console.warn(`⚠️ PostgreSQL connection error (${err.message}). Using persistent local storage store.`);
      isPgConnected = false;
      pgPool = null;
    }
  } else {
    console.log(`ℹ️ No PostgreSQL DATABASE_URL provided. Using persistent local storage store at ${DATA_DIR}`);
    isPgConnected = false;
  }
}

async function initPostgresSchema(pool) {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS personal_budgets (
      id VARCHAR(100) PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL,
      month VARCHAR(20) NOT NULL,
      amount NUMERIC NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, month)
    );

    CREATE TABLE IF NOT EXISTS personal_expenses (
      id VARCHAR(100) PRIMARY KEY,
      user_id VARCHAR(100) NOT NULL,
      amount NUMERIC NOT NULL,
      category VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS family_groups (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_by VARCHAR(100) NOT NULL,
      members JSONB NOT NULL DEFAULT '[]'::jsonb,
      invite_token VARCHAR(100) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS family_budgets (
      id VARCHAR(100) PRIMARY KEY,
      group_id VARCHAR(100) NOT NULL,
      month VARCHAR(20) NOT NULL,
      amount NUMERIC NOT NULL DEFAULT 0,
      updated_by VARCHAR(100),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(group_id, month)
    );

    CREATE TABLE IF NOT EXISTS family_expenses (
      id VARCHAR(100) PRIMARY KEY,
      group_id VARCHAR(100) NOT NULL,
      user_id VARCHAR(100) NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      user_username VARCHAR(100) NOT NULL,
      amount NUMERIC NOT NULL,
      category VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await pool.query(schemaSql);
  console.log('⚡ Neon PostgreSQL tables initialized and ready.');
}

export function getPgPool() {
  return isPgConnected ? pgPool : null;
}

export function getIsPgConnected() {
  return isPgConnected;
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
