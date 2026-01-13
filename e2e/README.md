# E2E 테스트 가이드

## 개요

Playwright를 사용한 End-to-End 테스트입니다. 주요 사용자 플로우를 자동화하여 검증합니다.

## 설치

```bash
npm install
npx playwright install
```

## 테스트 실행

### 모든 테스트 실행
```bash
npm run test:e2e
```

### UI 모드로 실행 (디버깅 용이)
```bash
npm run test:e2e:ui
```

### 헤드 모드로 실행 (브라우저 표시)
```bash
npm run test:e2e:headed
```

### 디버그 모드로 실행
```bash
npm run test:e2e:debug
```

### 특정 테스트 파일만 실행
```bash
npx playwright test e2e/auth.spec.ts
```

## 테스트 구조

```
e2e/
├── auth.spec.ts              # 인증 플로우 테스트
├── expense.spec.ts           # 가계부 항목 관리 테스트
├── ai-wizard.spec.ts         # AI 위자드 테스트
├── statistics.spec.ts        # 통계 페이지 테스트
├── recurring-expense.spec.ts # 고정비 관리 테스트
├── profile.spec.ts           # 프로필 관리 테스트
├── setup.ts                  # 테스트 환경 설정
└── helpers/                  # 테스트 헬퍼 함수
    ├── auth.ts               # 인증 헬퍼
    └── expense.ts            # 가계부 헬퍼
```

## 테스트 시나리오

### 1. 인증 플로우 (`auth.spec.ts`)
- 로그인 페이지 표시
- 잘못된 자격증명으로 로그인 실패
- 초기 관리자 등록 플로우
- 정상 로그인 후 메인 페이지 이동
- 로그아웃 기능

### 2. 가계부 항목 관리 (`expense.spec.ts`)
- 수동 입력으로 지출 항목 추가
- 수입 항목 추가
- 항목 수정
- 항목 삭제
- 항목 필터링 (지출/수입)
- 항목 검색

### 3. AI 위자드 (`ai-wizard.spec.ts`)
- AI 위자드 버튼 표시
- AI 위자드 열기/닫기
- AI로 지출 항목 추가
- AI로 고정비 추가
- AI로 통계 조회
- AI 위자드 최소화/최대화

### 4. 통계 페이지 (`statistics.spec.ts`)
- 통계 페이지 접근
- 통계 데이터 표시
- 카테고리별 통계 표시
- 차트 표시

### 5. 고정비 관리 (`recurring-expense.spec.ts`)
- 고정비 페이지 접근
- 고정비 추가
- 고정비 수정
- 고정비 삭제

### 6. 프로필 관리 (`profile.spec.ts`)
- 프로필 페이지 접근
- 닉네임 변경
- 프로필 이미지 업로드

## 테스트 환경

- **프론트엔드**: `http://localhost:4173` (Vite preview)
- **백엔드**: `http://localhost:3001`
- **데이터베이스**: `e2e-test.db` (테스트 전용)

## 테스트 데이터

각 테스트는 독립적으로 실행되며, 테스트 전에 데이터베이스가 초기화됩니다.

기본 테스트 사용자:
- 사용자명: `testuser`
- 비밀번호: `testpass123`

## 주의사항

1. 테스트 실행 전에 프론트엔드와 백엔드가 실행 중이어야 합니다.
2. `playwright.config.ts`의 `webServer` 설정으로 자동으로 서버를 시작할 수 있습니다.
3. 테스트용 데이터베이스는 `e2e-test.db`로 분리되어 있습니다.
4. OpenAI API 키가 없어도 테스트는 실행되지만, AI 관련 테스트는 제한적으로 동작할 수 있습니다.

## CI/CD 통합

GitHub Actions에서 테스트를 실행하려면:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
```
