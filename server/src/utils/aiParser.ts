import type { ExpenseItem, RecurringExpense } from '../../../src/types/index.js';
import { expenseQueries } from '../db.js';
import { openai } from './openaiClient.js';
import { generateUniqueId } from './idGenerator.js';
import { parseRecurringExpenseFromText } from './recurringExpenseParser.js';

/**
 * OpenAI API를 사용하여 자연어를 파싱하여 가계부 항목을 추출합니다
 */
export async function parseExpenseFromText(text: string): Promise<ExpenseItem[]> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    // API 키가 없으면 기본 파서 사용
    return parseExpenseFromTextFallback(text);
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
      return parseExpenseFromTextFallback(text);
    }

    const parsed = JSON.parse(content) as { items?: Array<{
      date?: string;
      amount?: number | string;
      category?: string;
      description?: string;
      type?: 'income' | 'expense';
    }> };
    const items: ExpenseItem[] = (parsed.items || []).map((item) => ({
      id: generateUniqueId(),
      date: item.date || new Date().toISOString().split('T')[0],
      amount: typeof item.amount === 'string' ? parseInt(item.amount) : (item.amount || 0),
      category: item.category || '기타',
      description: item.description || '',
      type: item.type || 'expense',
    }));

    return items.filter((item) => item.amount > 0);
  } catch (error) {
    console.error('OpenAI API 오류:', error);
    // 오류 발생 시 기본 파서 사용
    return parseExpenseFromTextFallback(text);
  }
}

/**
 * 기본 규칙 기반 파서 (fallback)
 */
function parseExpenseFromTextFallback(text: string): ExpenseItem[] {
  const items: ExpenseItem[] = [];
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const lowerText = text.toLowerCase();

  // 금액 추출
  const amountMatch = text.match(/(\d+(?:,\d+)?)\s*(?:원|만원|천원)?/);
  if (!amountMatch) {
    return items;
  }

  let amount = parseInt(amountMatch[1].replace(/,/g, ''));
  if (text.includes('만원')) {
    amount *= 10000;
  } else if (text.includes('천원')) {
    amount *= 1000;
  }

  // 날짜 추출
  let date = today;
  if (lowerText.includes('오늘') || lowerText.includes('today')) {
    date = today;
  } else if (lowerText.includes('어제') || lowerText.includes('yesterday')) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    date = yesterday.toISOString().split('T')[0];
  } else {
    const dateMatch = text.match(/(\d{4})-(\d{2})-(\d{2})|(\d{1,2})\/(\d{1,2})/);
    if (dateMatch) {
      if (dateMatch[1]) {
        date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      } else {
        const month = dateMatch[4].padStart(2, '0');
        const day = dateMatch[5].padStart(2, '0');
        date = `${now.getFullYear()}-${month}-${day}`;
      }
    }
  }

  const type: 'income' | 'expense' =
    lowerText.includes('수입') ||
    lowerText.includes('입금') ||
    lowerText.includes('급여') ||
    lowerText.includes('income')
      ? 'income'
      : 'expense';

  let category = '기타';
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
      category = cat;
      break;
    }
  }

  let description = text
    .replace(/\d+(?:,\d+)?\s*(?:원|만원|천원)?/g, '')
    .replace(/오늘|어제|today|yesterday/gi, '')
    .replace(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}/g, '')
    .replace(/지출|수입|입금/gi, '')
    .trim();

  if (!description) {
    description = category;
  }

  const item: ExpenseItem = {
    id: generateUniqueId(),
    date,
    amount,
    category,
    description,
    type,
  };

  items.push(item);
  return items;
}

/**
 * OpenAI API를 사용한 AI 챗봇 응답 생성
 */
export async function generateAIResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  expenses: ExpenseItem[]
): Promise<{ items?: ExpenseItem[]; recurringExpense?: RecurringExpense; message: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return generateAIResponseFallback(messages, expenses);
  }

  try {
    // 통계 정보 준비
    const totalIncome = expenses
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalExpense = expenses
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
    const balance = totalIncome - totalExpense;

    const systemMessage = `당신은 가계부 관리 어시스턴트입니다. 사용자의 질문에 친절하고 도움이 되는 답변을 제공합니다.

현재 가계부 현황:
- 총 수입: ${totalIncome.toLocaleString()}원
- 총 지출: ${totalExpense.toLocaleString()}원
- 잔액: ${balance.toLocaleString()}원

사용자가 가계부 항목을 추가하고 싶어하면, 자연어를 분석하여 구조화된 가계부 데이터를 추출해야 합니다.
통계를 물어보면 현재 가계부 현황을 알려주세요.
일반적인 대화에도 친절하게 응답하세요.`;

    if (!openai) {
      return generateAIResponseFallback(messages, expenses);
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        ...messages,
      ],
      temperature: 0.7,
    });

    const aiMessage = response.choices[0]?.message?.content || '';

    // 마지막 메시지가 항목 추가 요청인지 확인
    const lastMessage = messages[messages.length - 1];
    const userText = lastMessage.content.toLowerCase();

    // 고정비 키워드 확인 (일반 지출/수입보다 먼저 확인)
    const recurringKeywords = [
      '고정비',
      '매월',
      '매주',
      '매일',
      '매년',
      '반복',
      '정기',
      '구독',
      '월세',
      '관리비',
      '통신비',
      '보험',
    ];

    const isRecurringRequest = recurringKeywords.some((keyword) => userText.includes(keyword));

    if (isRecurringRequest) {
      // 고정비 파싱 시도
      const recurringExpense = await parseRecurringExpenseFromText(lastMessage.content, openai);
      if (recurringExpense) {
        return {
          recurringExpense,
          message: aiMessage || `고정비 "${recurringExpense.name}"가 추가되었습니다.`,
        };
      }
    }

    // 일반 지출/수입 확인
    if (
      userText.includes('지출') ||
      userText.includes('수입') ||
      userText.includes('추가') ||
      userText.includes('기록')
    ) {
      const items = await parseExpenseFromText(lastMessage.content);
      if (items.length > 0) {
        await expenseQueries.createMany(items);
        return {
          items,
          message: aiMessage || `${items.length}개의 항목이 추가되었습니다.`,
        };
      }
    }

    return {
      message: aiMessage,
    };
  } catch (error) {
    console.error('OpenAI API 오류:', error);
    return generateAIResponseFallback(messages, expenses);
  }
}

/**
 * 기본 응답 생성 (fallback)
 */
function generateAIResponseFallback(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  expenses: ExpenseItem[]
): { items?: ExpenseItem[]; recurringExpense?: RecurringExpense; message: string } {
  const lastMessage = messages[messages.length - 1];
  const userText = lastMessage.content.toLowerCase();

  if (userText.includes('통계') || userText.includes('얼마') || userText.includes('총')) {
    const totalIncome = expenses
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalExpense = expenses
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
    const balance = totalIncome - totalExpense;

    return {
      message: `현재 총 수입: ${totalIncome.toLocaleString()}원\n총 지출: ${totalExpense.toLocaleString()}원\n잔액: ${balance.toLocaleString()}원`,
    };
  }

  // 고정비 키워드 확인
  const recurringKeywords = [
    '고정비',
    '매월',
    '매주',
    '매일',
    '매년',
    '반복',
    '정기',
    '구독',
    '월세',
    '관리비',
  ];

  const isRecurringRequest = recurringKeywords.some((keyword) => userText.includes(keyword));

  if (isRecurringRequest) {
    const recurringExpense = parseRecurringExpenseFromTextFallback(lastMessage.content);
    if (recurringExpense) {
      return {
        recurringExpense,
        message: `고정비 "${recurringExpense.name}"가 추가되었습니다.`,
      };
    }
  }

  if (userText.includes('지출') || userText.includes('수입') || userText.includes('추가')) {
    const items = parseExpenseFromTextFallback(lastMessage.content);
    if (items.length > 0) {
      expenseQueries.createMany(items);
      return {
        items,
        message: `${items.length}개의 항목이 추가되었습니다.`,
      };
    }
  }

  return {
    message: '가계부를 관리하는 데 도움이 필요하시면 언제든지 말씀해주세요. 예: "오늘 커피 5000원 지출" 또는 "매월 관리비 10만원 고정비 추가"',
  };
}
