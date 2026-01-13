import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

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
  process.env.DATABASE_URL = `file:${testDbPath}`;
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001';

  // Prisma 스키마 적용
  try {
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: `file:${testDbPath}`,
      },
    });
  } catch (error) {
    console.error('Failed to setup database:', error);
    throw error;
  }

  // 테스트용 사용자 생성 스크립트 실행
  // (서버가 시작되면 initDatabase에서 초기 관리자가 생성됨)
  console.log('Test database setup completed');
});
