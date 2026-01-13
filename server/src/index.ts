import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import { initDatabase } from './db.js';
import { aiRoutes } from './routes/ai.js';
import { imageRoutes } from './routes/image.js';
import { expenseRoutes } from './routes/expenses.js';
import { recurringExpenseRoutes } from './routes/recurringExpenses.js';
import { authRoutes } from './routes/auth.js';
import { processRecurringExpenses } from './utils/recurringExpenseProcessor.js';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  // data 디렉토리 생성
  const dataDir = join(process.cwd(), 'data');
  try {
    await mkdir(dataDir, { recursive: true });
  } catch (error) {
    // 이미 존재하는 경우 무시
  }

  // 데이터베이스 초기화
  initDatabase();

  // 서버 시작 시 고정비 처리
  try {
    const processed = processRecurringExpenses();
    if (processed.length > 0) {
      console.log(`✅ ${processed.length}개의 고정비 항목이 자동으로 추가되었습니다.`);
    }
  } catch (error) {
    console.error('고정비 처리 중 오류:', error);
  }

  const fastify = Fastify({
    logger: true,
  });

  // CORS 설정
  await fastify.register(cors, {
    origin: true, // 모든 origin 허용 (개발용)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 허용할 HTTP 메서드
    allowedHeaders: ['Content-Type', 'Authorization'], // 허용할 헤더
    credentials: true, // 쿠키 및 인증 정보 허용
  });

  // Multipart 설정 (파일 업로드용)
  await fastify.register(multipart);

  // JWT 설정
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'gyegaboo-secret-key-change-in-production',
  });

  // 인증 미들웨어
  fastify.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // 인증 라우트 등록 (인증 없이 접근 가능)
  await fastify.register(authRoutes, { prefix: '/api/auth' });

  // 보호된 라우트 등록
  await fastify.register(aiRoutes, { prefix: '/api/ai' });
  await fastify.register(imageRoutes, { prefix: '/api/image' });
  await fastify.register(expenseRoutes, { prefix: '/api/expenses' });
  await fastify.register(recurringExpenseRoutes, { prefix: '/api/recurring-expenses' });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok' };
  });

  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server is running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
