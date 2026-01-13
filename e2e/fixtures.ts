import { test as base } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

/**
 * 테스트 픽스처
 * 공통 기능을 제공하는 확장된 테스트 객체
 */
export const test = base.extend({
  // 자동 로그인된 페이지
  authenticatedPage: async ({ page }, use) => {
    await loginAsTestUser(page);
    await use(page);
  },

  // 테스트 데이터가 준비된 페이지
  pageWithData: async ({ page }, use) => {
    await loginAsTestUser(page);
    
    // 테스트 데이터 추가 (수동 입력 페이지 사용)
    await page.goto('/manual');
    
    // 수입 항목 추가
    await page.getByLabel(/유형/i).selectOption('income');
    await page.getByLabel(/금액/i).fill('100000');
    await page.getByLabel(/카테고리/i).selectOption('급여');
    await page.getByLabel(/설명/i).fill('테스트 월급');
    await page.getByRole('button', { name: /저장/i }).click();
    
    // 지출 항목 추가
    await page.getByLabel(/유형/i).selectOption('expense');
    await page.getByLabel(/금액/i).fill('50000');
    await page.getByLabel(/카테고리/i).selectOption('식비');
    await page.getByLabel(/설명/i).fill('테스트 식비');
    await page.getByRole('button', { name: /저장/i }).click();
    
    await use(page);
  },
});

export { expect } from '@playwright/test';
