import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * E2E 테스트 전에 테스트 환경을 설정합니다.
 * - 테스트용 데이터베이스 초기화
 * - 테스트용 사용자 생성
 */
setup('테스트 환경 설정', async () => {
  const testDbPath = join(process.cwd(), 'e2e-test.db');
  
  // 기존 테스트 데이터베이스 삭제
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
  }

  // 테스트용 데이터베이스 디렉토리 생성
  const testDataDir = join(process.cwd(), 'e2e-test-data');
  execSync(`mkdir -p ${testDataDir}`, { stdio: 'inherit' });

  // 환경 변수 설정
  const databaseUrl = `file:${testDbPath}`;
  process.env.DATABASE_URL = databaseUrl;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001';

  // Prisma 스키마 적용
  try {
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
    });
  } catch (error) {
    console.error('Failed to setup database:', error);
    throw error;
  }

  // Prisma 클라이언트 생성
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    // 테스트용 사용자 생성
    const testUserPassword = 'testpass123';
    const testUserPasswordHash = bcrypt.hashSync(testUserPassword, 10);

    await prisma.user.upsert({
      where: { username: 'testuser' },
      update: {
        passwordHash: testUserPasswordHash,
      },
      create: {
        id: `test-user-${Date.now()}`,
        username: 'testuser',
        passwordHash: testUserPasswordHash,
        nickname: '테스트 사용자',
        isInitialAdmin: 0,
      },
    });

    console.log('Test user created: testuser / testpass123');
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  console.log('Test database setup completed');
});
