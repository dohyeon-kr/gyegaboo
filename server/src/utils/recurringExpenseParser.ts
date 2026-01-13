import type { RecurringExpense } from '../../../src/types/index.js';
import { generateUniqueId } from './idGenerator.js';
import { getToday } from '../../../src/utils/dateUtils.js';

/**
 * OpenAI API를 사용하여 자연어에서 고정비 정보를 추출합니다
 */
export async function parseRecurringExpenseFromText(
  text: string,
  openai: any
): Promise<RecurringExpense | null> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    return parseRecurringExpenseFromTextFallback(text);
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 가계부 관리 어시스턴트입니다. 사용자의 자연어 입력을 분석하여 고정비(반복되는 수입/지출) 정보를 추출합니다.

고정비는 매일, 매주, 매월, 매년 반복되는 수입 또는 지출입니다.

응답은 반드시 JSON 형식으로 제공해야 하며, 다음 형식을 따라야 합니다:
{
  "isRecurring": true 또는 false,
  "name": "고정비 이름",
  "amount": 숫자,
  "category": "카테고리명",
  "description": "설명",
  "type": "income" 또는 "expense",
  "repeatType": "daily" | "weekly" | "monthly" | "yearly",
  "repeatDay": 숫자 (weekly의 경우 0-6, monthly의 경우 1-31),
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD" 또는 null
}

고정비가 아닌 경우 isRecurring을 false로 설정하세요.
repeatType이 weekly인 경우 repeatDay는 0(일요일)부터 6(토요일)까지입니다.
repeatType이 monthly인 경우 repeatDay는 1부터 31까지입니다.
날짜가 명시되지 않으면 오늘 날짜를 시작일로 사용하세요.`,
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
      return parseRecurringExpenseFromTextFallback(text);
    }

    const parsed = JSON.parse(content) as {
      isRecurring?: boolean;
      name?: string;
      amount?: number | string;
      category?: string;
      description?: string;
      type?: 'income' | 'expense';
      repeatType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
      repeatDay?: number;
      startDate?: string;
      endDate?: string | null;
    };

    if (!parsed.isRecurring || !parsed.name || !parsed.amount) {
      return null;
    }

    const recurringExpense: RecurringExpense = {
      id: generateUniqueId(),
      name: parsed.name,
      amount: typeof parsed.amount === 'string' ? parseInt(parsed.amount) : parsed.amount,
      category: parsed.category || '기타',
      description: parsed.description || '',
      type: parsed.type || 'expense',
      repeatType: parsed.repeatType || 'monthly',
      repeatDay: parsed.repeatDay,
      startDate: parsed.startDate || getToday(),
      endDate: parsed.endDate || undefined,
      isActive: true,
    };

    return recurringExpense;
  } catch (error) {
    console.error('OpenAI API 오류:', error);
    return parseRecurringExpenseFromTextFallback(text);
  }
}

/**
 * 기본 규칙 기반 파서 (fallback)
 */
function parseRecurringExpenseFromTextFallback(text: string): RecurringExpense | null {
  const lowerText = text.toLowerCase();

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
    '통신비',
    '보험',
  ];

  const isRecurring = recurringKeywords.some((keyword) => lowerText.includes(keyword));
  if (!isRecurring) {
    return null;
  }

  // 금액 추출
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

  // 반복 유형 추출
  let repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly';
  if (lowerText.includes('매일') || lowerText.includes('일일')) {
    repeatType = 'daily';
  } else if (lowerText.includes('매주') || lowerText.includes('주간')) {
    repeatType = 'weekly';
  } else if (lowerText.includes('매년') || lowerText.includes('연간')) {
    repeatType = 'yearly';
  }

  // 이름 추출
  let name = text
    .replace(/\d+(?:,\d+)?\s*(?:원|만원|천원)?/g, '')
    .replace(/고정비|매월|매주|매일|매년|반복|정기/gi, '')
    .trim();

  if (!name) {
    name = '고정비';
  }

  // 카테고리 추출
  let category = '기타';
  const categoryKeywords: Record<string, string[]> = {
    식비: ['식비', '음식', '식사'],
    교통비: ['교통', '지하철', '버스', '택시'],
    쇼핑: ['쇼핑', '구독'],
    의료비: ['의료', '병원', '약'],
    주거비: ['월세', '관리비', '전기세', '가스비', '수도세'],
    통신비: ['통신', '핸드폰', '인터넷'],
    보험: ['보험'],
    급여: ['급여', '월급'],
  };

  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      category = cat;
      break;
    }
  }

  const type: 'income' | 'expense' = lowerText.includes('수입') || lowerText.includes('급여') ? 'income' : 'expense';

  return {
    id: generateUniqueId(),
    name,
    amount,
    category,
    description: text,
    type,
    repeatType,
    startDate: getToday(),
    isActive: true,
  };
}
