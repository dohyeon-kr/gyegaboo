import type { AIResponse } from '../types';

// AI API 서비스
// 실제 구현 시 환경 변수로 API 키를 관리해야 합니다
const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:3001/api/ai';

export class AIService {
  /**
   * AI를 통해 가계부 데이터를 읽어옵니다
   * @param query 사용자 질의
   * @returns 가계부 항목 배열
   */
  static async readExpenses(query: string): Promise<AIResponse> {
    try {
      const response = await fetch(`${AI_API_URL}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('AI API 요청 실패');
      }

      const data = await response.json();
      return {
        success: true,
        data: data.items || [],
      };
    } catch (error) {
      console.error('AI 읽기 오류:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류',
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
      const response = await fetch(`${AI_API_URL}/write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('AI API 요청 실패');
      }

      const data = await response.json();
      return {
        success: true,
        data: data.items || [],
      };
    } catch (error) {
      console.error('AI 쓰기 오류:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류',
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
      const response = await fetch(`${AI_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error('AI API 요청 실패');
      }

      const data = await response.json();
      return {
        success: true,
        data: data.items || [],
        message: data.message,
      };
    } catch (error) {
      console.error('AI 채팅 오류:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }
}
