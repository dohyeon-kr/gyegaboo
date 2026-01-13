import { Page } from '@playwright/test';

/**
 * 테스트용 헬퍼 함수
 */
export class AuthHelper {
  /**
   * 테스트 사용자로 로그인
   */
  static async login(page: Page, username: string = 'testuser', password: string = 'testpass123') {
    await page.goto('/');
    await page.getByLabel(/사용자명/i).fill(username);
    await page.getByLabel(/비밀번호/i).fill(password);
    await page.getByRole('button', { name: /로그인/i }).click();
    await page.waitForURL('/', { timeout: 5000 });
  }

  /**
   * 로그아웃
   */
  static async logout(page: Page) {
    await page.getByRole('button', { name: /로그아웃/i }).click();
    await page.waitForURL(/.*login/, { timeout: 5000 });
  }
}
