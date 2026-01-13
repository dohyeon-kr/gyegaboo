import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth';

test.describe('AI 위자드', () => {
  test.beforeEach(async ({ page }) => {
    await AuthHelper.login(page);
  });

  test('AI 위자드 버튼 표시', async ({ page }) => {
    await page.goto('/');
    
    // 플로팅 AI 버튼 확인
    const aiButton = page.locator('button').filter({ has: page.locator('svg') }).last();
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
    await page.getByRole('button', { name: /닫기/i }).click();
    
    // 창이 닫히는지 확인
    await expect(page.getByText(/AI 가이드/i)).not.toBeVisible();
  });

  test('AI로 지출 항목 추가', async ({ page }) => {
    await page.goto('/');
    
    // AI 위자드 열기
    const aiButton = page.locator('button').filter({ has: page.locator('svg[class*="Sparkles"]') });
    await aiButton.click();
    
    // 메시지 입력
    await page.getByPlaceholder(/메시지를 입력하세요/i).fill('오늘 커피 5000원 지출했어');
    
    // 전송 버튼 클릭 (Send 아이콘 버튼)
    await page.locator('button').filter({ has: page.locator('svg[class*="Send"]') }).click();
    
    // AI 응답 대기
    await page.waitForTimeout(3000);
    
    // 응답 확인
    await expect(page.getByText(/추가|완료/i)).toBeVisible({ timeout: 10000 });
    
    // 목록에서 항목 확인
    await page.goto('/');
    await expect(page.getByText(/커피/i)).toBeVisible({ timeout: 10000 });
  });

  test('AI로 고정비 추가', async ({ page }) => {
    await page.goto('/');
    
    // AI 위자드 열기
    const aiButton = page.locator('button').filter({ has: page.locator('svg[class*="Sparkles"]') });
    await aiButton.click();
    
    // 고정비 추가 메시지 입력
    await page.getByPlaceholder(/메시지를 입력하세요/i).fill('매월 관리비 10만원 고정비 추가해줘');
    
    // 전송 버튼 클릭
    await page.locator('button').filter({ has: page.locator('svg[class*="Send"]') }).click();
    
    // AI 응답 대기
    await page.waitForTimeout(3000);
    
    // 응답 확인
    await expect(page.getByText(/고정비|완료/i)).toBeVisible({ timeout: 10000 });
    
    // 고정비 페이지에서 확인
    await page.goto('/recurring');
    await expect(page.getByText(/관리비/i)).toBeVisible({ timeout: 10000 });
  });

  test('AI로 통계 조회', async ({ page }) => {
    await page.goto('/');
    
    // AI 위자드 열기
    const aiButton = page.locator('button').filter({ has: page.locator('svg[class*="Sparkles"]') });
    await aiButton.click();
    
    // 통계 조회 메시지 입력
    await page.getByPlaceholder(/메시지를 입력하세요/i).fill('이번 달 통계 알려줘');
    
    // 전송 버튼 클릭
    await page.locator('button').filter({ has: page.locator('svg[class*="Send"]') }).click();
    
    // AI 응답 대기
    await page.waitForTimeout(3000);
    
    // 통계 정보가 포함된 응답 확인
    await expect(page.getByText(/총|수입|지출|잔액|원/i)).toBeVisible({ timeout: 10000 });
  });

  test('AI 위자드 최소화/최대화', async ({ page }) => {
    await page.goto('/');
    
    // AI 위자드 열기
    const aiButton = page.locator('button').filter({ has: page.locator('svg[class*="Sparkles"]') });
    await aiButton.click();
    
    // 최소화 버튼 클릭 (Minimize2 아이콘)
    await page.locator('button').filter({ has: page.locator('svg[class*="Minimize2"]') }).click();
    
    // 입력 영역이 숨겨지는지 확인
    await expect(page.getByPlaceholder(/메시지를 입력하세요/i)).not.toBeVisible();
    
    // 최대화 버튼 클릭 (Maximize2 아이콘)
    await page.locator('button').filter({ has: page.locator('svg[class*="Maximize2"]') }).click();
    
    // 입력 영역이 다시 표시되는지 확인
    await expect(page.getByPlaceholder(/메시지를 입력하세요/i)).toBeVisible();
  });
});
