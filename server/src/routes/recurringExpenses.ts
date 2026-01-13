import type { FastifyInstance } from 'fastify';
import { recurringExpenseQueries } from '../db.js';
import { processRecurringExpenses, processRecurringExpenseById } from '../utils/recurringExpenseProcessor.js';
import { generateUniqueId } from '../utils/idGenerator.js';
import type { RecurringExpense } from '../../../src/types/index.js';

export async function recurringExpenseRoutes(fastify: FastifyInstance) {
  // 모든 고정비 조회
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async () => {
    const items = await recurringExpenseQueries.getAll();
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      category: item.category,
      description: item.description,
      type: item.type,
      repeatType: item.repeatType,
      repeatDay: item.repeatDay,
      startDate: item.startDate,
      endDate: item.endDate,
      lastProcessedDate: item.lastProcessedDate,
      isActive: item.isActive === 1,
      createdBy: item.createdBy,
      createdByUsername: item.createdByUsername,
      createdByProfileImageUrl: item.createdByProfileImageUrl,
    }));
  });

  // 활성 고정비만 조회
  fastify.get('/active', {
    preHandler: [fastify.authenticate],
  }, async () => {
    const items = await recurringExpenseQueries.getActive();
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      category: item.category,
      description: item.description,
      type: item.type,
      repeatType: item.repeatType,
      repeatDay: item.repeatDay,
      startDate: item.startDate,
      endDate: item.endDate,
      lastProcessedDate: item.lastProcessedDate,
      isActive: item.isActive === 1,
      createdBy: item.createdBy,
      createdByUsername: item.createdByUsername,
      createdByProfileImageUrl: item.createdByProfileImageUrl,
    }));
  });

  // 고정비 ID로 조회
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await recurringExpenseQueries.getById(id);

    if (!item) {
      return reply.code(404).send({ error: 'Recurring expense not found' });
    }

    return {
      id: item.id,
      name: item.name,
      amount: item.amount,
      category: item.category,
      description: item.description,
      type: item.type,
      repeatType: item.repeatType,
      repeatDay: item.repeatDay,
      startDate: item.startDate,
      endDate: item.endDate,
      lastProcessedDate: item.lastProcessedDate,
      isActive: item.isActive === 1,
      createdBy: item.createdBy,
      createdByUsername: item.createdByUsername,
      createdByProfileImageUrl: item.createdByProfileImageUrl,
    };
  });

  // 고정비 생성
  fastify.post('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const data = request.body as RecurringExpense;
    const user = request.user as { id: string; username: string; isInitialAdmin: boolean };

    if (
      !data.name ||
      !data.amount ||
      !data.category ||
      !data.repeatType ||
      !data.startDate
    ) {
      return reply.code(400).send({ error: 'Invalid recurring expense data' });
    }

    const item = {
      id: data.id || generateUniqueId(),
      name: data.name,
      amount: data.amount,
      category: data.category,
      description: data.description || '',
      type: data.type || 'expense',
      repeatType: data.repeatType,
      repeatDay: data.repeatDay,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive !== false,
    };

    const created = await recurringExpenseQueries.create(item, user.id);
    return {
      id: created.id,
      name: created.name,
      amount: created.amount,
      category: created.category,
      description: created.description,
      type: created.type,
      repeatType: created.repeatType,
      repeatDay: created.repeatDay,
      startDate: created.startDate,
      endDate: created.endDate,
      lastProcessedDate: created.lastProcessedDate,
      isActive: created.isActive === 1,
      createdBy: created.createdBy,
      createdByUsername: created.createdByUsername,
    };
  });

  // 고정비 수정
  fastify.put('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updates = request.body as Partial<RecurringExpense>;

    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.repeatType !== undefined) updateData.repeatType = updates.repeatType;
    if (updates.repeatDay !== undefined) updateData.repeatDay = updates.repeatDay;
    if (updates.startDate !== undefined) updateData.startDate = updates.startDate;
    if (updates.endDate !== undefined) updateData.endDate = updates.endDate;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    const updated = await recurringExpenseQueries.update(id, updateData);

    if (!updated) {
      return reply.code(404).send({ error: 'Recurring expense not found' });
    }

    return {
      id: updated.id,
      name: updated.name,
      amount: updated.amount,
      category: updated.category,
      description: updated.description,
      type: updated.type,
      repeatType: updated.repeatType,
      repeatDay: updated.repeatDay,
      startDate: updated.startDate,
      endDate: updated.endDate,
      lastProcessedDate: updated.lastProcessedDate,
      isActive: updated.isActive === 1,
      createdBy: updated.createdBy,
      createdByUsername: updated.createdByUsername,
    };
  });

  // 고정비 삭제
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await recurringExpenseQueries.delete(id);
    return { success: true };
  });

  // 고정비 처리 (수동 실행)
  fastify.post('/process', {
    preHandler: [fastify.authenticate],
  }, async (request) => {
    const { targetDate } = request.body as { targetDate?: string };
    const items = await processRecurringExpenses(targetDate);
    return {
      success: true,
      items,
      count: items.length,
    };
  });

  // 특정 고정비 처리
  fastify.post('/:id/process', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { targetDate } = request.body as { targetDate?: string };
    const item = await processRecurringExpenseById(id, targetDate);

    if (!item) {
      return reply.code(404).send({ error: 'Recurring expense not found or inactive' });
    }

    return {
      success: true,
      item,
    };
  });
}
