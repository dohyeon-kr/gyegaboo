// 가계부 항목 타입
export interface ExpenseItem {
  id: string;
  date: string; // ISO date string
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense'; // 수입 또는 지출
  imageUrl?: string; // 이미지가 있는 경우
  createdBy?: string; // 작성자 ID
  createdByUsername?: string; // 작성자 사용자명
}

// 항목 분류 카테고리
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

// 통계 데이터
export interface Statistics {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: CategoryStatistics[];
  monthlyData: MonthlyData[];
}

export interface CategoryStatistics {
  category: string;
  amount: number;
  percentage: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

// AI API 응답 타입
export interface AIResponse {
  success: boolean;
  data?: ExpenseItem[];
  recurringExpense?: RecurringExpense;
  message?: string;
}

// 이미지 업로드 응답 타입
export interface ImageUploadResponse {
  success: boolean;
  items?: ExpenseItem[];
  message?: string;
}

// 고정비 타입
export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense';
  repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly'; // 반복 유형
  repeatDay?: number; // 반복일 (월의 일자, 주의 요일 등)
  startDate: string; // 시작일
  endDate?: string; // 만료일 (선택사항)
  lastProcessedDate?: string; // 마지막 처리일
  isActive: boolean; // 활성화 여부
  createdBy?: string; // 작성자 ID
  createdByUsername?: string; // 작성자 사용자명
}
