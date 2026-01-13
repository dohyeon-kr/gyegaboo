import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';

test.describe('프로필 관리', () => {
  test.beforeEach(async ({ page }) => {
    await AuthHelper.login(page);
  });

  test('프로필 페이지 접근', async ({ page }) => {
    await page.goto('/profile');
    
    // 프로필 페이지 요소 확인
    await expect(page.getByText(/프로필/i)).toBeVisible();
    await expect(page.getByLabel(/닉네임/i)).toBeVisible();
  });

  test('닉네임 변경', async ({ page }) => {
    await page.goto('/profile');
    
    // 닉네임 입력
    await page.getByLabel(/닉네임/i).fill('새 닉네임');
    await page.getByRole('button', { name: /저장/i }).click();
    
    // 성공 메시지 확인
    await expect(page.getByText(/저장 완료/i)).toBeVisible();
    
    // 변경된 닉네임 확인
    await expect(page.getByLabel(/닉네임/i)).toHaveValue('새 닉네임');
  });

  test('프로필 이미지 업로드', async ({ page }) => {
    await page.goto('/profile');
    
    // 테스트용 이미지 파일 생성 (1x1 PNG)
    const imageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    
    // 파일 입력 요소 찾기
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: imageBuffer,
    });
    
    // 업로드 버튼 클릭
    await page.getByRole('button', { name: /업로드/i }).click();
    
    // 업로드 완료 메시지 확인
    await expect(page.getByText(/업로드 완료/i)).toBeVisible({ timeout: 10000 });
  });
});
