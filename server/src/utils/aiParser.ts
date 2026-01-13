import type { ExpenseItem, RecurringExpense } from '../../../src/types/index.js';
import { ExpenseEngine } from '../engines/expenseEngine.js';
import { openai } from './openaiClient.js';
import { generateUniqueId } from './idGenerator.js';
import { parseRecurringExpenseFromText } from './recurringExpenseParser.js';

/**
 * OpenAI API를 사용하여 자연어를 파싱하여 가계부 항목을 추출합니다
 * @deprecated ExpenseManager.createFromText를 사용하세요
 */
export async function parseExpenseFromText(text: string): Promise<ExpenseItem[]> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    // API 키가 없으면 Engine 사용
    const item = ExpenseEngine.createFromText(text);
    return item ? [item] : [];
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 가계부 관리 어시스턴트입니다. 사용자의 자연어 입력을 분석하여 가계부 항목을 추출합니다.
응답은 반드시 JSON 형식으로 제공해야 하며, 다음 형식을 따라야 합니다:
{
  "items": [
    {
      "date": "YYYY-MM-DD",
      "amount": 숫자,
      "category": "카테고리명",
      "description": "설명",
      "type": "income" 또는 "expense"
    }
  ]
}

카테고리 목록:
- 식비, 교통비, 쇼핑, 의료비, 기타 (지출용)
- 급여, 부수입 (수입용)

날짜가 명시되지 않으면 오늘 날짜를 사용하세요.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      const item = ExpenseEngine.createFromText(text);
      return item ? [item] : [];
    }

    const parsed = JSON.parse(content) as { items?: Array<{
      date?: string;
      amount?: number | string;
      category?: string;
      description?: string;
      type?: 'income' | 'expense';
    }> };
    const items: ExpenseItem[] = (parsed.items || []).map((item) =>
      ExpenseEngine.createFromData({
        date: item.date,
        amount: typeof item.amount === 'string' ? parseInt(item.amount) : (item.amount || 0),
        category: item.category || '기타',
        description: item.description || '',
        type: item.type || 'expense',
      })
    );

    return items.filter((item) => item.amount > 0);
  } catch (error) {
    console.error('OpenAI API 오류:', error);
    // 오류 발생 시 Engine 사용
    const item = ExpenseEngine.createFromText(text);
    return item ? [item] : [];
  }
}

/**
 * 기본 규칙 기반 파서 (fallback)
 * @deprecated ExpenseEngine.createFromText를 사용하세요
 */
function parseExpenseFromTextFallback(text: string): ExpenseItem[] {
  const item = ExpenseEngine.createFromText(text);
  return item ? [item] : [];
}

/**
 * OpenAI API를 사용한 AI 챗봇 응답 생성
 * @deprecated AIManager.chat을 사용하세요
 */
export async function generateAIResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  expenses: ExpenseItem[]
): Promise<{ items?: ExpenseItem[]; recurringExpense?: RecurringExpense; message: string }> {
  // 레거시 지원을 위해 통계만 계산
  const statistics = ExpenseEngine.calculateStatistics(expenses);
  
  return {
    message: `현재 총 수입: ${statistics.totalIncome.toLocaleString()}원\n총 지출: ${statistics.totalExpense.toLocaleString()}원\n잔액: ${statistics.balance.toLocaleString()}원`,
  };
}
