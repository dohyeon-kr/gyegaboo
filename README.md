# 가계부 웹앱 (Gyegaboo)

Vite + React + TypeScript로 구축된 가계부 관리 웹 애플리케이션입니다.
본 프로젝트는 인공지능 에이전트를 활용하여 개발됩니다.

## 주요 기능

1. **대화형 AI**: 인공지능 API를 통해 가계부 데이터를 읽거나 쓸 수 있습니다.
2. **이미지 업로드**: 이미지를 통해 가계부 데이터를 자동으로 추출할 수 있습니다.
3. **통계 분석**: 항목 분류를 통해 수입/지출 통계를 시각적으로 확인할 수 있습니다.
4. **수동 입력**: 직접 가계부 항목을 추가할 수 있습니다.

## 기술 스택

### 프론트엔드
- **Builder**: Vite
- **Language**: TypeScript
- **Core Library**: React
- **상태 관리**: Zustand
- **차트**: Recharts
- **날짜 처리**: date-fns

### 백엔드
- **Framework**: Fastify
- **Database**: SQLite (better-sqlite3)
- **Language**: TypeScript
- **AI**: OpenAI API (GPT-4o-mini, GPT-4o Vision)

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 백엔드 서버 실행 (포트 3001)
npm run server:dev

# 프론트엔드 개발 서버 실행 (포트 5173)
npm run dev

# 프론트엔드 빌드
npm run build

# 프론트엔드 빌드 미리보기
npm run preview
```

## 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
# 프론트엔드용 (선택사항, 기본값 사용 가능)
VITE_AI_API_URL=http://localhost:3001/api/ai
VITE_IMAGE_API_URL=http://localhost:3001/api/image
VITE_API_URL=http://localhost:3001/api

# 백엔드용 (필수)
OPENAI_API_KEY=sk-your-openai-api-key-here
PORT=3001
```

### OpenAI API 키 발급 방법

1. [OpenAI Platform](https://platform.openai.com/)에 접속하여 계정을 생성합니다.
2. API Keys 페이지에서 새 API 키를 생성합니다.
3. 생성된 API 키를 `.env` 파일의 `OPENAI_API_KEY`에 설정합니다.

**참고**: OpenAI API 키가 설정되지 않으면 기본 규칙 기반 파서가 사용됩니다.

## 프로젝트 구조

```
├── src/                    # 프론트엔드 소스
│   ├── components/         # React 컴포넌트
│   ├── services/          # API 서비스
│   ├── stores/            # 상태 관리 (Zustand)
│   ├── types/             # TypeScript 타입 정의
│   └── utils/             # 유틸리티 함수
├── server/                 # 백엔드 서버
│   └── src/
│       ├── index.ts       # 서버 진입점
│       ├── db.ts          # 데이터베이스 설정
│       ├── routes/         # API 라우트
│       │   ├── ai.ts      # AI API
│       │   ├── image.ts   # 이미지 처리 API
│       │   └── expenses.ts # 가계부 CRUD API
│       └── utils/         # 유틸리티 함수
└── data/                  # SQLite 데이터베이스 (자동 생성)
```

## API 엔드포인트

### AI API
- `POST /api/ai/read` - AI를 통한 가계부 데이터 읽기
- `POST /api/ai/write` - AI를 통한 가계부 데이터 쓰기
- `POST /api/ai/chat` - AI 대화형 인터페이스

### 이미지 API
- `POST /api/image/upload` - 이미지 업로드 및 OCR 처리
- `POST /api/image/extract` - 이미지 URL에서 데이터 추출

### 가계부 API
- `GET /api/expenses` - 모든 항목 조회
- `GET /api/expenses/:id` - 항목 ID로 조회
- `POST /api/expenses` - 항목 생성
- `POST /api/expenses/batch` - 여러 항목 생성
- `PUT /api/expenses/:id` - 항목 수정
- `DELETE /api/expenses/:id` - 항목 삭제
- `GET /api/expenses/categories` - 카테고리 조회
- `POST /api/expenses/categories` - 카테고리 생성

## 사용 방법

1. **목록 탭**: 가계부 항목을 확인하고 관리합니다.
2. **통계 탭**: 수입/지출 통계와 카테고리별 분석을 확인합니다.
3. **AI 대화 탭**: 자연어로 가계부를 관리합니다. 예: "오늘 커피 5000원 지출했어"
4. **이미지 탭**: 영수증이나 가계부 이미지를 업로드하여 자동으로 데이터를 추출합니다.
5. **수동 입력 탭**: 직접 가계부 항목을 입력합니다.

## 개발 참고사항

- 백엔드 서버는 SQLite 데이터베이스를 사용하여 데이터를 영구 저장합니다.
- 데이터베이스 파일은 `data/gyegaboo.db`에 자동으로 생성됩니다.
- **OpenAI API 연동**: 
  - AI 파서는 OpenAI GPT-4o-mini 모델을 사용합니다.
  - 이미지 OCR은 OpenAI GPT-4o Vision 모델을 사용합니다.
  - API 키가 설정되지 않으면 기본 규칙 기반 파서가 사용됩니다.
- CORS는 개발 환경에서 모든 origin을 허용하도록 설정되어 있습니다. 프로덕션 환경에서는 적절히 제한해야 합니다.
- OpenAI API 사용 시 비용이 발생할 수 있습니다. 사용량을 모니터링하세요.

## OpenAI API 모델 정보

- **AI 파서**: `gpt-4o-mini` - 자연어를 가계부 데이터로 변환
- **이미지 OCR**: `gpt-4o` - 영수증/이미지에서 가계부 데이터 추출
- **챗봇**: `gpt-4o-mini` - 대화형 가계부 관리

각 모델의 가격은 [OpenAI 가격 페이지](https://openai.com/api/pricing/)를 참고하세요.