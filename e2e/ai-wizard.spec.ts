import { test, expect } from '@playwright/test';

test.describe('AI 위자드', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트용 사용자로 로그인
    await page.goto('/');
    await page.getByLabel(/사용자명/i).fill('testuser');
    await page.getByLabel(/비밀번호/i).fill('testpass123');
    await page.getByRole('button', { name: /로그인/i }).click();
    
    await expect(page).toHaveURL('/');
  });

  test('AI 위자드 버튼 표시', async ({ page }) => {
    await page.goto('/');
    
    // 플로팅 AI 버튼 확인
    const aiButton = page.getByRole('button').filter({ has: page.locator('svg') }).last();
    await expect(aiButton).toBeVisible();
  });

  test('AI 위자드 열기 및 닫기', async ({ page }) => {
    await page.goto('/');
    
    // AI 버튼 클릭
    const aiButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await aiButton.click();
    
    // AI 위자드 창이 열리는지 확인
    await expect(page.getByText(/AI 가이드/i)).toBeVisible();
    
    // 닫기 버튼 클릭
    const closeButton = page.getByRole('button', { name: /닫기|close/i }).or(page.locator('button').filter({ has: page.locator('[aria-label*="close" i]') }));
    if (await closeButton.first().isVisible()) {
      await closeButton.first().click();
      
      // 창이 닫히는지 확인
      await expect(page.getByText(/AI 가이드/i)).not.toBeVisible();
    }
  });

  test('AI로 지출 항목 추가', async ({ page }) => {
    await page.goto('/');
    
    // AI 위자드 열기
    const aiButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await aiButton.click();
    
    // 메시지 입력
    const input = page.getByPlaceholder(/메시지를 입력하세요/i);
    await expect(input).toBeVisible();
    
    await input.fill('오늘 커피 5000원 지출했어');
    
    // 전송 버튼 클릭
    const sendButton = page.getByRole('button', { name: /전송|send/i }).or(page.locator('button[type="button"]').filter({ has: page.locator('svg') }));
    await sendButton.click();
    
    // AI 응답 대기
    await expect(page.getByText(/추가되었습니다|완료/i)).toBeVisible({ timeout: 15000 });
    
    // 목록에서 항목 확인
    await page.goto('/');
    await expect(page.getByText(/커피/i)).toBeVisible({ timeout: 5000 });
  });

  test('AI로 고정비 추가', async ({ page }) => {
    await page.goto('/');
    
    // AI 위자드 열기
    const aiButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await aiButton.click();
    
    // 고정비 추가 메시지
    const input = page.getByPlaceholder(/메시지를 입력하세요/i);
    await input.fill('매월 관리비 10만원 고정비 추가해줘');
    
    const sendButton = page.getByRole('button', { name: /전송|send/i }).or(page.locator('button[type="button"]').filter({ has: page.locator('svg') }));
    await sendButton.click();
    
    // 응답 대기
    await expect(page.getByText(/고정비|추가되었습니다/i)).toBeVisible({ timeout: 15000 });
    
    // 고정비 페이지에서 확인
    await page.goto('/recurring');
    await expect(page.getByText(/관리비/i)).toBeVisible({ timeout: 5000 });
  });

  test('AI로 통계 조회', async ({ page }) => {
    await page.goto('/');
    
    // AI 위자드 열기
    const aiButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await aiButton.click();
    
    // 통계 조회 메시지
    const input = page.getByPlaceholder(/메시지를 입력하세요/i);
    await input.fill('이번 달 통계 알려줘');
    
    const sendButton = page.getByRole('button', { name: /전송|send/i }).or(page.locator('button[type="button"]').filter({ has: page.locator('svg') }));
    await sendButton.click();
    
    // 통계 정보가 포함된 응답 확인
    await expect(page.getByText(/총|수입|지출|원/i)).toBeVisible({ timeout: 15000 });
  });
});
