import { FastifyInstance } from 'fastify';
import { expenseQueries, categoryQueries } from '../db.js';
import type { ExpenseItem, Category } from '../../../src/types/index.js';

export async function expenseRoutes(fastify: FastifyInstance) {
  // 모든 항목 조회
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async () => {
    return await expenseQueries.getAll();
  });

  // 항목 ID로 조회
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await expenseQueries.getById(id);
    
    if (!item) {
      return reply.code(404).send({ error: 'Item not found' });
    }
    
    return item;
  });

  // 항목 생성
  fastify.post('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const item = request.body as ExpenseItem;
    const user = request.user as { id: string; username: string; isInitialAdmin: boolean };
    
    if (!item.id || !item.date || !item.amount || !item.category || !item.description || !item.type) {
      return reply.code(400).send({ error: 'Invalid item data' });
    }

    const created = await expenseQueries.create(item, user.id);
    return created;
  });

  // 여러 항목 생성
  fastify.post('/batch', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const items = request.body as ExpenseItem[];
    const user = request.user as { id: string; username: string; isInitialAdmin: boolean };
    
    if (!Array.isArray(items)) {
      return reply.code(400).send({ error: 'Items must be an array' });
    }

    const created = await expenseQueries.createMany(items, user.id);
    return created;
  });

  // 항목 수정
  fastify.put('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updates = request.body as Partial<ExpenseItem>;
    
    const updated = await expenseQueries.update(id, updates);
    
    if (!updated) {
      return reply.code(404).send({ error: 'Item not found' });
    }
    
    return updated;
  });

  // 항목 삭제
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await expenseQueries.delete(id);
    return { success: true };
  });

  // 카테고리 조회
  fastify.get('/categories', {
    preHandler: [fastify.authenticate],
  }, async () => {
    return await categoryQueries.getAll();
  });

  // 카테고리 생성
  fastify.post('/categories', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const category = request.body as Category;
    
    if (!category.id || !category.name || !category.type || !category.color) {
      return reply.code(400).send({ error: 'Invalid category data' });
    }

    const created = await categoryQueries.create(category);
    return created;
  });
}
