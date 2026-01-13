import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';
import { selectOptionById } from './helpers/select';
import { waitForToast } from './helpers/toast';

test.describe('고정비 관리', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트용 사용자로 로그인
    await loginAsTestUser(page);
  });

  test('고정비 페이지 접근', async ({ page }) => {
    await page.goto('/recurring');
    
    // 고정비 페이지 요소 확인 (더 구체적인 selector 사용)
    await expect(page.getByRole('heading', { name: /고정비 관리/i })).toBeVisible();
  });

  test('고정비 추가', async ({ page }) => {
    await page.goto('/recurring');
    
    // 추가 버튼 클릭하여 폼 표시
    await page.getByRole('button', { name: /추가/i }).click();
    
    // 고정비 추가 폼 작성
    await page.getByLabel(/이름/i).fill('관리비');
    await page.getByLabel(/금액/i).fill('100000');
    await selectOptionById(page, 'category', '기타');
    await selectOptionById(page, 'type', '지출');
    await selectOptionById(page, 'repeatType', '매월');
    await page.getByLabel(/반복일/i).fill('15');
    await page.getByLabel(/시작일/i).fill('2024-01-15');
    
    // 저장 버튼 클릭
    const submitButton = page.locator('button[type="submit"]').or(
      page.getByRole('button', { name: /저장/i })
    ).first();
    await submitButton.click();
    
    // 추가 완료 확인 (Toast)
    await waitForToast(page, /추가 완료|저장 완료/i);
    
    // 목록에 추가된 항목 확인
    await expect(page.getByText(/관리비/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('고정비 수정', async ({ page }) => {
    await page.goto('/recurring');
    
    // 첫 번째 고정비의 수정 버튼 클릭
    const editButton = page.getByRole('button', { name: /수정|edit/i }).first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // 수정 다이얼로그에서 금액 변경
      const amountInput = page.getByLabel(/금액|amount/i);
      await amountInput.fill('120000');
      
      await page.getByRole('button', { name: /저장|save/i }).click();
      
      // 수정 완료 확인
      await expect(page.getByText(/수정 완료/i)).toBeVisible({ timeout: 5000 });
    } else {
      test.skip();
    }
  });

  test('고정비 삭제', async ({ page }) => {
    await page.goto('/recurring');
    
    // 첫 번째 고정비의 삭제 버튼 클릭
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
});
