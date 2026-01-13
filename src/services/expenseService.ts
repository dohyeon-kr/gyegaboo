import type { ExpenseItem, Category } from '../types';
import { authenticatedFetch } from '../utils/apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export class ExpenseService {
  /**
   * 모든 가계부 항목을 가져옵니다
   */
  static async getAllExpenses(): Promise<ExpenseItem[]> {
    const response = await authenticatedFetch(`${API_URL}/expenses`);
    if (!response.ok) {
      throw new Error('Failed to fetch expenses');
    }
    return response.json();
  }

  /**
   * 가계부 항목을 생성합니다
   */
  static async createExpense(item: ExpenseItem): Promise<ExpenseItem> {
    const response = await authenticatedFetch(`${API_URL}/expenses`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      throw new Error('Failed to create expense');
    }
    return response.json();
  }

  /**
   * 여러 가계부 항목을 생성합니다
   */
  static async createExpenses(items: ExpenseItem[]): Promise<ExpenseItem[]> {
    const response = await authenticatedFetch(`${API_URL}/expenses/batch`, {
      method: 'POST',
      body: JSON.stringify(items),
    });
    if (!response.ok) {
      throw new Error('Failed to create expenses');
    }
    return response.json();
  }

  /**
   * 가계부 항목을 업데이트합니다
   */
  static async updateExpense(id: string, updates: Partial<ExpenseItem>): Promise<ExpenseItem> {
    const response = await authenticatedFetch(`${API_URL}/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update expense');
    }
    return response.json();
  }

  /**
   * 가계부 항목을 삭제합니다
   */
  static async deleteExpense(id: string): Promise<void> {
    const response = await authenticatedFetch(`${API_URL}/expenses/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete expense');
    }
  }

  /**
   * 모든 카테고리를 가져옵니다
   */
  static async getAllCategories(): Promise<Category[]> {
    const response = await authenticatedFetch(`${API_URL}/expenses/categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    return response.json();
  }
}
