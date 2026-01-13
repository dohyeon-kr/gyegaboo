import type { ExpenseItem } from '../../../src/types/index.js';
import { ExpenseEngine } from '../engines/expenseEngine.js';
import { expenseQueries } from '../db.js';

/**
 * Expense Manager
 * Expense 관련 use-case를 관리
 * Engine의 비즈니스 로직을 사용하여 실제 데이터베이스 작업 수행
 */
export class ExpenseManager {
  /**
   * 자연어 텍스트로부터 ExpenseItem 생성 및 저장
   */
  static async createFromText(text: string, userId: string): Promise<ExpenseItem[]> {
    const item = ExpenseEngine.createFromText(text);
    if (!item) {
      return [];
    }

    return await this.createMany([item], userId);
  }

  /**
   * 구조화된 데이터로부터 ExpenseItem 생성 및 저장
   */
  static async createFromData(
    data: {
      date?: string;
      amount: number;
      category: string;
      description: string;
      type: 'income' | 'expense';
    },
    userId: string
  ): Promise<ExpenseItem> {
    const item = ExpenseEngine.createFromData(data);
    const created = await expenseQueries.createMany([item], userId);
    return created[0];
  }

  /**
   * 여러 ExpenseItem 생성 및 저장
   */
  static async createMany(items: ExpenseItem[], userId: string): Promise<ExpenseItem[]> {
    return await expenseQueries.createMany(items, userId);
  }

  /**
   * ExpenseItem 업데이트
   */
  static async update(id: string, updates: Partial<ExpenseItem>, userId: string): Promise<ExpenseItem | null> {
    // 권한 확인 (작성자만 수정 가능)
    const existing = await expenseQueries.getById(id);
    if (!existing || (existing as any).created_by !== userId) {
      return null;
    }

    const updated = await expenseQueries.update(id, updates);
    return updated;
  }

  /**
   * ExpenseItem 삭제
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    // 권한 확인 (작성자만 삭제 가능)
    const existing = await expenseQueries.getById(id);
    if (!existing || (existing as any).created_by !== userId) {
      return false;
    }

    await expenseQueries.delete(id);
    return true;
  }

  /**
   * 모든 ExpenseItem 조회
   */
  static async getAll(): Promise<ExpenseItem[]> {
    return await expenseQueries.getAll();
  }

  /**
   * 통계 조회
   */
  static async getStatistics(): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  }> {
    const expenses = await this.getAll();
    return ExpenseEngine.calculateStatistics(expenses);
  }

  /**
   * 기간별 ExpenseItem 조회
   */
  static async getByDateRange(startDate: string, endDate: string): Promise<ExpenseItem[]> {
    const expenses = await this.getAll();
    return expenses.filter(
      (expense) => expense.date >= startDate && expense.date <= endDate
    );
  }
}
