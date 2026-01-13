import type { FastifyInstance } from 'fastify';
import { recurringExpenseQueries } from '../db.js';
import { processRecurringExpenses, processRecurringExpenseById } from '../utils/recurringExpenseProcessor.js';
import { generateUniqueId } from '../utils/idGenerator.js';
import type { RecurringExpense } from '../../../src/types/index.js';

export async function recurringExpenseRoutes(fastify: FastifyInstance) {
  // 모든 고정비 조회
  fastify.get('/', async () => {
    const items = recurringExpenseQueries.getAll();
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      category: item.category,
      description: item.description,
      type: item.type,
      repeatType: item.repeat_type,
      repeatDay: item.repeat_day,
      startDate: item.start_date,
      endDate: item.end_date,
      lastProcessedDate: item.last_processed_date,
      isActive: item.is_active === 1,
    }));
  });

  // 활성 고정비만 조회
  fastify.get('/active', async () => {
    const items = recurringExpenseQueries.getActive();
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      category: item.category,
      description: item.description,
      type: item.type,
      repeatType: item.repeat_type,
      repeatDay: item.repeat_day,
      startDate: item.start_date,
      endDate: item.end_date,
      lastProcessedDate: item.last_processed_date,
      isActive: item.is_active === 1,
    }));
  });

  // 고정비 ID로 조회
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = recurringExpenseQueries.getById(id);

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
      repeatType: item.repeat_type,
      repeatDay: item.repeat_day,
      startDate: item.start_date,
      endDate: item.end_date,
      lastProcessedDate: item.last_processed_date,
      isActive: item.is_active === 1,
    };
  });

  // 고정비 생성
  fastify.post('/', async (request, reply) => {
    const data = request.body as RecurringExpense;

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
      id: data.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
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

    recurringExpenseQueries.create(item);
    return item;
  });

  // 고정비 수정
  fastify.put('/:id', async (request, reply) => {
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

    const updated = recurringExpenseQueries.update(id, updateData);

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
      repeatType: updated.repeat_type,
      repeatDay: updated.repeat_day,
      startDate: updated.start_date,
      endDate: updated.end_date,
      lastProcessedDate: updated.last_processed_date,
      isActive: updated.is_active === 1,
    };
  });

  // 고정비 삭제
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    recurringExpenseQueries.delete(id);
    return { success: true };
  });

  // 고정비 처리 (수동 실행)
  fastify.post('/process', async (request) => {
    const { targetDate } = request.body as { targetDate?: string };
    const items = processRecurringExpenses(targetDate);
    return {
      success: true,
      items,
      count: items.length,
    };
  });

  // 특정 고정비 처리
  fastify.post('/:id/process', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { targetDate } = request.body as { targetDate?: string };
    const item = processRecurringExpenseById(id, targetDate);

    if (!item) {
      return reply.code(404).send({ error: 'Recurring expense not found or inactive' });
    }

    return {
      success: true,
      item,
    };
  });
}
