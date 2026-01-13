import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { mkdirSync, existsSync } from 'fs';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import type { ExpenseItem, Category } from '../../src/types/index.js';

// data 디렉토리 생성
const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'gyegaboo.db');
const db = new Database(dbPath);

// 데이터베이스 초기화
export function initDatabase() {
  // expenses 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      amount INTEGER NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      imageUrl TEXT
    )
  `);

  // categories 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      color TEXT NOT NULL
    )
  `);

  // recurring_expenses 테이블 생성 (고정비)
  db.exec(`
    CREATE TABLE IF NOT EXISTS recurring_expenses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      repeat_type TEXT NOT NULL CHECK(repeat_type IN ('daily', 'weekly', 'monthly', 'yearly')),
      repeat_day INTEGER,
      start_date TEXT NOT NULL,
      end_date TEXT,
      last_processed_date TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    )
  `);

  // users 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_initial_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // invitation_tokens 테이블 생성
  db.exec(`
    CREATE TABLE IF NOT EXISTS invitation_tokens (
      token TEXT PRIMARY KEY,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      used_at TEXT,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 기본 카테고리 추가
  const defaultCategories: Category[] = [
    { id: '1', name: '식비', type: 'expense', color: '#FF6B6B' },
    { id: '2', name: '교통비', type: 'expense', color: '#4ECDC4' },
    { id: '3', name: '쇼핑', type: 'expense', color: '#45B7D1' },
    { id: '4', name: '의료비', type: 'expense', color: '#FFA07A' },
    { id: '5', name: '기타', type: 'expense', color: '#98D8C8' },
    { id: '6', name: '급여', type: 'income', color: '#6BCB77' },
    { id: '7', name: '부수입', type: 'income', color: '#4D96FF' },
  ];

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (id, name, type, color)
    VALUES (?, ?, ?, ?)
  `);

  const insertManyCategories = db.transaction((categories: Category[]) => {
    for (const cat of categories) {
      insertCategory.run(cat.id, cat.name, cat.type, cat.color);
    }
  });

  insertManyCategories(defaultCategories);

  // 초기 admin 계정 생성 (없는 경우)
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const initialPassword = randomBytes(16).toString('hex');
    const passwordHash = bcrypt.hashSync(initialPassword, 10);
    const adminId = 'admin-' + Date.now();
    
    db.prepare(`
      INSERT INTO users (id, username, password_hash, is_initial_admin)
      VALUES (?, ?, ?, ?)
    `).run(adminId, 'admin', passwordHash, 1);
    
    console.log('\n========================================');
    console.log('🔐 초기 관리자 계정이 생성되었습니다.');
    console.log('========================================');
    console.log('사용자명: admin');
    console.log(`비밀번호: ${initialPassword}`);
    console.log('========================================\n');
    console.log('⚠️  이 비밀번호는 서버 관리자만 확인할 수 있습니다.');
    console.log('⚠️  새로운 관리자를 등록한 후 초기 계정은 자동으로 삭제됩니다.\n');
  }

  console.log('Database initialized');
}

// ExpenseItem CRUD
export const expenseQueries = {
  getAll: () => {
    return db.prepare('SELECT * FROM expenses ORDER BY date DESC').all() as ExpenseItem[];
  },

  getById: (id: string) => {
    return db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as ExpenseItem | undefined;
  },

  create: (item: ExpenseItem) => {
    db.prepare(`
      INSERT INTO expenses (id, date, amount, category, description, type, imageUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id,
      item.date,
      item.amount,
      item.category,
      item.description,
      item.type,
      item.imageUrl || null
    );
    return item;
  },

  createMany: (items: ExpenseItem[]) => {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO expenses (id, date, amount, category, description, type, imageUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((items: ExpenseItem[]) => {
      for (const item of items) {
        try {
          insert.run(
            item.id,
            item.date,
            item.amount,
            item.category,
            item.description,
            item.type,
            item.imageUrl || null
          );
        } catch (error: any) {
          // 중복 ID인 경우 무시하고 계속 진행
          if (error?.code !== 'SQLITE_CONSTRAINT_PRIMARYKEY') {
            throw error;
          }
        }
      }
    });
    insertMany(items);
    return items;
  },

  update: (id: string, updates: Partial<ExpenseItem>) => {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(updates.date);
    }
    if (updates.amount !== undefined) {
      fields.push('amount = ?');
      values.push(updates.amount);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.type !== undefined) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    if (updates.imageUrl !== undefined) {
      fields.push('imageUrl = ?');
      values.push(updates.imageUrl);
    }

    if (fields.length === 0) return;

    values.push(id);
    db.prepare(`UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return expenseQueries.getById(id);
  },

  delete: (id: string) => {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  },
};

// Category CRUD
export const categoryQueries = {
  getAll: () => {
    return db.prepare('SELECT * FROM categories').all() as Category[];
  },

  create: (category: Category) => {
    db.prepare(`
      INSERT INTO categories (id, name, type, color)
      VALUES (?, ?, ?, ?)
    `).run(category.id, category.name, category.type, category.color);
    return category;
  },
};

// RecurringExpense CRUD
export const recurringExpenseQueries = {
  getAll: () => {
    return db.prepare('SELECT * FROM recurring_expenses ORDER BY start_date DESC').all() as Array<{
      id: string;
      name: string;
      amount: number;
      category: string;
      description: string;
      type: 'income' | 'expense';
      repeat_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
      repeat_day: number | null;
      start_date: string;
      end_date: string | null;
      last_processed_date: string | null;
      is_active: number;
    }>;
  },

  getById: (id: string) => {
    return db.prepare('SELECT * FROM recurring_expenses WHERE id = ?').get(id) as any;
  },

  getActive: () => {
    return db.prepare('SELECT * FROM recurring_expenses WHERE is_active = 1').all() as any[];
  },

  create: (item: {
    id: string;
    name: string;
    amount: number;
    category: string;
    description: string;
    type: 'income' | 'expense';
    repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly';
    repeatDay?: number;
    startDate: string;
    endDate?: string;
    isActive: boolean;
  }) => {
    db.prepare(`
      INSERT INTO recurring_expenses (
        id, name, amount, category, description, type,
        repeat_type, repeat_day, start_date, end_date, is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id,
      item.name,
      item.amount,
      item.category,
      item.description,
      item.type,
      item.repeatType,
      item.repeatDay || null,
      item.startDate,
      item.endDate || null,
      item.isActive ? 1 : 0
    );
    return item;
  },

  update: (id: string, updates: Partial<{
    name: string;
    amount: number;
    category: string;
    description: string;
    type: 'income' | 'expense';
    repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly';
    repeatDay?: number;
    startDate: string;
    endDate?: string;
    lastProcessedDate?: string;
    isActive: boolean;
  }>) => {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.amount !== undefined) {
      fields.push('amount = ?');
      values.push(updates.amount);
    }
    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.type !== undefined) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    if (updates.repeatType !== undefined) {
      fields.push('repeat_type = ?');
      values.push(updates.repeatType);
    }
    if (updates.repeatDay !== undefined) {
      fields.push('repeat_day = ?');
      values.push(updates.repeatDay);
    }
    if (updates.startDate !== undefined) {
      fields.push('start_date = ?');
      values.push(updates.startDate);
    }
    if (updates.endDate !== undefined) {
      fields.push('end_date = ?');
      values.push(updates.endDate);
    }
    if (updates.lastProcessedDate !== undefined) {
      fields.push('last_processed_date = ?');
      values.push(updates.lastProcessedDate);
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.isActive ? 1 : 0);
    }

    if (fields.length === 0) return;

    values.push(id);
    db.prepare(`UPDATE recurring_expenses SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return recurringExpenseQueries.getById(id);
  },

  delete: (id: string) => {
    db.prepare('DELETE FROM recurring_expenses WHERE id = ?').run(id);
  },
};

// User CRUD
export const userQueries = {
  getByUsername: (username: string) => {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as {
      id: string;
      username: string;
      password_hash: string;
      is_initial_admin: number;
      created_at: string;
    } | undefined;
  },

  getById: (id: string) => {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as {
      id: string;
      username: string;
      password_hash: string;
      is_initial_admin: number;
      created_at: string;
    } | undefined;
  },

  create: (username: string, passwordHash: string) => {
    const id = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    db.prepare(`
      INSERT INTO users (id, username, password_hash, is_initial_admin)
      VALUES (?, ?, ?, ?)
    `).run(id, username, passwordHash, 0);
    return userQueries.getById(id)!;
  },

  getAll: () => {
    return db.prepare('SELECT id, username, is_initial_admin, created_at FROM users ORDER BY created_at DESC').all() as Array<{
      id: string;
      username: string;
      is_initial_admin: number;
      created_at: string;
    }>;
  },

  deleteInitialAdmin: () => {
    db.prepare('DELETE FROM users WHERE is_initial_admin = 1').run();
  },

  count: () => {
    return (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  },
};

// Invitation Token CRUD
export const invitationTokenQueries = {
  create: (token: string, createdBy: string, expiresAt: string) => {
    db.prepare(`
      INSERT INTO invitation_tokens (token, created_by, expires_at)
      VALUES (?, ?, ?)
    `).run(token, createdBy, expiresAt);
    return invitationTokenQueries.getByToken(token);
  },

  getByToken: (token: string) => {
    return db.prepare('SELECT * FROM invitation_tokens WHERE token = ?').get(token) as {
      token: string;
      created_by: string;
      created_at: string;
      expires_at: string;
      used: number;
      used_at: string | null;
    } | undefined;
  },

  markAsUsed: (token: string) => {
    db.prepare(`
      UPDATE invitation_tokens 
      SET used = 1, used_at = datetime('now')
      WHERE token = ?
    `).run(token);
  },

  isValid: (token: string): boolean => {
    const tokenData = invitationTokenQueries.getByToken(token);
    if (!tokenData) {
      return false;
    }

    // 이미 사용된 토큰인지 확인
    if (tokenData.used === 1) {
      return false;
    }

    // 만료 시간 확인
    const now = new Date().toISOString();
    if (tokenData.expires_at < now) {
      return false;
    }

    return true;
  },

  getAll: (createdBy?: string) => {
    if (createdBy) {
      return db.prepare(`
        SELECT token, created_at, expires_at, used, used_at 
        FROM invitation_tokens 
        WHERE created_by = ?
        ORDER BY created_at DESC
      `).all(createdBy) as Array<{
        token: string;
        created_at: string;
        expires_at: string;
        used: number;
        used_at: string | null;
      }>;
    }
    return db.prepare(`
      SELECT token, created_by, created_at, expires_at, used, used_at 
      FROM invitation_tokens 
      ORDER BY created_at DESC
    `).all() as Array<{
      token: string;
      created_by: string;
      created_at: string;
      expires_at: string;
      used: number;
      used_at: string | null;
    }>;
  },
};

export default db;
