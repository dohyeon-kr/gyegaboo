import { Page } from '@playwright/test';

/**
 * Radix UI Select 컴포넌트를 위한 헬퍼 함수
 * Select는 실제 <select> 요소가 아니라 button[role="combobox"]입니다
 */
export async function selectOption(page: Page, label: string | RegExp, option: string) {
  // Label을 통해 찾기
  const labelText = typeof label === 'string' ? label : label.source;
  
  // Select 트리거 찾기 (label의 형제 요소 또는 부모의 형제 요소)
  const selectTrigger = page.locator(`label:has-text("${labelText}")`).locator('..').locator('button[role="combobox"]').or(
    page.locator(`button[role="combobox"]`).filter({ has: page.locator(`label:has-text("${labelText}")`) })
  ).first();
  
  // Select 열기
  await selectTrigger.click();
  
  // 옵션이 나타날 때까지 대기
  await page.waitForSelector('[role="option"]', { timeout: 5000 });
  
  // 옵션 선택 (SelectContent 내부의 SelectItem)
  await page.getByRole('option', { name: option }).click();
  
  // Select가 닫힐 때까지 대기
  await page.waitForTimeout(200);
}

/**
 * ID를 통해 Select 옵션 선택
 */
export async function selectOptionById(page: Page, selectId: string, option: string) {
  // Select 트리거 클릭
  const trigger = page.locator(`button#${selectId}[role="combobox"]`);
  await trigger.click();
  
  // 옵션이 나타날 때까지 대기
  await page.waitForSelector('[role="option"]', { timeout: 5000 });
  
  // 옵션 선택
  await page.getByRole('option', { name: option }).click();
  
  // Select가 닫힐 때까지 대기
  await page.waitForTimeout(200);
}
