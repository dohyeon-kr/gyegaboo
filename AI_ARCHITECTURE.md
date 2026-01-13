# AI 위자드 아키텍처 문서

## 개요

AI 위자드는 OpenAI Function Calling을 사용하여 구조화된 tools를 제공합니다. 비즈니스 로직은 Engine으로 분리되고, Manager를 통해 use-case를 관리합니다.

## 아키텍처 구조

```
┌─────────────────────────────────────┐
│         Routes (API Layer)           │
│  - /ai/chat                          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Managers (Use-Case Layer)    │
│  - AIManager                         │
│  - ExpenseManager                    │
│  - RecurringExpenseManager           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Engines (Business Logic)     │
│  - ExpenseEngine                     │
│  - RecurringExpenseEngine            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Database Queries             │
│  - expenseQueries                   │
│  - recurringExpenseQueries          │
└──────────────────────────────────────┘
```

## 레이어 설명

### 1. Engine Layer (비즈니스 로직)

**위치**: `server/src/engines/`

**역할**: 순수한 비즈니스 로직을 담당하는 순수 함수들

#### ExpenseEngine
- `extractAmount()`: 자연어에서 금액 추출
- `extractDate()`: 자연어에서 날짜 추출
- `extractType()`: 자연어에서 유형 추출 (income/expense)
- `extractCategory()`: 자연어에서 카테고리 추출
- `extractDescription()`: 자연어에서 설명 추출
- `createFromText()`: 자연어 텍스트로부터 ExpenseItem 생성
- `createFromData()`: 구조화된 데이터로부터 ExpenseItem 생성
- `calculateStatistics()`: 통계 계산

#### RecurringExpenseEngine
- `extractRepeatType()`: 반복 유형 추출
- `extractRepeatDay()`: 반복일 추출
- `extractStartDate()`: 시작일 추출
- `extractEndDate()`: 만료일 추출
- `extractName()`: 이름 추출
- `createFromText()`: 자연어 텍스트로부터 RecurringExpense 생성
- `createFromData()`: 구조화된 데이터로부터 RecurringExpense 생성

**특징**:
- 순수 함수로 구성 (부작용 없음)
- 테스트 용이
- 재사용 가능
- 비즈니스 로직 변경 시 Engine만 수정하면 됨

### 2. Manager Layer (Use-Case 관리)

**위치**: `server/src/managers/`

**역할**: 실제 데이터베이스 작업을 수행하는 use-case 관리

#### ExpenseManager
- `createFromText()`: 자연어로부터 항목 생성 및 저장
- `createFromData()`: 구조화된 데이터로부터 항목 생성 및 저장
- `createMany()`: 여러 항목 생성 및 저장
- `update()`: 항목 업데이트 (권한 확인 포함)
- `delete()`: 항목 삭제 (권한 확인 포함)
- `getAll()`: 모든 항목 조회
- `getStatistics()`: 통계 조회
- `getByDateRange()`: 기간별 항목 조회

#### RecurringExpenseManager
- `createFromText()`: 자연어로부터 고정비 생성 및 저장
- `createFromData()`: 구조화된 데이터로부터 고정비 생성 및 저장
- `create()`: 고정비 생성 및 저장
- `update()`: 고정비 업데이트 (권한 확인 포함)
- `delete()`: 고정비 삭제 (권한 확인 포함)
- `getAll()`: 모든 고정비 조회

#### AIManager
- `getTools()`: OpenAI Function Calling을 위한 tools 정의
- `chat()`: AI 챗봇 응답 생성 (Function Calling 사용)

**특징**:
- Engine의 비즈니스 로직을 사용
- 데이터베이스 작업 수행
- 권한 확인 포함
- 새로운 use-case 추가 시 Manager에 메서드만 추가하면 됨

### 3. AI Tools 정의

**위치**: `server/src/managers/aiManager.ts`의 `getTools()`

**제공되는 Tools**:

1. **create_expense**
   - 지출 또는 수입 항목 생성
   - 파라미터: date, amount, category, description, type

2. **create_recurring_expense**
   - 고정비 생성
   - 파라미터: name, amount, category, description, type, repeatType, repeatDay, startDate, endDate

3. **get_statistics**
   - 가계부 통계 조회
   - 파라미터: 없음

4. **get_expenses**
   - 가계부 항목 목록 조회
   - 파라미터: startDate, endDate (선택사항)

**특징**:
- 비즈니스 로직이 변경되면 `getTools()`만 수정하면 AI가 자동으로 새로운 기능을 인식
- Manager의 메서드와 1:1 매핑
- OpenAI가 자동으로 적절한 tool을 선택하여 호출

## 동작 흐름

### 1. 사용자 메시지 전송
```
사용자: "오늘 커피 5000원 지출했어"
```

### 2. AI가 Tool 선택
```
OpenAI → create_expense tool 선택
```

### 3. Tool 실행
```
AIManager.chat()
  → OpenAI가 create_expense 호출
  → ExpenseManager.createFromData() 실행
  → ExpenseEngine.createFromData() 사용
  → expenseQueries.createMany() 실행
```

### 4. 결과 반환
```
AI 응답: "커피 지출 5000원이 추가되었습니다."
```

## 확장 방법

### 새로운 기능 추가 예시

1. **Engine에 비즈니스 로직 추가**
```typescript
// server/src/engines/expenseEngine.ts
static extractTags(text: string): string[] {
  // 태그 추출 로직
}
```

2. **Manager에 use-case 추가**
```typescript
// server/src/managers/expenseManager.ts
static async getByTag(tag: string): Promise<ExpenseItem[]> {
  // 태그별 조회 로직
}
```

3. **AI Tools에 추가**
```typescript
// server/src/managers/aiManager.ts
static getTools() {
  return [
    // ... 기존 tools
    {
      type: 'function',
      function: {
        name: 'get_expenses_by_tag',
        description: '태그별로 가계부 항목을 조회합니다.',
        parameters: {
          type: 'object',
          properties: {
            tag: { type: 'string', description: '태그명' },
          },
          required: ['tag'],
        },
      },
    },
  ];
}
```

4. **AIManager.chat()에 처리 로직 추가**
```typescript
case 'get_expenses_by_tag': {
  const expenses = await ExpenseManager.getByTag(args.tag);
  toolResults.push({
    role: 'tool',
    content: JSON.stringify({ expenses }),
    tool_call_id: toolCall.id,
  });
  break;
}
```

## 장점

1. **관심사 분리**: 비즈니스 로직(Engine), use-case(Manager), API(Routes)가 명확히 분리됨
2. **자동 동기화**: 비즈니스 로직이 변경되면 AI Tools도 자동으로 업데이트됨
3. **테스트 용이**: Engine은 순수 함수이므로 단위 테스트가 쉬움
4. **확장성**: 새로운 기능 추가가 간단함
5. **유지보수성**: 각 레이어의 책임이 명확하여 수정이 용이함

## 마이그레이션 가이드

기존 코드에서 새로운 구조로 마이그레이션:

### Before (기존)
```typescript
// 키워드 기반으로 동작 결정
if (userText.includes('지출')) {
  const items = await parseExpenseFromText(text);
  await expenseQueries.createMany(items);
}
```

### After (새로운 구조)
```typescript
// Function Calling으로 자동 처리
const response = await AIManager.chat(messages, userId);
// AI가 자동으로 적절한 tool 선택 및 실행
```

## 참고사항

- 레거시 지원: 기존 `parseExpenseFromText`, `generateAIResponse` 함수는 `@deprecated`로 표시되어 있으나 하위 호환성을 위해 유지됨
- Fallback: OpenAI API를 사용할 수 없는 경우 Engine 기반 fallback 로직 사용
- 권한 관리: Manager 레이어에서 작성자 권한 확인 수행
