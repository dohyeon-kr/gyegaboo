import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

/**
 * 테스트 전 설정
 * 테스트용 데이터베이스 초기화 및 테스트 사용자 생성
 */
setup('테스트 환경 설정', async () => {
  const testDbPath = join(process.cwd(), 'e2e-test.db');
  
  // 기존 테스트 데이터베이스 삭제
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
  }
  
  // 테스트용 데이터베이스 초기화
  process.env.DATABASE_URL = `file:${testDbPath}`;
  process.env.NODE_ENV = 'test';
  
  // Prisma 스키마 적용
  try {
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: `file:${testDbPath}` },
    });
    
    // 테스트용 사용자 생성 스크립트 실행
    // 이 부분은 실제 구현에 맞게 수정 필요
    console.log('테스트 환경 설정 완료');
  } catch (error) {
    console.error('테스트 환경 설정 실패:', error);
    throw error;
  }
});
