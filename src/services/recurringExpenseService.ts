import type { RecurringExpense } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export class RecurringExpenseService {
  /**
   * 모든 고정비를 가져옵니다
   */
  static async getAll(): Promise<RecurringExpense[]> {
    const response = await fetch(`${API_URL}/recurring-expenses`);
    if (!response.ok) {
      throw new Error('Failed to fetch recurring expenses');
    }
    return response.json();
  }

  /**
   * 활성 고정비만 가져옵니다
   */
  static async getActive(): Promise<RecurringExpense[]> {
    const response = await fetch(`${API_URL}/recurring-expenses/active`);
    if (!response.ok) {
      throw new Error('Failed to fetch active recurring expenses');
    }
    return response.json();
  }

  /**
   * 고정비를 생성합니다
   */
  static async create(item: RecurringExpense): Promise<RecurringExpense> {
    const response = await fetch(`${API_URL}/recurring-expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      throw new Error('Failed to create recurring expense');
    }
    return response.json();
  }

  /**
   * 고정비를 업데이트합니다
   */
  static async update(id: string, updates: Partial<RecurringExpense>): Promise<RecurringExpense> {
    const response = await fetch(`${API_URL}/recurring-expenses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update recurring expense');
    }
    return response.json();
  }

  /**
   * 고정비를 삭제합니다
   */
  static async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/recurring-expenses/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete recurring expense');
    }
  }

  /**
   * 고정비를 수동으로 처리합니다
   */
  static async process(targetDate?: string): Promise<{ items: any[]; count: number }> {
    const response = await fetch(`${API_URL}/recurring-expenses/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetDate }),
    });
    if (!response.ok) {
      throw new Error('Failed to process recurring expenses');
    }
    return response.json();
  }

  /**
   * 특정 고정비를 수동으로 처리합니다
   */
  static async processById(id: string, targetDate?: string): Promise<any> {
    const response = await fetch(`${API_URL}/recurring-expenses/${id}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetDate }),
    });
    if (!response.ok) {
      throw new Error('Failed to process recurring expense');
    }
    return response.json();
  }
}
