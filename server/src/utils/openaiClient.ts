import OpenAI from 'openai';

// OpenAI 클라이언트 초기화 (API 키가 있을 때만)
let openai: OpenAI | null = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('✅ OpenAI API 클라이언트가 초기화되었습니다.');
} else {
  console.warn('⚠️  OPENAI_API_KEY가 설정되지 않았습니다. OpenAI API 기능이 작동하지 않습니다.');
  console.warn('   기본 규칙 기반 파서가 사용됩니다.');
}

export { openai };
