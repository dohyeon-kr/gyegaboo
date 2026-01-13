import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';
import { selectOptionById } from './helpers/select';

test.describe('지출/수입 관리', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트용 사용자로 로그인
    await loginAsTestUser(page);
  });

  test('수동 입력으로 지출 항목 추가', async ({ page }) => {
    // 수동 입력 페이지로 이동
    await page.goto('/manual');
    
    // 폼 작성
    // 날짜 입력
    await page.locator('input#date').fill('2024-01-15');
    
    // 유형 선택 (Radix UI Select)
    await selectOptionById(page, 'type', '지출');
    
    // 금액 입력
    await page.locator('input#amount').fill('5000');
    
    // 카테고리 선택 (Radix UI Select)
    await selectOptionById(page, 'category', '식비');
    
    // 설명 입력
    await page.locator('input#description').fill('커피');
    
    // 저장 버튼 클릭 (form submit) - type="submit"인 버튼 찾기
    const submitButton = page.locator('button[type="submit"]').or(
      page.getByRole('button', { name: /저장|추가/i })
    ).first();
    await submitButton.click();
    
    // 성공 메시지 확인 (Toast - role="status"인 요소 찾기)
    await expect(page.locator('[role="status"]').filter({ hasText: /추가 완료|저장 완료/i })).toBeVisible({ timeout: 5000 });
    
    // 목록 페이지로 이동하여 항목 확인
    await page.goto('/');
    await expect(page.getByText(/커피/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/5,000/i).first()).toBeVisible();
  });

  test('수동 입력으로 수입 항목 추가', async ({ page }) => {
    await page.goto('/manual');
    
    await page.locator('input#date').fill('2024-01-15');
    await selectOptionById(page, 'type', '수입');
    await page.locator('input#amount').fill('1000000');
    await selectOptionById(page, 'category', '급여');
    await page.locator('input#description').fill('월급');
    
    await page.getByRole('button', { name: /저장/i }).click();
    
    await expect(page.getByText(/추가 완료|저장 완료/i).first()).toBeVisible({ timeout: 5000 });
    
    // 목록에서 확인
    await page.goto('/');
    await expect(page.getByText(/월급/i).first()).toBeVisible();
    await expect(page.getByText(/1,000,000/i).first()).toBeVisible();
  });

  test('항목 수정', async ({ page }) => {
    // 먼저 항목이 있는지 확인
    await page.goto('/');
    
    // 첫 번째 항목의 수정 버튼 클릭
    const editButton = page.getByRole('button', { name: /수정|edit/i }).first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // 수정 다이얼로그에서 금액 변경
      await page.getByLabel(/금액/i).fill('6000');
      await page.getByRole('button', { name: /저장|save/i }).click();
      
      // 수정 완료 확인
      await expect(page.getByText(/수정 완료|저장 완료/i)).toBeVisible({ timeout: 5000 });
    } else {
      // 항목이 없으면 스킵
      test.skip();
    }
  });

  test('항목 삭제', async ({ page }) => {
    await page.goto('/');
    
    // 첫 번째 항목의 삭제 버튼 클릭
    const deleteButton = page.getByRole('button', { name: /삭제|delete/i }).first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // 삭제 확인 다이얼로그에서 확인 클릭
      await page.getByRole('button', { name: /확인|confirm/i }).click();
      
      // 삭제 완료 확인
      await expect(page.getByText(/삭제 완료/i)).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('작성자 필터링', async ({ page }) => {
    await page.goto('/');
    
    // 작성자 필터 선택
    const authorFilter = page.getByLabel(/작성자|author/i);
    
    if (await authorFilter.isVisible()) {
      await authorFilter.selectOption('testuser');
      
      // 필터링된 항목만 표시되는지 확인
      await expect(page.getByText(/testuser/i)).toBeVisible();
    }
  });

  test('검색 기능', async ({ page }) => {
    await page.goto('/');
    
    // 검색 입력
    const searchInput = page.getByPlaceholder(/검색|search/i);
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('커피');
      
      // 검색 결과 확인
      await expect(page.getByText(/커피/i)).toBeVisible();
    }
  });
});
