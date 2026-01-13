import { create } from 'zustand';
import type { ExpenseItem, Category } from '../types';
import { ExpenseService } from '../services/expenseService';
import { ImageService } from '../services/imageService';
import { AIService } from '../services/aiService';

interface ExpenseStore {
  items: ExpenseItem[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  addItem: (item: ExpenseItem) => Promise<void>;
  addItems: (items: ExpenseItem[]) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, item: Partial<ExpenseItem>) => Promise<void>;
  addCategory: (category: Category) => void;
  getItemsByDateRange: (startDate: string, endDate: string) => ExpenseItem[];
  // 이미지 업로드 관련
  uploadImageAndExtract: (file: File) => Promise<{ success: boolean; items?: ExpenseItem[]; message?: string }>;
  // AI 관련
  chatWithAI: (messages: Array<{ role: 'user' | 'assistant'; content: string }>) => Promise<{
    message?: string;
    data?: ExpenseItem[];
    recurringExpense?: any;
  }>;
}

// 기본 카테고리
const defaultCategories: Category[] = [
  { id: '1', name: '식비', type: 'expense', color: '#FF6B6B' },
  { id: '2', name: '교통비', type: 'expense', color: '#4ECDC4' },
  { id: '3', name: '쇼핑', type: 'expense', color: '#45B7D1' },
  { id: '4', name: '의료비', type: 'expense', color: '#FFA07A' },
  { id: '5', name: '기타', type: 'expense', color: '#98D8C8' },
  { id: '6', name: '급여', type: 'income', color: '#6BCB77' },
  { id: '7', name: '부수입', type: 'income', color: '#4D96FF' },
];

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  items: [],
  categories: defaultCategories,
  loading: false,
  error: null,

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await ExpenseService.getAllExpenses();
      set({ items, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch items',
        loading: false,
      });
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await ExpenseService.getAllCategories();
      set({ categories });
    } catch (error) {
      // 실패 시 기본 카테고리 사용
      console.error('Failed to fetch categories:', error);
    }
  },

  addItem: async (item) => {
    try {
      await ExpenseService.createExpense(item);
      set((state) => ({ items: [...state.items, item] }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add item',
      });
      throw error;
    }
  },

  addItems: async (items) => {
    try {
      await ExpenseService.createExpenses(items);
      set((state) => ({ items: [...state.items, ...items] }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add items',
      });
      throw error;
    }
  },

  removeItem: async (id) => {
    try {
      await ExpenseService.deleteExpense(id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to remove item',
      });
      throw error;
    }
  },

  updateItem: async (id, updates) => {
    try {
      const updated = await ExpenseService.updateExpense(id, updates);
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? updated : item
        ),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update item',
      });
      throw error;
    }
  },

  addCategory: (category) => set((state) => ({
    categories: [...state.categories, category],
  })),

  getItemsByDateRange: (startDate, endDate) => {
    const { items } = get();
    return items.filter(
      (item) => item.date >= startDate && item.date <= endDate
    );
  },

  uploadImageAndExtract: async (file: File) => {
    set({ loading: true, error: null });
    try {
      const response = await ImageService.uploadAndExtract(file);
      if (response.success && response.items && response.items.length > 0) {
        // 추출된 항목을 자동으로 추가
        await get().addItems(response.items);
      }
      set({ loading: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.';
      set({
        error: errorMessage,
        loading: false,
      });
      throw error;
    }
  },

  chatWithAI: async (messages) => {
    set({ loading: true, error: null });
    try {
      const response = await AIService.chat(messages);
      
      // 항목이 생성된 경우 자동으로 추가
      if (response.data && response.data.length > 0) {
        await get().addItems(response.data);
      }
      
      set({ loading: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AI 응답 생성에 실패했습니다.';
      set({
        error: errorMessage,
        loading: false,
      });
      throw error;
    }
  },
}));
