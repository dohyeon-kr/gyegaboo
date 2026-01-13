import { PrismaClient } from '@prisma/client';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import type { ExpenseItem, Category } from '../../src/types/index.js';

// shared/data 디렉토리 생성
const sharedDir = join(process.cwd(), 'shared');
const dataDir = join(sharedDir, 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'gyegaboo.db');
const databaseUrl = `file:${dbPath}`;

// 환경 변수 설정 (Prisma가 사용)
process.env.DATABASE_URL = databaseUrl;

// Prisma 클라이언트 생성
export const prisma = new PrismaClient();

// 데이터베이스 파일 존재 여부 확인
const dbExists = existsSync(dbPath);

// 데이터베이스 초기화 (파일이 없을 때만)
export async function initDatabase() {
  // 데이터베이스 파일이 이미 존재하면 초기화하지 않음
  if (dbExists) {
    console.log('Database file exists. Skipping initialization.');
    // 기존 데이터베이스에 기본 카테고리만 확인하고 추가 (없는 경우)
    try {
      await seedDefaultCategories();
    } catch (error) {
      console.warn('Failed to seed default categories:', error);
    }
    return;
  }

  console.log('Initializing new database...');

  // Prisma db push를 사용하여 스키마 적용 (마이그레이션 없이)
  const { execSync } = await import('child_process');
  try {
    // 환경 변수 설정
    process.env.DATABASE_URL = databaseUrl;
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl },
      cwd: process.cwd(),
    });
    console.log('Database schema created successfully');
  } catch (error) {
    console.error('Failed to create database schema:', error);
    throw error;
  }

  // 기본 카테고리 추가
  await seedDefaultCategories();

  // 초기 admin 계정 생성
  await createInitialAdmin();

  console.log('Database initialized');
}


// 기본 카테고리 시드
async function seedDefaultCategories() {
  const defaultCategories: Category[] = [
    { id: '1', name: '식비', type: 'expense', color: '#FF6B6B' },
    { id: '2', name: '교통비', type: 'expense', color: '#4ECDC4' },
    { id: '3', name: '쇼핑', type: 'expense', color: '#45B7D1' },
    { id: '4', name: '의료비', type: 'expense', color: '#FFA07A' },
    { id: '5', name: '기타', type: 'expense', color: '#98D8C8' },
    { id: '6', name: '급여', type: 'income', color: '#6BCB77' },
    { id: '7', name: '부수입', type: 'income', color: '#4D96FF' },
  ];

  for (const cat of defaultCategories) {
    try {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: {},
        create: cat,
      });
    } catch (error) {
      console.warn('Failed to seed category:', cat.name, error);
    }
  }
}

// 초기 admin 계정 생성
async function createInitialAdmin() {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const initialPassword = randomBytes(16).toString('hex');
    const passwordHash = bcrypt.hashSync(initialPassword, 10);
    const adminId = 'admin-' + Date.now();
    
    await prisma.user.create({
      data: {
        id: adminId,
        username: 'admin',
        passwordHash,
        isInitialAdmin: 1,
      },
    });
    
    console.log('\n========================================');
    console.log('🔐 초기 관리자 계정이 생성되었습니다.');
    console.log('========================================');
    console.log('사용자명: admin');
    console.log(`비밀번호: ${initialPassword}`);
    console.log('========================================\n');
    console.log('⚠️  이 비밀번호는 서버 관리자만 확인할 수 있습니다.');
    console.log('⚠️  새로운 관리자를 등록한 후 초기 계정은 자동으로 삭제됩니다.\n');
  }
}

// ExpenseItem CRUD
export const expenseQueries = {
  getAll: async () => {
    const expenses = await prisma.expense.findMany({
      include: {
        creator: {
          select: {
            nickname: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return expenses.map(e => ({
      ...e,
      createdByUsername: e.creator?.nickname || e.creator?.username,
      createdByProfileImageUrl: e.creator?.profileImageUrl || undefined,
    })) as Array<ExpenseItem & { createdByUsername?: string; createdByProfileImageUrl?: string }>;
  },

  getById: async (id: string) => {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            nickname: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });

    if (!expense) return undefined;

    return {
      ...expense,
      createdByUsername: expense.creator?.nickname || expense.creator?.username,
      createdByProfileImageUrl: expense.creator?.profileImageUrl || undefined,
    } as ExpenseItem & { createdByUsername?: string; createdByProfileImageUrl?: string };
  },

  create: async (item: ExpenseItem, createdBy?: string) => {
    const expense = await prisma.expense.create({
      data: {
        id: item.id,
        date: item.date,
        amount: item.amount,
        category: item.category,
        description: item.description,
        type: item.type,
        imageUrl: item.imageUrl || null,
        createdBy: createdBy || null,
      },
      include: {
        creator: {
          select: {
            nickname: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return {
      ...expense,
      createdByUsername: expense.creator?.nickname || expense.creator?.username,
      createdByProfileImageUrl: expense.creator?.profileImageUrl || undefined,
    } as ExpenseItem & { createdByUsername?: string; createdByProfileImageUrl?: string };
  },

  createMany: async (items: ExpenseItem[], createdBy?: string) => {
    await prisma.expense.createMany({
      data: items.map(item => ({
        id: item.id,
        date: item.date,
        amount: item.amount,
        category: item.category,
        description: item.description,
        type: item.type,
        imageUrl: item.imageUrl || null,
        createdBy: createdBy || null,
      })),
      skipDuplicates: true,
    });

    // 생성된 항목들을 다시 조회하여 작성자 정보 포함
    const ids = items.map(i => i.id);
    const expenses = await prisma.expense.findMany({
      where: { id: { in: ids } },
      include: {
        creator: {
          select: {
            nickname: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return expenses.map(e => ({
      ...e,
      createdByUsername: e.creator?.nickname || e.creator?.username,
      createdByProfileImageUrl: e.creator?.profileImageUrl || undefined,
    })) as Array<ExpenseItem & { createdByUsername?: string; createdByProfileImageUrl?: string }>;
  },

  update: async (id: string, updates: Partial<ExpenseItem>) => {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(updates.date !== undefined && { date: updates.date }),
        ...(updates.amount !== undefined && { amount: updates.amount }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.type !== undefined && { type: updates.type }),
        ...(updates.imageUrl !== undefined && { imageUrl: updates.imageUrl || null }),
      },
      include: {
        creator: {
          select: {
            nickname: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return {
      ...expense,
      createdByUsername: expense.creator?.nickname || expense.creator?.username,
      createdByProfileImageUrl: expense.creator?.profileImageUrl || undefined,
    } as ExpenseItem & { createdByUsername?: string; createdByProfileImageUrl?: string };
  },

  delete: async (id: string) => {
    await prisma.expense.delete({
      where: { id },
    });
  },
};

// Category CRUD
export const categoryQueries = {
  getAll: async () => {
    return await prisma.category.findMany() as Category[];
  },

  create: async (category: Category) => {
    return await prisma.category.create({
      data: category,
    }) as Category;
  },
};

// RecurringExpense CRUD
export const recurringExpenseQueries = {
  getAll: async () => {
    const recurring = await prisma.recurringExpense.findMany({
      include: {
        creator: {
          select: {
            nickname: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return recurring.map(r => ({
      ...r,
      createdByUsername: r.creator?.nickname || r.creator?.username,
      createdByProfileImageUrl: r.creator?.profileImageUrl || undefined,
    }));
  },

  getById: async (id: string) => {
    const recurring = await prisma.recurringExpense.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            nickname: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });

    if (!recurring) return undefined;

    return {
      ...recurring,
      createdByUsername: recurring.creator?.nickname || recurring.creator?.username,
      createdByProfileImageUrl: recurring.creator?.profileImageUrl || undefined,
    };
  },

  getActive: async () => {
    const recurring = await prisma.recurringExpense.findMany({
      where: { isActive: 1 },
      include: {
        creator: {
          select: {
            nickname: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return recurring.map(r => ({
      ...r,
      createdByUsername: r.creator?.nickname || r.creator?.username,
      createdByProfileImageUrl: r.creator?.profileImageUrl || undefined,
    }));
  },

  create: async (item: {
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
  }, createdBy?: string) => {
    const recurring = await prisma.recurringExpense.create({
      data: {
        id: item.id,
        name: item.name,
        amount: item.amount,
        category: item.category,
        description: item.description,
        type: item.type,
        repeatType: item.repeatType,
        repeatDay: item.repeatDay || null,
        startDate: item.startDate,
        endDate: item.endDate || null,
        isActive: item.isActive ? 1 : 0,
        createdBy: createdBy || null,
      },
      include: {
        creator: {
          select: {
            nickname: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return {
      ...recurring,
      createdByUsername: recurring.creator?.nickname || recurring.creator?.username,
      createdByProfileImageUrl: recurring.creator?.profileImageUrl || undefined,
    };
  },

  update: async (id: string, updates: Partial<{
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
    const recurring = await prisma.recurringExpense.update({
      where: { id },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.amount !== undefined && { amount: updates.amount }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.type !== undefined && { type: updates.type }),
        ...(updates.repeatType !== undefined && { repeatType: updates.repeatType }),
        ...(updates.repeatDay !== undefined && { repeatDay: updates.repeatDay }),
        ...(updates.startDate !== undefined && { startDate: updates.startDate }),
        ...(updates.endDate !== undefined && { endDate: updates.endDate }),
        ...(updates.lastProcessedDate !== undefined && { lastProcessedDate: updates.lastProcessedDate }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive ? 1 : 0 }),
      },
      include: {
        creator: {
          select: {
            nickname: true,
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return {
      ...recurring,
      createdByUsername: recurring.creator?.nickname || recurring.creator?.username,
      createdByProfileImageUrl: recurring.creator?.profileImageUrl || undefined,
    };
  },

  delete: async (id: string) => {
    await prisma.recurringExpense.delete({
      where: { id },
    });
  },
};

// User CRUD
export const userQueries = {
  getByUsername: async (username: string) => {
    return await prisma.user.findUnique({
      where: { username },
    });
  },

  getById: async (id: string) => {
    return await prisma.user.findUnique({
      where: { id },
    });
  },

  create: async (username: string, passwordHash: string) => {
    const id = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    return await prisma.user.create({
      data: {
        id,
        username,
        passwordHash,
        isInitialAdmin: 0,
      },
    });
  },

  getAll: async () => {
    return await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        nickname: true,
        profileImageUrl: true,
        isInitialAdmin: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  update: async (id: string, updates: {
    nickname?: string;
    profileImageUrl?: string;
  }) => {
    return await prisma.user.update({
      where: { id },
      data: {
        ...(updates.nickname !== undefined && { nickname: updates.nickname || null }),
        ...(updates.profileImageUrl !== undefined && { profileImageUrl: updates.profileImageUrl || null }),
      },
    });
  },

  deleteInitialAdmin: async () => {
    await prisma.user.deleteMany({
      where: { isInitialAdmin: 1 },
    });
  },

  count: async () => {
    return await prisma.user.count();
  },
};

// Invitation Token CRUD
export const invitationTokenQueries = {
  create: async (token: string, createdBy: string, expiresAt: string) => {
    return await prisma.invitationToken.create({
      data: {
        token,
        createdBy,
        expiresAt,
      },
    });
  },

  getByToken: async (token: string) => {
    return await prisma.invitationToken.findUnique({
      where: { token },
    });
  },

  markAsUsed: async (token: string) => {
    await prisma.invitationToken.update({
      where: { token },
      data: {
        used: 1,
        usedAt: new Date().toISOString(),
      },
    });
  },

  isValid: async (token: string): Promise<boolean> => {
    const tokenData = await invitationTokenQueries.getByToken(token);
    if (!tokenData) {
      return false;
    }

    // 이미 사용된 토큰인지 확인
    if (tokenData.used === 1) {
      return false;
    }

    // 만료 시간 확인
    const now = new Date().toISOString();
    if (tokenData.expiresAt < now) {
      return false;
    }

    return true;
  },

  getAll: async (createdBy?: string) => {
    if (createdBy) {
      return await prisma.invitationToken.findMany({
        where: { createdBy },
        select: {
          token: true,
          createdAt: true,
          expiresAt: true,
          used: true,
          usedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }
    return await prisma.invitationToken.findMany({
      select: {
        token: true,
        createdBy: true,
        createdAt: true,
        expiresAt: true,
        used: true,
        usedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
};

export default prisma;
