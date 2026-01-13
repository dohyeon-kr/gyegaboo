import { test as base } from '@playwright/test';
import { AuthHelper } from './helpers/auth';
import { ExpenseHelper } from './helpers/expense';

/**
 * 테스트 픽스처
 * 공통 기능을 제공하는 확장된 테스트 객체
 */
export const test = base.extend({
  // 자동 로그인된 페이지
  authenticatedPage: async ({ page }, use) => {
    await AuthHelper.login(page);
    await use(page);
  },

  // 테스트 데이터가 준비된 페이지
  pageWithData: async ({ page }, use) => {
    await AuthHelper.login(page);
    
    // 테스트 데이터 추가
    await ExpenseHelper.addExpense(page, {
      type: 'income',
      amount: 100000,
      category: '급여',
      description: '테스트 월급',
    });
    
    await ExpenseHelper.addExpense(page, {
      type: 'expense',
      amount: 50000,
      category: '식비',
      description: '테스트 식비',
    });
    
    await use(page);
  },
});

export { expect } from '@playwright/test';
