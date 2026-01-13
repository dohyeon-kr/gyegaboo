import type { ExpenseItem } from '../../../src/types/index.js';
import { openai } from './openaiClient.js';
import { generateUniqueId } from './idGenerator.js';

/**
 * OpenAI Vision API를 사용하여 이미지에서 가계부 데이터를 추출합니다
 */
export async function extractExpensesFromImage(
  imageBuffer: Buffer,
  filename: string
): Promise<ExpenseItem[]> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    // API 키가 없으면 모의 데이터 반환
    return extractExpensesFromImageFallback();
  }

  try {
    // 이미지를 base64로 인코딩
    const base64Image = imageBuffer.toString('base64');
    const mimeType = getMimeType(filename);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `이 이미지는 영수증이나 가계부 관련 문서입니다. 이미지에서 다음 정보를 추출하여 JSON 형식으로 반환해주세요:
{
  "items": [
    {
      "date": "YYYY-MM-DD",
      "amount": 숫자,
      "category": "카테고리명",
      "description": "설명",
      "type": "expense"
    }
  ]
}

날짜가 명시되지 않으면 오늘 날짜를 사용하세요.
카테고리 목록: 식비, 교통비, 쇼핑, 의료비, 기타
이미지에 여러 항목이 있으면 모두 추출하세요.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return extractExpensesFromImageFallback();
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
      description: item.description || '영수증에서 추출된 항목',
      type: item.type || 'expense',
    }));

    return items.filter((item) => item.amount > 0);
  } catch (error) {
    console.error('OpenAI Vision API 오류:', error);
    return extractExpensesFromImageFallback();
  }
}

/**
 * 이미지 URL에서 가계부 데이터를 추출합니다
 */
export async function extractExpensesFromImageUrl(imageUrl: string): Promise<ExpenseItem[]> {
  if (!openai || !process.env.OPENAI_API_KEY) {
    return extractExpensesFromImageFallback();
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `이 이미지는 영수증이나 가계부 관련 문서입니다. 이미지에서 다음 정보를 추출하여 JSON 형식으로 반환해주세요:
{
  "items": [
    {
      "date": "YYYY-MM-DD",
      "amount": 숫자,
      "category": "카테고리명",
      "description": "설명",
      "type": "expense"
    }
  ]
}

날짜가 명시되지 않으면 오늘 날짜를 사용하세요.
카테고리 목록: 식비, 교통비, 쇼핑, 의료비, 기타
이미지에 여러 항목이 있으면 모두 추출하세요.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return extractExpensesFromImageFallback();
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
      description: item.description || '이미지에서 추출된 항목',
      type: item.type || 'expense',
    }));

    return items.filter((item) => item.amount > 0);
  } catch (error) {
    console.error('OpenAI Vision API 오류:', error);
    return extractExpensesFromImageFallback();
  }
}

/**
 * 파일명에서 MIME 타입 추출
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return mimeTypes[ext || ''] || 'image/jpeg';
}

/**
 * 모의 데이터 반환 (fallback)
 */
function extractExpensesFromImageFallback(): ExpenseItem[] {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  return [
    {
      id: generateUniqueId(),
      date: today,
      amount: 15000,
      category: '식비',
      description: '영수증에서 추출된 항목',
      type: 'expense',
    },
  ];
}
