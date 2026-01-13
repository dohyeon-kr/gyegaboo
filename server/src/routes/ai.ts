import type { FastifyInstance } from 'fastify';
import { expenseQueries } from '../db.js';
import { generateAIResponse, parseExpenseFromText } from '../utils/aiParser.js';

export async function aiRoutes(fastify: FastifyInstance) {
  // AI를 통한 가계부 읽기
  fastify.post('/read', async (request, reply) => {
    const { query } = request.body as { query: string };
    
    if (!query) {
      return reply.code(400).send({ error: 'query is required' });
    }

    const expenses = expenseQueries.getAll();
    const response = await generateAIResponse(
      [{ role: 'user', content: query }],
      expenses
    );

    return {
      success: true,
      items: response.items || [],
      message: response.message,
    };
  });

  // AI를 통한 가계부 쓰기
  fastify.post('/write', async (request, reply) => {
    const { query } = request.body as { query: string };
    
    if (!query) {
      return reply.code(400).send({ error: 'query is required' });
    }

    const items = await parseExpenseFromText(query);
    
    if (items.length === 0) {
      return reply.code(400).send({
        success: false,
        message: '가계부 항목을 추출할 수 없습니다.',
      });
    }

    expenseQueries.createMany(items);

    return {
      success: true,
      items,
    };
  });

  // AI 챗봇
  fastify.post('/chat', async (request, reply) => {
    const { messages } = request.body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    };
    
    if (!messages || !Array.isArray(messages)) {
      return reply.code(400).send({ error: 'messages array is required' });
    }

    const expenses = expenseQueries.getAll();
    const response = await generateAIResponse(messages, expenses);

    return {
      success: true,
      items: response.items || [],
      message: response.message,
    };
  });
}
