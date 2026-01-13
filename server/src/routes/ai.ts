import type { FastifyInstance } from 'fastify';
import { AIManager } from '../managers/aiManager.js';
import { ExpenseManager } from '../managers/expenseManager.js';

export async function aiRoutes(fastify: FastifyInstance) {
  // AI를 통한 가계부 읽기 (레거시 지원)
  fastify.post('/read', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { query } = request.body as { query: string };
    
    if (!query) {
      return reply.code(400).send({ error: 'query is required' });
    }

    const user = request.user as { id: string; username: string; isInitialAdmin: boolean };
    const response = await AIManager.chat(
      [{ role: 'user', content: query }],
      user.id
    );

    return {
      success: true,
      items: response.items || [],
      message: response.message,
    };
  });

  // AI를 통한 가계부 쓰기 (레거시 지원)
  fastify.post('/write', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { query } = request.body as { query: string };
    const user = request.user as { id: string; username: string; isInitialAdmin: boolean };
    
    if (!query) {
      return reply.code(400).send({ error: 'query is required' });
    }

    const items = await ExpenseManager.createFromText(query, user.id);
    
    if (items.length === 0) {
      return reply.code(400).send({
        success: false,
        message: '가계부 항목을 추출할 수 없습니다.',
      });
    }

    return {
      success: true,
      items,
    };
  });

  // AI 챗봇 (Function Calling 사용)
  fastify.post('/chat', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { messages } = request.body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    };
    
    if (!messages || !Array.isArray(messages)) {
      return reply.code(400).send({ error: 'messages array is required' });
    }

    const user = request.user as { id: string; username: string; isInitialAdmin: boolean };
    const response = await AIManager.chat(messages, user.id);

    return {
      success: true,
      items: response.items || [],
      recurringExpense: response.recurringExpense,
      message: response.message,
    };
  });
}
