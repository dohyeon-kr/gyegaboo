import { FastifyInstance } from 'fastify';
import {
  extractExpensesFromImage,
  extractExpensesFromImageUrl,
} from '../utils/imageParser.js';
import { expenseQueries } from '../db.js';
import { saveReceiptImage } from '../utils/fileStorage.js';

export async function imageRoutes(fastify: FastifyInstance) {
  // 이미지 업로드 및 추출
  fastify.post('/upload', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
    const data = await request.file();
      const user = request.user as { id: string; username: string; isInitialAdmin: boolean };
    
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    const buffer = await data.toBuffer();
      const mimeType = data.mimetype || 'image/jpeg';
      
      // OCR로 데이터 추출
    const items = await extractExpensesFromImage(buffer, data.filename);
      
      if (items.length === 0) {
        return reply.code(400).send({ 
          error: '이미지에서 가계부 데이터를 추출할 수 없습니다.',
          success: false,
        });
      }
      
      // 이미지 파일 저장 (첫 번째 항목에만 이미지 저장)
      if (items.length > 0 && items[0].id) {
        try {
          const imagePath = await saveReceiptImage(buffer, items[0].id, mimeType);
          // 모든 항목에 이미지 경로 추가
          items.forEach(item => {
            item.imageUrl = imagePath;
          });
        } catch (error) {
          fastify.log.warn('이미지 저장 실패 (계속 진행):', error);
        }
      }
      
      // 작성자 정보를 포함하여 저장
      const created = expenseQueries.createMany(items, user.id);

    return {
      success: true,
        items: created,
    };
    } catch (error: any) {
      fastify.log.error('이미지 업로드 오류:', error);
      return reply.code(500).send({ 
        error: error.message || '이미지 처리 중 오류가 발생했습니다.',
        success: false,
      });
    }
  });

  // 이미지 URL에서 추출
  fastify.post('/extract', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
    const { imageUrl } = request.body as { imageUrl: string };
      const user = request.user as { id: string; username: string; isInitialAdmin: boolean };
    
    if (!imageUrl) {
      return reply.code(400).send({ error: 'imageUrl is required' });
    }

    const items = await extractExpensesFromImageUrl(imageUrl);
      
      if (items.length === 0) {
        return reply.code(400).send({ 
          error: '이미지에서 가계부 데이터를 추출할 수 없습니다.',
          success: false,
        });
      }
      
      // 작성자 정보를 포함하여 저장
      const created = expenseQueries.createMany(items, user.id);

    return {
      success: true,
        items: created,
    };
    } catch (error: any) {
      fastify.log.error('이미지 URL 추출 오류:', error);
      return reply.code(500).send({ 
        error: error.message || '이미지 처리 중 오류가 발생했습니다.',
        success: false,
      });
    }
  });
}
