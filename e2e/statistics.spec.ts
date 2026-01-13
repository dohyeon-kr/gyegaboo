import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('통계 조회', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트용 사용자로 로그인
    await loginAsTestUser(page);
  });

  test('통계 페이지 접근', async ({ page }) => {
    await page.goto('/statistics');
    
    // 통계 페이지 요소 확인 (더 구체적인 selector 사용)
    await expect(page.getByRole('heading', { name: /통계/i })).toBeVisible({ timeout: 5000 });
  });

  test('통계 데이터 표시', async ({ page }) => {
    await page.goto('/statistics');
    
    // 통계 정보가 표시되는지 확인 (각각 개별적으로 확인)
    await expect(page.getByRole('heading', { name: /총 수입/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: /총 지출/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /잔액/i })).toBeVisible();
  });

  test('기간별 통계 조회', async ({ page }) => {
    await page.goto('/statistics');
    
    // 기간 선택기가 있는지 확인
    const dateRangeInput = page.getByLabel(/기간|period|날짜/i);
    
    if (await dateRangeInput.isVisible()) {
      // 기간 선택 테스트
      await dateRangeInput.click();
      // 실제 구현에 따라 추가 테스트 작성
    }
  });
});
