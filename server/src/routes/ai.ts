import type { FastifyInstance } from 'fastify';
import { expenseQueries, recurringExpenseQueries } from '../db.js';
import { generateAIResponse, parseExpenseFromText } from '../utils/aiParser.js';

export async function aiRoutes(fastify: FastifyInstance) {
  // AI를 통한 가계부 읽기
  fastify.post('/read', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
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
  fastify.post('/write', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { query } = request.body as { query: string };
    const user = request.user as { id: string; username: string; isInitialAdmin: boolean };
    
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

    const created = expenseQueries.createMany(items, user.id);

    return {
      success: true,
      items: created,
    };
  });

  // AI 챗봇
  fastify.post('/chat', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { messages } = request.body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    };
    
    if (!messages || !Array.isArray(messages)) {
      return reply.code(400).send({ error: 'messages array is required' });
    }

    const expenses = expenseQueries.getAll();
    const response = await generateAIResponse(messages, expenses);

    const user = request.user as { id: string; username: string; isInitialAdmin: boolean };

    if (response.recurringExpense) {
      // 고정비 생성
      const created = recurringExpenseQueries.create(response.recurringExpense, user.id);
      return {
        success: true,
        recurringExpense: {
          ...response.recurringExpense,
          createdBy: created.created_by,
          createdByUsername: created.createdByUsername,
        },
        message: response.message,
      };
    }

    if (response.items && response.items.length > 0) {
      const created = expenseQueries.createMany(response.items, user.id);
      return {
        success: true,
        items: created,
        message: response.message,
      };
    }

    return {
      success: true,
      items: [],
      message: response.message,
    };
  });
}
