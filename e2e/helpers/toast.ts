import { Page, expect } from '@playwright/test';

/**
 * Toast 메시지 확인 헬퍼 함수
 * Radix UI Toast는 role="status" 또는 data-state="open" 속성을 가집니다
 */
export async function waitForToast(page: Page, text: string | RegExp, timeout = 5000) {
  const textPattern = typeof text === 'string' ? text : text.source;
  
  // 여러 방법으로 Toast 찾기
  const toastLocator = page.locator('[role="status"]').filter({ hasText: textPattern }).or(
    page.locator('[data-state="open"]').filter({ hasText: textPattern }).or(
      page.getByText(textPattern)
    )
  ).first();
  
  await expect(toastLocator).toBeVisible({ timeout });
}
