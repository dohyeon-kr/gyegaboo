import type { ExpenseItem, Category } from '../types';
import { apiClient, getErrorMessage } from '../utils/apiClient';

export class ExpenseService {
  /**
   * 모든 가계부 항목을 가져옵니다
   */
  static async getAllExpenses(): Promise<ExpenseItem[]> {
    try {
      const { data } = await apiClient.get<ExpenseItem[]>('/expenses');
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || 'Failed to fetch expenses');
    }
  }

  /**
   * 가계부 항목을 생성합니다
   */
  static async createExpense(item: ExpenseItem): Promise<ExpenseItem> {
    try {
      const { data } = await apiClient.post<ExpenseItem>('/expenses', item);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || 'Failed to create expense');
    }
  }

  /**
   * 여러 가계부 항목을 생성합니다
   */
  static async createExpenses(items: ExpenseItem[]): Promise<ExpenseItem[]> {
    try {
      const { data } = await apiClient.post<ExpenseItem[]>('/expenses/batch', items);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || 'Failed to create expenses');
    }
  }

  /**
   * 가계부 항목을 업데이트합니다
   */
  static async updateExpense(id: string, updates: Partial<ExpenseItem>): Promise<ExpenseItem> {
    try {
      const { data } = await apiClient.put<ExpenseItem>(`/expenses/${id}`, updates);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || 'Failed to update expense');
    }
  }

  /**
   * 가계부 항목을 삭제합니다
   */
  static async deleteExpense(id: string): Promise<void> {
    try {
      await apiClient.delete(`/expenses/${id}`);
    } catch (error) {
      throw new Error(getErrorMessage(error) || 'Failed to delete expense');
    }
  }

  /**
   * 모든 카테고리를 가져옵니다
   */
  static async getAllCategories(): Promise<Category[]> {
    try {
      const { data } = await apiClient.get<Category[]>('/expenses/categories');
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || 'Failed to fetch categories');
    }
  }
}
