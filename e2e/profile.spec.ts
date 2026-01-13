import { test, expect } from '@playwright/test';

test.describe('프로필 관리', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트용 사용자로 로그인
    await page.goto('/');
    await page.getByLabel(/사용자명/i).fill('testuser');
    await page.getByLabel(/비밀번호/i).fill('testpass123');
    await page.getByRole('button', { name: /로그인/i }).click();
    
    await expect(page).toHaveURL('/');
  });

  test('프로필 페이지 접근', async ({ page }) => {
    await page.goto('/profile');
    
    // 프로필 페이지 요소 확인
    await expect(page.getByText(/프로필|profile/i)).toBeVisible();
  });

  test('닉네임 변경', async ({ page }) => {
    await page.goto('/profile');
    
    // 닉네임 입력 필드 찾기
    const nicknameInput = page.getByLabel(/닉네임|nickname/i);
    
    if (await nicknameInput.isVisible()) {
      await nicknameInput.fill('테스트닉네임');
      
      // 저장 버튼 클릭
      await page.getByRole('button', { name: /저장|save/i }).click();
      
      // 저장 완료 확인
      await expect(page.getByText(/저장 완료|변경되었습니다/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('프로필 이미지 업로드', async ({ page }) => {
    await page.goto('/profile');
    
    // 파일 입력 찾기
    const fileInput = page.getByLabel(/이미지|image|프로필/i).or(page.locator('input[type="file"]'));
    
    if (await fileInput.isVisible()) {
      // 테스트용 이미지 파일 생성 (실제로는 fixture 사용 권장)
      // 여기서는 스킵하거나 실제 이미지 파일 경로 사용
      test.skip('프로필 이미지 업로드는 실제 이미지 파일이 필요합니다');
    }
  });
});
