import { openai } from '../utils/openaiClient.js';
import { ExpenseManager } from './expenseManager.js';
import { RecurringExpenseManager } from './recurringExpenseManager.js';
import type { ExpenseItem, RecurringExpense } from '../../../src/types/index.js';

/**
 * AI Manager
 * AI 위자드 기능을 제공하는 매니저
 * OpenAI Function Calling을 사용하여 tools 제공
 */
export class AIManager {
  /**
   * OpenAI Function Calling을 위한 tools 정의
   * 비즈니스 로직이 변경되면 여기만 수정하면 됨
   */
  static getTools() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'create_expense',
          description: '가계부 항목(지출 또는 수입)을 생성합니다. 사용자가 지출이나 수입을 기록하고 싶을 때 사용합니다.',
          parameters: {
            type: 'object',
            properties: {
              date: {
                type: 'string',
                description: '날짜 (YYYY-MM-DD 형식). 명시되지 않으면 오늘 날짜를 사용합니다.',
              },
              amount: {
                type: 'number',
                description: '금액 (원 단위)',
              },
              category: {
                type: 'string',
                description: '카테고리 (식비, 교통비, 쇼핑, 의료비, 기타, 급여, 부수입)',
                enum: ['식비', '교통비', '쇼핑', '의료비', '기타', '급여', '부수입'],
              },
              description: {
                type: 'string',
                description: '설명',
              },
              type: {
                type: 'string',
                description: '유형',
                enum: ['income', 'expense'],
              },
            },
            required: ['amount', 'category', 'description', 'type'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'create_recurring_expense',
          description: '고정비(반복되는 지출 또는 수입)를 생성합니다. 사용자가 매월, 매주, 매일 등 반복되는 항목을 추가하고 싶을 때 사용합니다.',
          parameters: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: '고정비 이름 (예: 관리비, 월세, 통신비)',
              },
              amount: {
                type: 'number',
                description: '금액 (원 단위)',
              },
              category: {
                type: 'string',
                description: '카테고리',
                enum: ['식비', '교통비', '쇼핑', '의료비', '기타', '급여', '부수입'],
              },
              description: {
                type: 'string',
                description: '설명',
              },
              type: {
                type: 'string',
                description: '유형',
                enum: ['income', 'expense'],
              },
              repeatType: {
                type: 'string',
                description: '반복 유형',
                enum: ['daily', 'weekly', 'monthly', 'yearly'],
              },
              repeatDay: {
                type: 'number',
                description: '반복일 (월간: 일자, 주간: 요일(0-6), 일간/연간: undefined)',
              },
              startDate: {
                type: 'string',
                description: '시작일 (YYYY-MM-DD 형식)',
              },
              endDate: {
                type: 'string',
                description: '만료일 (YYYY-MM-DD 형식, 선택사항)',
              },
            },
            required: ['name', 'amount', 'category', 'description', 'type', 'repeatType', 'startDate'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_statistics',
          description: '가계부 통계를 조회합니다. 총 수입, 총 지출, 잔액, 카테고리별 집계를 반환합니다.',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'get_expenses',
          description: '가계부 항목 목록을 조회합니다. 특정 기간이나 조건으로 필터링할 수 있습니다.',
          parameters: {
            type: 'object',
            properties: {
              startDate: {
                type: 'string',
                description: '시작일 (YYYY-MM-DD 형식, 선택사항)',
              },
              endDate: {
                type: 'string',
                description: '종료일 (YYYY-MM-DD 형식, 선택사항)',
              },
            },
            required: [],
          },
        },
      },
    ];
  }

  /**
   * AI 챗봇 응답 생성
   */
  static async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    userId: string
  ): Promise<{
    message: string;
    items?: ExpenseItem[];
    recurringExpense?: RecurringExpense;
  }> {
    if (!openai || !process.env.OPENAI_API_KEY) {
      return this.chatFallback(messages, userId);
    }

    try {
      // 통계 정보 준비
      const statistics = await ExpenseManager.getStatistics();

      const systemMessage = `당신은 가계부 관리 AI 어시스턴트입니다. 사용자의 질문에 친절하고 도움이 되는 답변을 제공합니다.

현재 가계부 현황:
- 총 수입: ${statistics.totalIncome.toLocaleString()}원
- 총 지출: ${statistics.totalExpense.toLocaleString()}원
- 잔액: ${statistics.balance.toLocaleString()}원

사용 가능한 기능:
1. create_expense: 지출 또는 수입 항목 추가
2. create_recurring_expense: 고정비 추가
3. get_statistics: 통계 조회
4. get_expenses: 항목 목록 조회

사용자가 항목을 추가하고 싶어하면 적절한 함수를 호출하세요.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          ...messages,
        ],
        tools: this.getTools(),
        tool_choice: 'auto',
        temperature: 0.7,
      });

      const message = response.choices[0]?.message;
      if (!message) {
        return { message: '응답을 생성할 수 없습니다.' };
      }

      // Tool 호출이 있는 경우 처리
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolResults: Array<{ role: 'tool'; content: string; tool_call_id: string }> = [];
        let createdItems: ExpenseItem[] = [];
        let createdRecurringExpense: RecurringExpense | undefined;

        for (const toolCall of message.tool_calls) {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);

          try {
            switch (functionName) {
              case 'create_expense': {
                const item = await ExpenseManager.createFromData(args, userId);
                createdItems.push(item);
                toolResults.push({
                  role: 'tool',
                  content: JSON.stringify({ success: true, item }),
                  tool_call_id: toolCall.id,
                });
                break;
              }

              case 'create_recurring_expense': {
                const recurringExpense = await RecurringExpenseManager.createFromData(args, userId);
                createdRecurringExpense = recurringExpense;
                toolResults.push({
                  role: 'tool',
                  content: JSON.stringify({ success: true, recurringExpense }),
                  tool_call_id: toolCall.id,
                });
                break;
              }

              case 'get_statistics': {
                const stats = await ExpenseManager.getStatistics();
                toolResults.push({
                  role: 'tool',
                  content: JSON.stringify(stats),
                  tool_call_id: toolCall.id,
                });
                break;
              }

              case 'get_expenses': {
                const expenses = args.startDate && args.endDate
                  ? await ExpenseManager.getByDateRange(args.startDate, args.endDate)
                  : await ExpenseManager.getAll();
                toolResults.push({
                  role: 'tool',
                  content: JSON.stringify({ expenses }),
                  tool_call_id: toolCall.id,
                });
                break;
              }

              default:
                toolResults.push({
                  role: 'tool',
                  content: JSON.stringify({ error: `Unknown function: ${functionName}` }),
                  tool_call_id: toolCall.id,
                });
            }
          } catch (error) {
            console.error(`Tool call error (${functionName}):`, error);
            toolResults.push({
              role: 'tool',
              content: JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error',
              }),
              tool_call_id: toolCall.id,
            });
          }
        }

        // Tool 결과를 포함하여 최종 응답 생성
        const finalResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemMessage },
            ...messages,
            message,
            ...toolResults,
          ],
          temperature: 0.7,
        });

        const finalMessage = finalResponse.choices[0]?.message?.content || '처리 완료되었습니다.';

        return {
          message: finalMessage,
          items: createdItems.length > 0 ? createdItems : undefined,
          recurringExpense: createdRecurringExpense,
        };
      }

      // Tool 호출이 없는 경우 일반 응답 반환
      return {
        message: message.content || '응답을 생성할 수 없습니다.',
      };
    } catch (error) {
      console.error('OpenAI API 오류:', error);
      return this.chatFallback(messages, userId);
    }
  }

  /**
   * Fallback 응답 (OpenAI API를 사용할 수 없는 경우)
   */
  private static async chatFallback(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    userId: string
  ): Promise<{
    message: string;
    items?: ExpenseItem[];
    recurringExpense?: RecurringExpense;
  }> {
    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage.content.toLowerCase();

    // 통계 조회
    if (userText.includes('통계') || userText.includes('얼마') || userText.includes('총')) {
      const statistics = await ExpenseManager.getStatistics();
      return {
        message: `현재 총 수입: ${statistics.totalIncome.toLocaleString()}원\n총 지출: ${statistics.totalExpense.toLocaleString()}원\n잔액: ${statistics.balance.toLocaleString()}원`,
      };
    }

    // 고정비 생성
    const recurringKeywords = ['고정비', '매월', '매주', '매일', '매년', '반복', '정기', '구독', '월세', '관리비'];
    const isRecurringRequest = recurringKeywords.some((keyword) => userText.includes(keyword));

    if (isRecurringRequest) {
      const recurringExpense = await RecurringExpenseManager.createFromText(lastMessage.content, userId);
      if (recurringExpense) {
        return {
          message: `고정비 "${recurringExpense.name}"가 추가되었습니다.`,
          recurringExpense,
        };
      }
    }

    // 일반 지출/수입 생성
    if (userText.includes('지출') || userText.includes('수입') || userText.includes('추가')) {
      const items = await ExpenseManager.createFromText(lastMessage.content, userId);
      if (items.length > 0) {
        return {
          message: `${items.length}개의 항목이 추가되었습니다.`,
          items,
        };
      }
    }

    return {
      message: '가계부를 관리하는 데 도움이 필요하시면 언제든지 말씀해주세요. 예: "오늘 커피 5000원 지출" 또는 "매월 관리비 10만원 고정비 추가"',
    };
  }
}
