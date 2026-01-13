import type { AIResponse } from '../types';
import { apiClient, getErrorMessage } from '../utils/apiClient';

export class AIService {
  /**
   * AI를 통해 가계부 데이터를 읽어옵니다
   * @param query 사용자 질의
   * @returns 가계부 항목 배열
   */
  static async readExpenses(query: string): Promise<AIResponse> {
    try {
      const { data } = await apiClient.post<{ items?: any[] }>('/ai/read', { query });
      return {
        success: true,
        data: data.items || [],
      };
    } catch (error) {
      console.error('AI 읽기 오류:', error);
      return {
        success: false,
        message: getErrorMessage(error) || '알 수 없는 오류',
      };
    }
  }

  /**
   * AI를 통해 가계부 데이터를 작성합니다
   * @param query 사용자 입력 (예: "오늘 커피 5000원 지출")
   * @returns 생성된 가계부 항목
   */
  static async writeExpense(query: string): Promise<AIResponse> {
    try {
      const { data } = await apiClient.post<{ items?: any[] }>('/ai/write', { query });
      return {
        success: true,
        data: data.items || [],
      };
    } catch (error) {
      console.error('AI 쓰기 오류:', error);
      return {
        success: false,
        message: getErrorMessage(error) || '알 수 없는 오류',
      };
    }
  }

  /**
   * 대화형 AI 챗봇과 상호작용
   * @param messages 대화 메시지 배열
   * @returns AI 응답
   */
  static async chat(messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<AIResponse> {
    try {
      const { data } = await apiClient.post<{
        items?: any[];
        recurringExpense?: any;
        message?: string;
      }>('/ai/chat', { messages });
      return {
        success: true,
        data: data.items || [],
        recurringExpense: data.recurringExpense,
        message: data.message,
      };
    } catch (error) {
      console.error('AI 채팅 오류:', error);
      return {
        success: false,
        message: getErrorMessage(error) || '알 수 없는 오류',
      };
    }
  }
}
