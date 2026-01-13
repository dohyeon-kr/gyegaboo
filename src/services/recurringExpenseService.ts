import type { RecurringExpense } from '../types';
import { apiClient, getErrorMessage } from '../utils/apiClient';

export class RecurringExpenseService {
  /**
   * 모든 고정비를 가져옵니다
   */
  static async getAll(): Promise<RecurringExpense[]> {
    try {
      const { data } = await apiClient.get<RecurringExpense[]>('/recurring-expenses');
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || 'Failed to fetch recurring expenses');
    }
  }

  /**
   * 활성 고정비만 가져옵니다
   */
  static async getActive(): Promise<RecurringExpense[]> {
    try {
      const { data } = await apiClient.get<RecurringExpense[]>('/recurring-expenses/active');
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || 'Failed to fetch active recurring expenses');
    }
  }

  /**
   * 고정비를 생성합니다
   */
  static async create(item: RecurringExpense): Promise<RecurringExpense> {
    try {
      const { data } = await apiClient.post<RecurringExpense>('/recurring-expenses', item);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || 'Failed to create recurring expense');
    }
  }

  /**
   * 고정비를 업데이트합니다
   */
  static async update(id: string, updates: Partial<RecurringExpense>): Promise<RecurringExpense> {
    try {
      const { data } = await apiClient.put<RecurringExpense>(`/recurring-expenses/${id}`, updates);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || 'Failed to update recurring expense');
    }
  }

  /**
   * 고정비를 삭제합니다
   */
  static async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/recurring-expenses/${id}`);
    } catch (error) {
      throw new Error(getErrorMessage(error) || 'Failed to delete recurring expense');
    }
  }

  /**
   * 고정비를 수동으로 처리합니다
   */
  static async process(targetDate?: string): Promise<{ items: any[]; count: number }> {
    try {
      const { data } = await apiClient.post<{ items: any[]; count: number }>('/recurring-expenses/process', { targetDate });
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || 'Failed to process recurring expenses');
    }
  }

  /**
   * 특정 고정비를 수동으로 처리합니다
   */
  static async processById(id: string, targetDate?: string): Promise<any> {
    try {
      const { data } = await apiClient.post<any>(`/recurring-expenses/${id}/process`, { targetDate });
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || 'Failed to process recurring expense');
    }
  }
}
