import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { userQueries, invitationTokenQueries } from '../db.js';

export async function authRoutes(fastify: FastifyInstance) {
  // 로그인
  fastify.post('/login', async (request: FastifyRequest<{
    Body: { username: string; password: string };
  }>, reply: FastifyReply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      return reply.code(400).send({ error: '사용자명과 비밀번호를 입력해주세요.' });
    }

    const user = userQueries.getByUsername(username);
    if (!user) {
      return reply.code(401).send({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return reply.code(401).send({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = fastify.jwt.sign({
      id: user.id,
      username: user.username,
      isInitialAdmin: user.is_initial_admin === 1,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username,
        profileImageUrl: user.profile_image_url,
        isInitialAdmin: user.is_initial_admin === 1,
      },
    };
  });

  // 현재 사용자 정보 조회
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { id: string; username: string; isInitialAdmin: boolean };
    const dbUser = userQueries.getById(user.id);
    
    if (!dbUser) {
      return reply.code(404).send({ error: '사용자를 찾을 수 없습니다.' });
    }

    return {
      id: dbUser.id,
      username: dbUser.username,
      nickname: dbUser.nickname || dbUser.username,
      profileImageUrl: dbUser.profile_image_url,
      isInitialAdmin: dbUser.is_initial_admin === 1,
    };
  });

  // 새로운 admin 가입 (초기 admin만 가능)
  fastify.post('/register-admin', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{
    Body: { username: string; password: string };
  }>, reply: FastifyReply) => {
    const currentUser = request.user as { id: string; username: string; isInitialAdmin: boolean };
    
    // 초기 admin만 새로운 admin을 등록할 수 있음
    if (!currentUser.isInitialAdmin) {
      return reply.code(403).send({ error: '초기 관리자만 새로운 관리자를 등록할 수 있습니다.' });
    }

    const { username, password } = request.body;

    if (!username || !password) {
      return reply.code(400).send({ error: '사용자명과 비밀번호를 입력해주세요.' });
    }

    if (password.length < 8) {
      return reply.code(400).send({ error: '비밀번호는 최소 8자 이상이어야 합니다.' });
    }

    // 이미 존재하는 사용자명인지 확인
    const existingUser = userQueries.getByUsername(username);
    if (existingUser) {
      return reply.code(409).send({ error: '이미 사용 중인 사용자명입니다.' });
    }

    // 새 admin 생성
    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = userQueries.create(username, passwordHash);

    // 초기 admin 삭제
    userQueries.deleteInitialAdmin();

    // 새 admin으로 로그인 토큰 발급
    const token = fastify.jwt.sign({
      id: newUser.id,
      username: newUser.username,
      isInitialAdmin: false,
    });

    return {
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        nickname: newUser.nickname || newUser.username,
        profileImageUrl: newUser.profile_image_url,
        isInitialAdmin: false,
      },
      message: '새로운 관리자가 등록되었고, 초기 관리자 계정이 삭제되었습니다.',
    };
  });

  // 로그아웃 (클라이언트에서 토큰 삭제)
  fastify.post('/logout', {
    preHandler: [fastify.authenticate],
  }, async () => {
    return { message: '로그아웃되었습니다.' };
  });

  // 초대 토큰 생성 (인증된 사용자만 가능)
  fastify.post('/invite', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {},
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const currentUser = request.user as { id: string; username: string; isInitialAdmin: boolean };
      
      // 초기 admin이 아닌 경우에만 초대 가능 (초기 admin은 관리자 등록만 가능)
      if (currentUser.isInitialAdmin) {
        return reply.code(403).send({ error: '초기 관리자는 초대 링크를 생성할 수 없습니다. 먼저 관리자를 등록해주세요.' });
      }

      // 초대 토큰 생성 (32바이트 랜덤 문자열)
      const token = randomBytes(32).toString('hex');
      
      // 만료 시간: 현재 시간 + 10분
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      
      // 데이터베이스에 저장
      invitationTokenQueries.create(token, currentUser.id, expiresAt);
      
      // 초대 링크 생성
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const inviteLink = `${baseUrl}/register?token=${token}`;
      
      return {
        token,
        inviteLink,
        expiresAt,
        message: '초대 링크가 생성되었습니다. 10분 내에 사용 가능합니다.',
      };
    } catch (error: any) {
      fastify.log.error('초대 토큰 생성 오류:', error);
      return reply.code(500).send({ 
        error: error.message || '초대 링크 생성에 실패했습니다.',
      });
    }
  });

  // 초대 토큰 검증
  fastify.get('/invite/:token', async (request: FastifyRequest<{
    Params: { token: string };
  }>, reply: FastifyReply) => {
    const { token } = request.params;
    
    const isValid = invitationTokenQueries.isValid(token);
    
    if (!isValid) {
      return reply.code(400).send({ 
        error: '유효하지 않거나 만료된 초대 링크입니다.',
        valid: false,
      });
    }
    
    return {
      valid: true,
      message: '유효한 초대 링크입니다.',
    };
  });

  // 초대 토큰으로 회원가입
  fastify.post('/register', async (request: FastifyRequest<{
    Body: { token: string; username: string; password: string };
  }>, reply: FastifyReply) => {
    const { token, username, password } = request.body;
    
    if (!token || !username || !password) {
      return reply.code(400).send({ error: '초대 토큰, 사용자명, 비밀번호를 모두 입력해주세요.' });
    }
    
    // 토큰 유효성 검증
    if (!invitationTokenQueries.isValid(token)) {
      return reply.code(400).send({ error: '유효하지 않거나 만료된 초대 링크입니다.' });
    }
    
    if (password.length < 8) {
      return reply.code(400).send({ error: '비밀번호는 최소 8자 이상이어야 합니다.' });
    }
    
    // 이미 존재하는 사용자명인지 확인
    const existingUser = userQueries.getByUsername(username);
    if (existingUser) {
      return reply.code(409).send({ error: '이미 사용 중인 사용자명입니다.' });
    }
    
    // 새 사용자 생성
    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = userQueries.create(username, passwordHash);
    
    // 토큰을 사용됨으로 표시 (즉시 만료)
    invitationTokenQueries.markAsUsed(token);
    
    // 로그인 토큰 발급
    const authToken = fastify.jwt.sign({
      id: newUser.id,
      username: newUser.username,
      isInitialAdmin: false,
    });
    
    return {
      token: authToken,
      user: {
        id: newUser.id,
        username: newUser.username,
        nickname: newUser.nickname || newUser.username,
        profileImageUrl: newUser.profile_image_url,
        isInitialAdmin: false,
      },
      message: '회원가입이 완료되었습니다.',
    };
  });

  // 프로필 업데이트
  fastify.put('/profile', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{
    Body: { nickname?: string };
  }>, reply: FastifyReply) => {
    const currentUser = request.user as { id: string; username: string; isInitialAdmin: boolean };
    const { nickname } = request.body;

    if (nickname !== undefined && nickname.trim().length === 0) {
      return reply.code(400).send({ error: '닉네임은 비어있을 수 없습니다.' });
    }

    const updated = userQueries.update(currentUser.id, { nickname: nickname?.trim() || null });
    
    if (!updated) {
      return reply.code(404).send({ error: '사용자를 찾을 수 없습니다.' });
    }

    return {
      id: updated.id,
      username: updated.username,
      nickname: updated.nickname || updated.username,
      profileImageUrl: updated.profile_image_url,
      isInitialAdmin: updated.is_initial_admin === 1,
    };
  });

  // 프로필 이미지 업로드
  fastify.post('/profile/image', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUser = request.user as { id: string; username: string; isInitialAdmin: boolean };
    const data = await request.file();
    
    if (!data) {
      return reply.code(400).send({ error: '이미지 파일을 업로드해주세요.' });
    }

    try {
      const buffer = await data.toBuffer();
      const mimeType = data.mimetype || 'image/jpeg';
      
      // 파일로 저장
      const { saveProfileImage } = await import('../utils/fileStorage.js');
      const imagePath = await saveProfileImage(buffer, currentUser.id, mimeType);
      
      // 데이터베이스에 경로 저장
      const updated = userQueries.update(currentUser.id, { profile_image_url: imagePath });
      
      if (!updated) {
        return reply.code(404).send({ error: '사용자를 찾을 수 없습니다.' });
      }

      return {
        id: updated.id,
        username: updated.username,
        nickname: updated.nickname || updated.username,
        profileImageUrl: updated.profile_image_url,
        isInitialAdmin: updated.is_initial_admin === 1,
      };
    } catch (error: any) {
      fastify.log.error('프로필 이미지 업로드 오류:', error);
      return reply.code(500).send({ error: '이미지 업로드에 실패했습니다.' });
    }
  });
}
