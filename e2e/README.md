# E2E 테스트 가이드

## 개요

이 프로젝트는 Playwright를 사용하여 End-to-End 테스트를 수행합니다.

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

### UI 모드로 실행 (권장)
```bash
npm run test:e2e:ui
```

### 헤드 모드로 실행 (브라우저 창 표시)
```bash
npm run test:e2e:headed
```

### 디버그 모드
```bash
npm run test:e2e:debug
```

## 테스트 구조

```
e2e/
├── setup.ts              # 테스트 환경 설정
├── auth.spec.ts          # 인증 플로우 테스트
├── expenses.spec.ts      # 지출/수입 관리 테스트
├── ai-wizard.spec.ts     # AI 위자드 테스트
├── statistics.spec.ts    # 통계 조회 테스트
├── recurring-expenses.spec.ts  # 고정비 관리 테스트
└── profile.spec.ts       # 프로필 관리 테스트
```

## 테스트 시나리오

### 1. 인증 플로우 (`auth.spec.ts`)
- 로그인 페이지 표시
- 잘못된 자격증명으로 로그인 실패
- 초기 관리자 등록 플로우
- 정상 로그인 후 메인 페이지 이동
- 로그아웃 기능

### 2. 지출/수입 관리 (`expenses.spec.ts`)
- 수동 입력으로 지출 항목 추가
- 수동 입력으로 수입 항목 추가
- 항목 수정
- 항목 삭제
- 작성자 필터링
- 검색 기능

### 3. AI 위자드 (`ai-wizard.spec.ts`)
- AI 위자드 버튼 표시
- AI 위자드 열기 및 닫기
- AI로 지출 항목 추가
- AI로 고정비 추가
- AI로 통계 조회

### 4. 통계 조회 (`statistics.spec.ts`)
- 통계 페이지 접근
- 통계 데이터 표시
- 기간별 통계 조회

### 5. 고정비 관리 (`recurring-expenses.spec.ts`)
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

## 주의사항

1. 테스트 실행 전에 서버와 프론트엔드가 실행 중이어야 합니다 (자동 시작됨)
2. 테스트용 데이터베이스는 각 테스트 실행 전에 초기화됩니다
3. 테스트용 사용자 계정이 필요합니다 (setup.ts에서 생성)

## CI/CD 통합

GitHub Actions에서 자동으로 실행되도록 설정할 수 있습니다:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
```

## 문제 해결

### 테스트가 실패하는 경우

1. 서버가 실행 중인지 확인
2. 데이터베이스 파일 권한 확인
3. 브라우저가 설치되어 있는지 확인: `npx playwright install`

### 타임아웃 오류

`playwright.config.ts`에서 타임아웃을 조정할 수 있습니다:

```typescript
use: {
  actionTimeout: 10000, // 액션 타임아웃
  navigationTimeout: 30000, // 네비게이션 타임아웃
}
```
