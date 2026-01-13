# 기여 가이드라인 (Contributing Guide)

Gyegaboo 프로젝트에 기여해주셔서 감사합니다! 이 문서는 프로젝트에 기여하는 방법을 안내합니다.

## 목차

- [코드 스타일](#코드-스타일)
- [개발 환경 설정](#개발-환경-설정)
- [프로젝트 구조](#프로젝트-구조)
- [주요 기능 및 아키텍처](#주요-기능-및-아키텍처)
- [커밋 컨벤션](#커밋-컨벤션)
- [Pull Request 프로세스](#pull-request-프로세스)
- [테스트](#테스트)
- [문서화](#문서화)

## 코드 스타일

### TypeScript

- TypeScript를 사용하며, 타입을 명시적으로 정의합니다.
- `any` 타입 사용을 최소화하고, 필요한 경우 `unknown`을 사용합니다.
- 인터페이스와 타입은 `src/types/` 디렉토리에 정의합니다.

### React 컴포넌트

- 함수형 컴포넌트를 사용합니다.
- 컴포넌트는 `src/components/` 디렉토리에 위치합니다.
- UI 컴포넌트는 `src/components/ui/` 디렉토리에 위치합니다.
- 컴포넌트 파일명은 PascalCase를 사용합니다 (예: `ExpenseList.tsx`).

### 스타일링

- Tailwind CSS를 사용합니다.
- 모바일 친화적인 반응형 디자인을 적용합니다.
- 브레이크포인트:
  - 모바일: 기본 스타일 (< 640px)
  - 태블릿: `sm:` (≥ 640px)
  - 데스크톱: `md:` (≥ 768px), `lg:` (≥ 1024px)

### 백엔드

- Fastify 프레임워크를 사용합니다.
- 라우트는 `server/src/routes/` 디렉토리에 위치합니다.
- 데이터베이스 쿼리는 `server/src/db.ts`에 정의합니다.
- SQLite 데이터베이스를 사용합니다.

## 개발 환경 설정

### 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Git

### 초기 설정

```bash
# 저장소 클론
git clone https://github.com/dohyeon-kr/gyegaboo.git
cd gyegaboo

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 환경 변수를 설정하세요
```

### 환경 변수

`.env` 파일에 다음 변수를 설정해야 합니다:

```env
# 백엔드
OPENAI_API_KEY=your-openai-api-key
PORT=3001
JWT_SECRET=your-jwt-secret-key
FRONTEND_URL=http://localhost:5173

# 프론트엔드 (선택사항)
VITE_API_URL=http://localhost:3001/api
VITE_AI_API_URL=http://localhost:3001/api/ai
VITE_IMAGE_API_URL=http://localhost:3001/api/image
```

### 개발 서버 실행

```bash
# 백엔드 개발 서버 (포트 3001)
npm run server:dev

# 프론트엔드 개발 서버 (포트 5173)
npm run dev
```

## 프로젝트 구조

```
gyegaboo/
├── src/                          # 프론트엔드 소스
│   ├── components/              # React 컴포넌트
│   │   ├── ui/                  # 재사용 가능한 UI 컴포넌트
│   │   ├── ExpenseList.tsx     # 가계부 목록
│   │   ├── Statistics.tsx      # 통계 차트
│   │   ├── AIChat.tsx          # AI 대화 인터페이스
│   │   ├── ImageUpload.tsx     # 이미지 업로드
│   │   ├── ManualEntry.tsx     # 수동 입력
│   │   ├── RecurringExpenses.tsx # 고정비 관리
│   │   ├── Login.tsx           # 로그인
│   │   ├── Register.tsx        # 회원가입
│   │   ├── InviteMember.tsx    # 구성원 초대
│   │   └── Profile.tsx         # 프로필 관리
│   ├── services/                # API 서비스 레이어
│   │   ├── authService.ts      # 인증 서비스
│   │   ├── expenseService.ts   # 가계부 서비스
│   │   ├── aiService.ts        # AI 서비스
│   │   └── imageService.ts     # 이미지 서비스
│   ├── stores/                  # Zustand 상태 관리
│   │   ├── authStore.ts        # 인증 상태
│   │   └── expenseStore.ts     # 가계부 상태
│   ├── types/                   # TypeScript 타입 정의
│   │   └── index.ts
│   └── utils/                   # 유틸리티 함수
│       ├── apiClient.ts         # API 클라이언트
│       └── dateUtils.ts         # 날짜 유틸리티
├── server/                       # 백엔드 서버
│   └── src/
│       ├── index.ts            # 서버 진입점
│       ├── db.ts               # 데이터베이스 설정 및 쿼리
│       ├── routes/             # API 라우트
│       │   ├── auth.ts         # 인증 라우트
│       │   ├── expenses.ts     # 가계부 라우트
│       │   ├── ai.ts           # AI 라우트
│       │   ├── image.ts        # 이미지 라우트
│       │   └── recurringExpenses.ts # 고정비 라우트
│       └── utils/              # 유틸리티 함수
│           ├── aiParser.ts     # AI 파서
│           ├── imageParser.ts  # 이미지 파서
│           └── recurringExpenseProcessor.ts # 고정비 처리
├── data/                        # SQLite 데이터베이스 (자동 생성)
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 배포 워크플로우
└── package.json
```

## 주요 기능 및 아키텍처

### 인증 시스템

- **초기 관리자**: 서버 최초 실행 시 자동 생성되는 임시 관리자 계정
- **JWT 기반 인증**: `@fastify/jwt`를 사용한 토큰 기반 인증
- **초대 시스템**: 10분 만료 시간을 가진 일회용 초대 링크
- **프로필 관리**: 닉네임 및 프로필 이미지 설정

### 데이터베이스 스키마

주요 테이블:
- `users`: 사용자 정보 (username, nickname, profile_image_url)
- `expenses`: 가계부 항목 (수입/지출)
- `recurring_expenses`: 고정비 항목
- `categories`: 카테고리
- `invitation_tokens`: 초대 토큰

### 작성자 정보

- 모든 가계부 항목과 고정비 항목에 작성자 정보가 포함됩니다.
- 작성자는 닉네임(또는 사용자명)과 프로필 이미지로 표시됩니다.
- 데이터베이스 쿼리에서 `COALESCE(u.nickname, u.username)`를 사용하여 닉네임이 없으면 사용자명을 표시합니다.

### API 엔드포인트

#### 인증 API (`/api/auth`)
- `POST /login` - 로그인
- `GET /me` - 현재 사용자 정보 조회
- `POST /register-admin` - 초기 관리자가 새 관리자 등록
- `POST /register` - 초대 토큰으로 회원가입
- `POST /invite` - 초대 링크 생성
- `GET /invite/:token` - 초대 토큰 검증
- `PUT /profile` - 프로필 업데이트
- `POST /profile/image` - 프로필 이미지 업로드

#### 가계부 API (`/api/expenses`)
- `GET /` - 모든 항목 조회
- `GET /:id` - 항목 ID로 조회
- `POST /` - 항목 생성
- `POST /batch` - 여러 항목 생성
- `PUT /:id` - 항목 수정
- `DELETE /:id` - 항목 삭제
- `GET /categories` - 카테고리 조회
- `POST /categories` - 카테고리 생성

#### AI API (`/api/ai`)
- `POST /read` - AI를 통한 가계부 데이터 읽기
- `POST /write` - AI를 통한 가계부 데이터 쓰기
- `POST /chat` - AI 대화형 인터페이스

#### 이미지 API (`/api/image`)
- `POST /upload` - 이미지 업로드 및 OCR 처리
- `POST /extract` - 이미지 URL에서 데이터 추출

#### 고정비 API (`/api/recurring-expenses`)
- `GET /` - 모든 고정비 조회
- `GET /active` - 활성 고정비만 조회
- `GET /:id` - 고정비 ID로 조회
- `POST /` - 고정비 생성
- `PUT /:id` - 고정비 수정
- `DELETE /:id` - 고정비 삭제
- `POST /process` - 고정비 처리 (수동 실행)
- `POST /:id/process` - 특정 고정비 처리

### 상태 관리

- **Zustand**를 사용한 전역 상태 관리
- `authStore`: 인증 상태 및 사용자 정보
- `expenseStore`: 가계부 항목 및 카테고리

### 모바일 반응형 디자인

- 모든 컴포넌트는 모바일 친화적으로 설계되었습니다.
- Tailwind CSS의 반응형 유틸리티 클래스를 사용합니다.
- 주요 패턴:
  - 그리드 레이아웃: `grid-cols-1 sm:grid-cols-2`
  - 플렉스 레이아웃: `flex-col sm:flex-row`
  - 패딩: `p-2 sm:p-4`
  - 텍스트 크기: `text-xs sm:text-sm`

## 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/) 스타일을 따릅니다.

### 커밋 메시지 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 타입 (Type)

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드 추가/수정
- `chore`: 빌드 업무 수정, 패키지 매니저 설정 등

### 예시

```
feat: Add profile image upload functionality

- Add profile image upload API endpoint
- Update Profile component to support image upload
- Display profile images in author badges

Closes #123
```

## Pull Request 프로세스

1. **브랜치 생성**
   ```bash
   git checkout -b feature/your-feature-name
   # 또는
   git checkout -b fix/your-bug-fix
   ```

2. **변경사항 커밋**
   - 의미 있는 커밋 메시지를 작성합니다.
   - 관련된 변경사항은 하나의 커밋으로 묶습니다.

3. **Push 및 PR 생성**
   ```bash
   git push origin feature/your-feature-name
   ```
   - GitHub에서 Pull Request를 생성합니다.
   - PR 제목은 커밋 메시지와 동일한 형식을 따릅니다.
   - 변경사항을 자세히 설명합니다.

4. **코드 리뷰**
   - 리뷰어의 피드백을 반영합니다.
   - 모든 체크리스트를 완료합니다.

5. **병합**
   - 리뷰 승인 후 메인 브랜치에 병합됩니다.

### PR 체크리스트

- [ ] 코드가 프로젝트의 스타일 가이드를 따릅니다
- [ ] 관련 문서를 업데이트했습니다
- [ ] 새로운 기능에 대한 설명을 추가했습니다
- [ ] 테스트를 추가하거나 업데이트했습니다 (가능한 경우)
- [ ] 변경사항이 기존 기능을 깨뜨리지 않습니다
- [ ] 모바일 반응형 디자인을 고려했습니다

## 테스트

현재 프로젝트에는 공식적인 테스트 스위트가 없지만, 다음을 권장합니다:

- 새로운 기능을 추가할 때는 수동 테스트를 수행합니다.
- 주요 기능 변경 시 다양한 시나리오를 테스트합니다.
- 모바일과 데스크톱 환경 모두에서 테스트합니다.

## 문서화

### 코드 주석

- 복잡한 로직에는 주석을 추가합니다.
- 함수와 클래스에는 JSDoc 스타일 주석을 추가합니다.

### README 업데이트

- 새로운 기능을 추가할 때 README.md를 업데이트합니다.
- API 엔드포인트 변경 시 문서를 업데이트합니다.

## 질문 및 지원

문제가 있거나 질문이 있으시면:
- GitHub Issues를 생성해주세요
- Pull Request에 질문을 포함해주세요

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

감사합니다! Gyegaboo 프로젝트에 기여해주셔서 감사합니다. 🎉
