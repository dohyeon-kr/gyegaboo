import { FastifyInstance } from 'fastify';
import {
  extractExpensesFromImage,
  extractExpensesFromImageUrl,
} from '../utils/imageParser.js';
import { expenseQueries } from '../db.js';

export async function imageRoutes(fastify: FastifyInstance) {
  // 이미지 업로드 및 추출
  fastify.post('/upload', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const data = await request.file();
    const user = request.user as { id: string; username: string; isInitialAdmin: boolean };
    
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    const buffer = await data.toBuffer();
    const items = await extractExpensesFromImage(buffer, data.filename);
    
    // 작성자 정보를 포함하여 저장
    const created = expenseQueries.createMany(items, user.id);

    return {
      success: true,
      items: created,
    };
  });

  // 이미지 URL에서 추출
  fastify.post('/extract', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { imageUrl } = request.body as { imageUrl: string };
    const user = request.user as { id: string; username: string; isInitialAdmin: boolean };
    
    if (!imageUrl) {
      return reply.code(400).send({ error: 'imageUrl is required' });
    }

    const items = await extractExpensesFromImageUrl(imageUrl);
    
    // 작성자 정보를 포함하여 저장
    const created = expenseQueries.createMany(items, user.id);

    return {
      success: true,
      items: created,
    };
  });
}
