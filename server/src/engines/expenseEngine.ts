import type { ExpenseItem } from '../../../src/types/index.js';
import { generateUniqueId } from '../utils/idGenerator.js';

/**
 * Expense Engine
 * 핵심 비즈니스 로직을 담당하는 엔진
 * 순수 함수로 구성되어 테스트와 재사용이 용이함
 */
export class ExpenseEngine {
  /**
   * 자연어 텍스트에서 금액 추출
   */
  static extractAmount(text: string): number | null {
    const amountMatch = text.match(/(\d+(?:,\d+)?)\s*(?:원|만원|천원)?/);
    if (!amountMatch) {
      return null;
    }

    let amount = parseInt(amountMatch[1].replace(/,/g, ''));
    if (text.includes('만원')) {
      amount *= 10000;
    } else if (text.includes('천원')) {
      amount *= 1000;
    }

    return amount;
  }

  /**
   * 자연어 텍스트에서 날짜 추출
   */
  static extractDate(text: string): string {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lowerText = text.toLowerCase();

    if (lowerText.includes('오늘') || lowerText.includes('today')) {
      return today;
    } else if (lowerText.includes('어제') || lowerText.includes('yesterday')) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }

    const dateMatch = text.match(/(\d{4})-(\d{2})-(\d{2})|(\d{1,2})\/(\d{1,2})/);
    if (dateMatch) {
      if (dateMatch[1]) {
        return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      } else {
        const month = dateMatch[4].padStart(2, '0');
        const day = dateMatch[5].padStart(2, '0');
        return `${now.getFullYear()}-${month}-${day}`;
      }
    }

    return today;
  }

  /**
   * 자연어 텍스트에서 유형 추출 (income/expense)
   */
  static extractType(text: string): 'income' | 'expense' {
    const lowerText = text.toLowerCase();
    return (
      lowerText.includes('수입') ||
      lowerText.includes('입금') ||
      lowerText.includes('급여') ||
      lowerText.includes('income')
    )
      ? 'income'
      : 'expense';
  }

  /**
   * 자연어 텍스트에서 카테고리 추출
   */
  static extractCategory(text: string): string {
    const lowerText = text.toLowerCase();
    const categoryKeywords: Record<string, string[]> = {
      식비: ['커피', '음식', '식사', '카페', '맛집', '식당', '치킨', '피자', '햄버거'],
      교통비: ['지하철', '버스', '택시', '기차', '교통', '주차'],
      쇼핑: ['쇼핑', '옷', '신발', '가방', '온라인'],
      의료비: ['병원', '약', '의료', '치과'],
      급여: ['급여', '월급', '연봉'],
      부수입: ['부수입', '용돈', '선물'],
    };

    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some((keyword: string) => lowerText.includes(keyword))) {
        return cat;
      }
    }

    return '기타';
  }

  /**
   * 자연어 텍스트에서 설명 추출
   */
  static extractDescription(text: string, category: string): string {
    let description = text
      .replace(/\d+(?:,\d+)?\s*(?:원|만원|천원)?/g, '')
      .replace(/오늘|어제|today|yesterday/gi, '')
      .replace(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}/g, '')
      .replace(/지출|수입|입금/gi, '')
      .trim();

    if (!description) {
      description = category;
    }

    return description;
  }

  /**
   * 자연어 텍스트에서 ExpenseItem 생성
   */
  static createFromText(text: string): ExpenseItem | null {
    const amount = this.extractAmount(text);
    if (!amount || amount <= 0) {
      return null;
    }

    const date = this.extractDate(text);
    const type = this.extractType(text);
    const category = this.extractCategory(text);
    const description = this.extractDescription(text, category);

    return {
      id: generateUniqueId(),
      date,
      amount,
      category,
      description,
      type,
    };
  }

  /**
   * 구조화된 데이터에서 ExpenseItem 생성
   */
  static createFromData(data: {
    date?: string;
    amount: number;
    category: string;
    description: string;
    type: 'income' | 'expense';
  }): ExpenseItem {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    return {
      id: generateUniqueId(),
      date: data.date || today,
      amount: data.amount,
      category: data.category || '기타',
      description: data.description || '',
      type: data.type || 'expense',
    };
  }

  /**
   * 통계 계산
   */
  static calculateStatistics(expenses: ExpenseItem[]): {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  } {
    const totalIncome = expenses
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpense = expenses
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    const balance = totalIncome - totalExpense;

    // 카테고리별 집계
    const categoryMap = new Map<string, number>();
    expenses.forEach((expense) => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + expense.amount);
    });

    const total = totalIncome + totalExpense;
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }));

    return {
      totalIncome,
      totalExpense,
      balance,
      categoryBreakdown,
    };
  }
}
