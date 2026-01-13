import type { RecurringExpense } from '../../../src/types/index.js';
import { RecurringExpenseEngine } from '../engines/recurringExpenseEngine.js';
import { ExpenseEngine } from '../engines/expenseEngine.js';
import { recurringExpenseQueries } from '../db.js';

/**
 * Recurring Expense Manager
 * 고정비 관련 use-case를 관리
 */
export class RecurringExpenseManager {
  /**
   * 자연어 텍스트로부터 RecurringExpense 생성 및 저장
   */
  static async createFromText(
    text: string,
    userId: string
  ): Promise<RecurringExpense | null> {
    // 금액 추출
    const amount = ExpenseEngine.extractAmount(text);
    if (!amount || amount <= 0) {
      return null;
    }

    // 유형 및 카테고리 추출
    const type = ExpenseEngine.extractType(text);
    const category = ExpenseEngine.extractCategory(text);

    // RecurringExpense 생성
    const recurringExpense = RecurringExpenseEngine.createFromText(text, amount, category, type);
    if (!recurringExpense) {
      return null;
    }

    return await this.create(recurringExpense, userId);
  }

  /**
   * 구조화된 데이터로부터 RecurringExpense 생성 및 저장
   */
  static async createFromData(
    data: {
      name: string;
      amount: number;
      category: string;
      description: string;
      type: 'income' | 'expense';
      repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly';
      repeatDay?: number;
      startDate: string;
      endDate?: string;
    },
    userId: string
  ): Promise<RecurringExpense> {
    const recurringExpense = RecurringExpenseEngine.createFromData(data);
    return await this.create(recurringExpense, userId);
  }

  /**
   * RecurringExpense 생성 및 저장
   */
  static async create(recurringExpense: RecurringExpense, userId: string): Promise<RecurringExpense> {
    return await recurringExpenseQueries.create(recurringExpense, userId);
  }

  /**
   * RecurringExpense 업데이트
   */
  static async update(
    id: string,
    updates: Partial<RecurringExpense>,
    userId: string
  ): Promise<RecurringExpense | null> {
    // 권한 확인
    const existing = await recurringExpenseQueries.getById(id);
    if (!existing || (existing as any).created_by !== userId) {
      return null;
    }

    return await recurringExpenseQueries.update(id, updates);
  }

  /**
   * RecurringExpense 삭제
   */
  static async delete(id: string, userId: string): Promise<boolean> {
    // 권한 확인
    const existing = await recurringExpenseQueries.getById(id);
    if (!existing || (existing as any).created_by !== userId) {
      return false;
    }

    await recurringExpenseQueries.delete(id);
    return true;
  }

  /**
   * 모든 RecurringExpense 조회
   */
  static async getAll(): Promise<RecurringExpense[]> {
    return await recurringExpenseQueries.getAll();
  }
}
