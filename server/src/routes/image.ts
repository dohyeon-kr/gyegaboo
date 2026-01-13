import { FastifyInstance } from 'fastify';
import {
  extractExpensesFromImage,
  extractExpensesFromImageUrl,
} from '../utils/imageParser.js';

export async function imageRoutes(fastify: FastifyInstance) {
  // 이미지 업로드 및 추출
  fastify.post('/upload', async (request, reply) => {
    const data = await request.file();
    
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    const buffer = await data.toBuffer();
    const items = await extractExpensesFromImage(buffer, data.filename);

    return {
      success: true,
      items,
    };
  });

  // 이미지 URL에서 추출
  fastify.post('/extract', async (request, reply) => {
    const { imageUrl } = request.body as { imageUrl: string };
    
    if (!imageUrl) {
      return reply.code(400).send({ error: 'imageUrl is required' });
    }

    const items = await extractExpensesFromImageUrl(imageUrl);

    return {
      success: true,
      items,
    };
  });
}
