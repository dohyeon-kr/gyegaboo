import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('고정비 관리', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('고정비 페이지 접근', async ({ page }) => {
    await page.goto('/recurring');
    
    // 고정비 페이지 요소 확인
    await expect(page.getByText(/고정비/i)).toBeVisible();
  });

  test('고정비 추가', async ({ page }) => {
    await page.goto('/recurring');
    
    // 추가 버튼 클릭하여 폼 표시
    await page.getByRole('button', { name: /추가/i }).click();
    
    // 고정비 추가 폼 작성
    await page.getByLabel(/이름/i).fill('관리비');
    await page.getByLabel(/금액/i).fill('100000');
    await page.getByLabel(/카테고리/i).selectOption('기타');
    await page.getByLabel(/유형/i).selectOption('expense');
    await page.getByLabel(/반복 유형/i).selectOption('monthly');
    await page.getByLabel(/반복일/i).fill('15');
    await page.getByLabel(/시작일/i).fill('2024-01-15');
    
    // 저장 버튼 클릭
    await page.getByRole('button', { name: /저장/i }).click();
    
    // 성공 메시지 확인
    await expect(page.getByText(/추가 완료|수정 완료/i)).toBeVisible({ timeout: 5000 });
    
    // 목록에서 확인
    await expect(page.getByText(/관리비/i)).toBeVisible({ timeout: 5000 });
  });

  test('고정비 수정', async ({ page }) => {
    // 먼저 고정비 추가
    await page.goto('/recurring');
    
    // 추가 버튼 클릭
    await page.getByRole('button', { name: /추가/i }).click();
    
    await page.getByLabel(/이름/i).fill('월세');
    await page.getByLabel(/금액/i).fill('500000');
    await page.getByLabel(/카테고리/i).selectOption('기타');
    await page.getByLabel(/유형/i).selectOption('expense');
    await page.getByLabel(/반복 유형/i).selectOption('monthly');
    await page.getByLabel(/시작일/i).fill('2024-01-01');
    await page.getByRole('button', { name: /저장/i }).click();
    
    // 수정 버튼 클릭 (Edit 아이콘)
    await page.locator('button').filter({ has: page.locator('svg[class*="Edit"]') }).first().click();
    
    // 금액 수정
    await page.getByLabel(/금액/i).fill('600000');
    await page.getByRole('button', { name: /저장/i }).click();
    
    // 수정된 내용 확인
    await expect(page.getByText(/600,000원/i)).toBeVisible({ timeout: 5000 });
  });

  test('고정비 삭제', async ({ page }) => {
    // 고정비 추가
    await page.goto('/recurring');
    
    // 추가 버튼 클릭
    await page.getByRole('button', { name: /추가/i }).click();
    
    await page.getByLabel(/이름/i).fill('통신비');
    await page.getByLabel(/금액/i).fill('50000');
    await page.getByLabel(/카테고리/i).selectOption('기타');
    await page.getByLabel(/유형/i).selectOption('expense');
    await page.getByLabel(/반복 유형/i).selectOption('monthly');
    await page.getByLabel(/시작일/i).fill('2024-01-01');
    await page.getByRole('button', { name: /저장/i }).click();
    
    // 삭제 버튼 클릭 (Trash2 아이콘)
    await page.locator('button').filter({ has: page.locator('svg[class*="Trash2"]') }).first().click();
    
    // 삭제 확인
    await page.getByRole('button', { name: /확인/i }).click();
    
    // 삭제 완료 확인
    await expect(page.getByText(/삭제 완료/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/통신비/i)).not.toBeVisible();
  });
});
