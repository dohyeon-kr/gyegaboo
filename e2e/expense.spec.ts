import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';
import { selectOptionById } from './helpers/select';
import { waitForToast } from './helpers/toast';

test.describe('가계부 항목 관리', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('수동 입력으로 지출 항목 추가', async ({ page }) => {
    // 수동 입력 페이지로 이동
    await page.goto('/manual');
    
    // 폼 작성
    await page.locator('input#date').fill('2024-01-15');
    await selectOptionById(page, 'type', '지출');
    await page.locator('input#amount').fill('5000');
    await selectOptionById(page, 'category', '식비');
    await page.locator('input#description').fill('점심 식사');
    
    // 저장 버튼 클릭 (form submit)
    const submitButton = page.locator('button[type="submit"]').or(
      page.getByRole('button', { name: /저장/i })
    ).first();
    await submitButton.click();
    
    // 성공 메시지 확인 (Toast)
    await waitForToast(page, /추가 완료/i);
    
    // 목록 페이지로 이동하여 항목 확인
    await page.goto('/');
    await expect(page.getByText(/점심 식사/i).first()).toBeVisible();
    await expect(page.getByText(/5,000/i).first()).toBeVisible();
  });

  test('수입 항목 추가', async ({ page }) => {
    await page.goto('/manual');
    
    await selectOptionById(page, 'type', '수입');
    await page.locator('input#amount').fill('100000');
    await selectOptionById(page, 'category', '급여');
    await page.locator('input#description').fill('월급');
    
    await page.getByRole('button', { name: /저장/i }).click();
    
    await expect(page.getByText(/추가 완료/i).first()).toBeVisible({ timeout: 5000 });
    
    // 목록에서 확인
    await page.goto('/');
    await expect(page.getByText(/월급/i).first()).toBeVisible();
    await expect(page.getByText(/100,000/i).first()).toBeVisible();
  });

  test('항목 수정', async ({ page }) => {
    // 먼저 항목 추가
    await page.goto('/manual');
    await selectOptionById(page, 'type', '지출');
    await page.locator('input#amount').fill('5000');
    await selectOptionById(page, 'category', '식비');
    await page.locator('input#description').fill('커피');
    await page.getByRole('button', { name: /저장/i }).click();
    
    // 목록 페이지로 이동
    await page.goto('/');
    
    // 수정 버튼 클릭
    await page.getByText(/커피/i).locator('..').getByRole('button', { name: /수정/i }).click();
    
    // 수정 다이얼로그에서 금액 변경
    await page.getByLabel(/금액/i).fill('6000');
    await page.getByRole('button', { name: /저장/i }).click();
    
    // 수정된 내용 확인
    await expect(page.getByText(/6,000원/i)).toBeVisible();
  });

  test('항목 삭제', async ({ page }) => {
    // 항목 추가
    await page.goto('/manual');
    await selectOptionById(page, 'type', '지출');
    await page.locator('input#amount').fill('3000');
    await selectOptionById(page, 'category', '교통비');
    await page.locator('input#description').fill('지하철');
    await page.getByRole('button', { name: /저장/i }).click();
    
    // 목록 페이지로 이동
    await page.goto('/');
    
    // 삭제 버튼 클릭 (Trash2 아이콘 버튼)
    await page.locator('button').filter({ has: page.locator('svg[class*="Trash2"]') }).first().click();
    
    // 삭제 확인 다이얼로그에서 확인
    await page.getByRole('button', { name: /확인/i }).click();
    
    // 삭제 완료 메시지 확인
    await expect(page.getByText(/삭제 완료/i)).toBeVisible({ timeout: 5000 });
    
    // 목록에서 항목이 사라졌는지 확인
    await expect(page.getByText(/지하철/i)).not.toBeVisible();
  });

  test('항목 필터링 (지출/수입)', async ({ page }) => {
    // 지출 항목 추가
    await page.goto('/manual');
    await selectOptionById(page, 'type', '지출');
    await page.locator('input#amount').fill('5000');
    await selectOptionById(page, 'category', '식비');
    await page.locator('input#description').fill('지출 항목');
    await page.getByRole('button', { name: /저장/i }).click();
    
    // 수입 항목 추가
    await selectOptionById(page, 'type', '수입');
    await page.locator('input#amount').fill('100000');
    await selectOptionById(page, 'category', '급여');
    await page.locator('input#description').fill('수입 항목');
    await page.getByRole('button', { name: /저장/i }).click();
    
    // 목록 페이지로 이동
    await page.goto('/');
    
    // 필터 Select 찾기 (SelectTrigger 클릭)
    await page.locator('button').filter({ hasText: /전체|수입|지출/i }).first().click();
    await page.getByText(/지출/i).click();
    
    // 지출 항목만 표시되는지 확인
    await expect(page.getByText(/지출 항목/i)).toBeVisible();
    await expect(page.getByText(/수입 항목/i)).not.toBeVisible();
    
    // 수입 필터 선택
    await page.locator('button').filter({ hasText: /지출/i }).first().click();
    await page.getByText(/수입/i).click();
    
    // 수입 항목만 표시되는지 확인
    await expect(page.getByText(/수입 항목/i)).toBeVisible();
    await expect(page.getByText(/지출 항목/i)).not.toBeVisible();
  });

  test('항목 검색', async ({ page }) => {
    // 항목 추가
    await page.goto('/manual');
    await selectOptionById(page, 'type', '지출');
    await page.locator('input#amount').fill('5000');
    await selectOptionById(page, 'category', '식비');
    await page.locator('input#description').fill('커피');
    await page.getByRole('button', { name: /저장/i }).click();
    
    await page.goto('/');
    
    // 검색어 입력
    await page.getByPlaceholder(/설명 또는 카테고리로 검색/i).fill('커피');
    
    // 검색 결과 확인
    await expect(page.getByText(/커피/i)).toBeVisible();
    
    // 다른 검색어로 검색
    await page.getByPlaceholder(/설명 또는 카테고리로 검색/i).fill('없는 항목');
    
    // 검색 결과 없음 확인
    await expect(page.getByText(/커피/i)).not.toBeVisible();
  });
});
