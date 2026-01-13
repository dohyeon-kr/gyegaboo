import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';
import { ExpenseHelper } from './helpers/expense';

test.describe('통계 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await AuthHelper.login(page);
    
    // 테스트 데이터 추가
    await ExpenseHelper.addExpense(page, {
      type: 'income',
      amount: 100000,
      category: '급여',
      description: '월급',
    });
    
    await ExpenseHelper.addExpense(page, {
      type: 'expense',
      amount: 50000,
      category: '식비',
      description: '식비',
    });
  });

  test('통계 페이지 접근', async ({ page }) => {
    await page.goto('/statistics');
    
    // 통계 페이지 요소 확인
    await expect(page.getByText(/통계/i)).toBeVisible();
    await expect(page.getByText(/수입|지출|잔액/i)).toBeVisible();
  });

  test('통계 데이터 표시', async ({ page }) => {
    await page.goto('/statistics');
    
    // 총 수입 확인
    await expect(page.getByText(/100,000원/i)).toBeVisible();
    
    // 총 지출 확인
    await expect(page.getByText(/50,000원/i)).toBeVisible();
    
    // 잔액 확인 (100,000 - 50,000 = 50,000)
    await expect(page.getByText(/50,000원/i)).toBeVisible();
  });

  test('카테고리별 통계 표시', async ({ page }) => {
    await page.goto('/statistics');
    
    // 카테고리별 집계가 표시되는지 확인
    await expect(page.getByText(/급여/i)).toBeVisible();
    await expect(page.getByText(/식비/i)).toBeVisible();
  });

  test('차트 표시', async ({ page }) => {
    await page.goto('/statistics');
    
    // 차트가 렌더링되는지 확인 (SVG 요소 확인)
    const chart = page.locator('svg');
    await expect(chart).toBeVisible({ timeout: 5000 });
  });
});
