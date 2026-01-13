import { test, expect } from '@playwright/test';

test.describe('인증 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 로그아웃 상태로 시작
    await page.goto('/');
    // 로그인 페이지로 리다이렉트되거나 로그인 폼이 표시되는지 확인
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      // 로그인 폼이 있는지 확인
      await expect(page.getByRole('heading', { name: /가계부/i })).toBeVisible({ timeout: 5000 });
    }
  });

  test('로그인 페이지 표시', async ({ page }) => {
    await page.goto('/');
    
    // 로그인 폼이 표시되는지 확인
    await expect(page.getByRole('heading', { name: /가계부/i })).toBeVisible({ timeout: 5000 });
    
    // 입력 필드 확인 (Label을 통해 찾기)
    const usernameLabel = page.locator('label:has-text("사용자명")');
    const passwordLabel = page.locator('label:has-text("비밀번호")');
    
    await expect(usernameLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
    await expect(page.getByRole('button', { name: /로그인/i })).toBeVisible();
  });

  test('잘못된 자격증명으로 로그인 실패', async ({ page }) => {
    await page.goto('/');
    
    // 입력 필드 찾기
    const usernameInput = page.locator('input#username').or(page.locator('input').first());
    const passwordInput = page.locator('input#password').or(page.locator('input[type="password"]'));
    
    await usernameInput.fill('invalid-user');
    await passwordInput.fill('wrong-password');
    await page.getByRole('button', { name: /로그인/i }).click();
    
    // 에러 메시지 표시 확인 (Toast)
    await expect(page.locator('[role="status"]').filter({ hasText: /로그인 실패/i })).toBeVisible({ timeout: 5000 });
  });

  test('초기 관리자 등록 플로우', async ({ page }) => {
    // 초기 관리자로 로그인 (테스트용 초기 관리자 생성 필요)
    // 이 테스트는 초기 관리자가 있을 때만 작동하므로 스킵
    test.skip('초기 관리자 등록은 초기 설정 시에만 가능합니다');
  });

  test('정상 로그인 후 메인 페이지 이동', async ({ page }) => {
    // 테스트용 사용자 생성 필요 (setup에서)
    await page.goto('/');
    
    const usernameInput = page.locator('input#username').or(page.locator('input').first());
    const passwordInput = page.locator('input#password').or(page.locator('input[type="password"]'));
    
    await usernameInput.fill('testuser');
    await passwordInput.fill('testpass123');
    await page.getByRole('button', { name: /로그인/i }).click();
    
    // 메인 페이지로 이동 확인
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByText(/목록/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('로그아웃 기능', async ({ page }) => {
    // 먼저 로그인
    await page.goto('/');
    const usernameInput = page.locator('input#username').or(page.locator('input').first());
    const passwordInput = page.locator('input#password').or(page.locator('input[type="password"]'));
    
    await usernameInput.fill('testuser');
    await passwordInput.fill('testpass123');
    await page.getByRole('button', { name: /로그인/i }).click();
    
    // 메인 페이지로 이동 확인
    await expect(page).toHaveURL('/', { timeout: 10000 });
    
    // 로그아웃 버튼 클릭 (메뉴에서 찾기)
    const logoutButton = page.getByRole('button', { name: /로그아웃/i }).or(
      page.locator('button[title*="로그아웃" i]')
    );
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      // 로그인 페이지로 리다이렉트 또는 로그인 폼 표시 확인
      await expect(page.getByRole('heading', { name: /가계부/i })).toBeVisible({ timeout: 5000 });
    }
  });
});
