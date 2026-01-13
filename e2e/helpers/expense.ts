import { Page, expect } from '@playwright/test';

/**
 * 가계부 항목 관련 헬퍼 함수
 */
export class ExpenseHelper {
  /**
   * 수동 입력으로 항목 추가
   */
  static async addExpense(
    page: Page,
    options: {
      date?: string;
      type: 'income' | 'expense';
      amount: number;
      category: string;
      description: string;
    }
  ) {
    await page.goto('/manual');
    
    if (options.date) {
      await page.getByLabel(/날짜/i).fill(options.date);
    }
    await page.getByLabel(/유형/i).selectOption(options.type);
    await page.getByLabel(/금액/i).fill(options.amount.toString());
    await page.getByLabel(/카테고리/i).selectOption(options.category);
    await page.getByLabel(/설명/i).fill(options.description);
    
    await page.getByRole('button', { name: /저장/i }).click();
    
    // 성공 메시지 대기
    await page.waitForSelector('text=/추가 완료/i', { timeout: 5000 });
  }

  /**
   * 항목이 목록에 표시되는지 확인
   */
  static async verifyExpenseInList(page: Page, description: string) {
    await page.goto('/');
    await expect(page.getByText(description)).toBeVisible();
  }
}
