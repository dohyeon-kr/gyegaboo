import type { RecurringExpense } from '../../../src/types/index.js';
import { generateUniqueId } from '../utils/idGenerator.js';

/**
 * Recurring Expense Engine
 * 고정비 관련 핵심 비즈니스 로직
 */
export class RecurringExpenseEngine {
  /**
   * 자연어 텍스트에서 반복 유형 추출
   */
  static extractRepeatType(text: string): 'daily' | 'weekly' | 'monthly' | 'yearly' {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('매일') || lowerText.includes('일일')) {
      return 'daily';
    } else if (lowerText.includes('매주') || lowerText.includes('주간')) {
      return 'weekly';
    } else if (lowerText.includes('매년') || lowerText.includes('연간')) {
      return 'yearly';
    } else {
      // 기본값은 월간
      return 'monthly';
    }
  }

  /**
   * 자연어 텍스트에서 반복일 추출
   */
  static extractRepeatDay(text: string, repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly'): number | undefined {
    if (repeatType === 'daily') {
      return undefined;
    }

    // 월간: 일자 추출 (예: 매월 15일)
    if (repeatType === 'monthly') {
      const dayMatch = text.match(/(\d{1,2})\s*일/);
      if (dayMatch) {
        return parseInt(dayMatch[1]);
      }
    }

    // 주간: 요일 추출 (예: 매주 월요일)
    if (repeatType === 'weekly') {
      const dayNames: Record<string, number> = {
        일요일: 0,
        월요일: 1,
        화요일: 2,
        수요일: 3,
        목요일: 4,
        금요일: 5,
        토요일: 6,
      };

      for (const [dayName, day] of Object.entries(dayNames)) {
        if (text.includes(dayName)) {
          return day;
        }
      }
    }

    return undefined;
  }

  /**
   * 자연어 텍스트에서 시작일 추출
   */
  static extractStartDate(text: string): string {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // 날짜가 명시되지 않으면 오늘부터 시작
    const dateMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    }

    return today;
  }

  /**
   * 자연어 텍스트에서 만료일 추출
   */
  static extractEndDate(text: string): string | undefined {
    const endDateMatch = text.match(/까지|~|부터\s*(\d{4})-(\d{2})-(\d{2})/);
    if (endDateMatch && endDateMatch[1]) {
      return `${endDateMatch[1]}-${endDateMatch[2]}-${endDateMatch[3]}`;
    }

    return undefined;
  }

  /**
   * 자연어 텍스트에서 이름 추출
   */
  static extractName(text: string): string {
    // 고정비 관련 키워드 제거
    const cleaned = text
      .replace(/고정비|매월|매주|매일|매년|반복|정기|구독/gi, '')
      .replace(/\d+(?:,\d+)?\s*(?:원|만원|천원)?/g, '')
      .trim();

    return cleaned || '고정비';
  }

  /**
   * 자연어 텍스트에서 RecurringExpense 생성
   */
  static createFromText(text: string, amount: number, category: string, type: 'income' | 'expense'): RecurringExpense | null {
    const repeatType = this.extractRepeatType(text);
    const repeatDay = this.extractRepeatDay(text, repeatType);
    const startDate = this.extractStartDate(text);
    const endDate = this.extractEndDate(text);
    const name = this.extractName(text);

    return {
      id: generateUniqueId(),
      name: name || category,
      amount,
      category,
      description: text,
      type,
      repeatType,
      repeatDay,
      startDate,
      endDate,
      isActive: true,
    };
  }

  /**
   * 구조화된 데이터에서 RecurringExpense 생성
   */
  static createFromData(data: {
    name: string;
    amount: number;
    category: string;
    description: string;
    type: 'income' | 'expense';
    repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly';
    repeatDay?: number;
    startDate: string;
    endDate?: string;
  }): RecurringExpense {
    return {
      id: generateUniqueId(),
      name: data.name,
      amount: data.amount,
      category: data.category || '기타',
      description: data.description || '',
      type: data.type || 'expense',
      repeatType: data.repeatType,
      repeatDay: data.repeatDay,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: true,
    };
  }
}
