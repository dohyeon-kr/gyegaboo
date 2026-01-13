import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('고정비 관리', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트용 사용자로 로그인
    await loginAsTestUser(page);
  });

  test('고정비 페이지 접근', async ({ page }) => {
    await page.goto('/recurring');
    
    // 고정비 페이지 요소 확인
    await expect(page.getByText(/고정비|recurring/i)).toBeVisible();
  });

  test('고정비 추가', async ({ page }) => {
    await page.goto('/recurring');
    
    // 고정비 추가 폼 찾기
    const nameInput = page.getByLabel(/이름|name/i);
    const amountInput = page.getByLabel(/금액|amount/i);
    const categorySelect = page.getByLabel(/카테고리|category/i);
    const repeatTypeSelect = page.getByLabel(/반복|repeat/i);
    
    if (await nameInput.isVisible()) {
      await nameInput.fill('관리비');
      await amountInput.fill('100000');
      await categorySelect.selectOption('기타');
      await repeatTypeSelect.selectOption('monthly');
      
      // 저장 버튼 클릭
      await page.getByRole('button', { name: /추가|저장|save/i }).click();
      
      // 추가 완료 확인
      await expect(page.getByText(/추가 완료|저장 완료/i)).toBeVisible({ timeout: 5000 });
      
      // 목록에 추가된 항목 확인
      await expect(page.getByText(/관리비/i)).toBeVisible();
    }
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
