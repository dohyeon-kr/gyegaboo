import { Page } from '@playwright/test';

/**
 * 테스트용 사용자로 로그인하는 헬퍼 함수
 */
export async function loginAsTestUser(page: Page) {
  await page.goto('/');
  
  // 로그인 폼이 표시될 때까지 대기
  await page.waitForSelector('input[type="text"], input[type="password"]', { timeout: 5000 });
  
  // 사용자명 입력 (Label을 통해 찾기)
  const usernameInput = page.locator('input').filter({ has: page.locator('label:has-text("사용자명")') }).or(
    page.locator('label:has-text("사용자명") + input').or(
      page.locator('input').first()
    )
  );
  
  const passwordInput = page.locator('input[type="password"]').or(
    page.locator('label:has-text("비밀번호") + input').or(
      page.locator('input').nth(1)
    )
  );
  
  await usernameInput.first().fill('testuser');
  await passwordInput.first().fill('testpass123');
  
  // 로그인 버튼 클릭
  await page.getByRole('button', { name: /로그인/i }).click();
  
  // 메인 페이지로 이동할 때까지 대기
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * 로그아웃 헬퍼 함수
 */
export async function logout(page: Page) {
  // 로그아웃 버튼 찾기 (아이콘 버튼일 수 있음)
  const logoutButton = page.getByRole('button', { name: /로그아웃/i }).or(
    page.locator('button[title*="로그아웃" i]')
  );
  
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL(/.*login/, { timeout: 5000 });
  }
}
