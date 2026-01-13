import type { RecurringExpense, ExpenseItem } from '../../../src/types/index.js';
import { expenseQueries, recurringExpenseQueries } from '../db.js';
import { format, parseISO, addDays, addWeeks, addMonths, addYears, isBefore, isAfter } from 'date-fns';
import { generateUniqueId } from './idGenerator.js';

/**
 * 고정비를 처리하여 가계부 항목을 생성합니다
 */
export function processRecurringExpenses(targetDate?: string): ExpenseItem[] {
  const today = targetDate || format(new Date(), 'yyyy-MM-dd');
  const todayDate = parseISO(today);
  const createdItems: ExpenseItem[] = [];

  const activeRecurring = recurringExpenseQueries.getActive();

  for (const recurring of activeRecurring) {
    // 만료일 확인
    if (recurring.end_date && isAfter(todayDate, parseISO(recurring.end_date))) {
      continue;
    }

    // 시작일 확인
    if (isBefore(todayDate, parseISO(recurring.start_date))) {
      continue;
    }

    // 마지막 처리일 확인
    const lastProcessed = recurring.last_processed_date
      ? parseISO(recurring.last_processed_date)
      : null;

    // 오늘 처리해야 하는지 확인
    if (shouldProcessToday(recurring, todayDate, lastProcessed)) {
      const item: ExpenseItem = {
        id: generateUniqueId(),
        date: today,
        amount: recurring.amount,
        category: recurring.category,
        description: recurring.description,
        type: recurring.type,
      };

      expenseQueries.create(item);
      createdItems.push(item);

      // 마지막 처리일 업데이트
      recurringExpenseQueries.update(recurring.id, {
        lastProcessedDate: today,
      });
    }
  }

  return createdItems;
}

/**
 * 오늘 처리해야 하는지 확인
 */
function shouldProcessToday(
  recurring: any,
  today: Date,
  lastProcessed: Date | null
): boolean {
  const startDate = parseISO(recurring.start_date);

  switch (recurring.repeat_type) {
    case 'daily':
      // 매일: 마지막 처리일이 없거나 어제 이전이면 처리
      if (!lastProcessed) {
        return format(today, 'yyyy-MM-dd') >= format(startDate, 'yyyy-MM-dd');
      }
      return format(today, 'yyyy-MM-dd') > format(lastProcessed, 'yyyy-MM-dd');

    case 'weekly':
      // 매주: repeat_day가 요일 (0=일요일, 6=토요일)
      const dayOfWeek = today.getDay();
      if (recurring.repeat_day !== null && recurring.repeat_day !== dayOfWeek) {
        return false;
      }
      if (!lastProcessed) {
        return format(today, 'yyyy-MM-dd') >= format(startDate, 'yyyy-MM-dd');
      }
      // 마지막 처리일로부터 일주일 이상 지났는지 확인
      const weeksSinceLastProcess = Math.floor(
        (today.getTime() - lastProcessed.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      return weeksSinceLastProcess >= 1;

    case 'monthly':
      // 매월: repeat_day가 월의 일자 (1-31)
      const dayOfMonth = today.getDate();
      if (recurring.repeat_day !== null && recurring.repeat_day !== dayOfMonth) {
        return false;
      }
      if (!lastProcessed) {
        return format(today, 'yyyy-MM-dd') >= format(startDate, 'yyyy-MM-dd');
      }
      // 마지막 처리일로부터 한 달 이상 지났는지 확인
      const lastProcessedMonth = lastProcessed.getMonth();
      const lastProcessedYear = lastProcessed.getFullYear();
      const todayMonth = today.getMonth();
      const todayYear = today.getFullYear();
      return (
        todayYear > lastProcessedYear ||
        (todayYear === lastProcessedYear && todayMonth > lastProcessedMonth)
      );

    case 'yearly':
      // 매년: 같은 월일자
      if (!lastProcessed) {
        return format(today, 'yyyy-MM-dd') >= format(startDate, 'yyyy-MM-dd');
      }
      // 마지막 처리일로부터 일년 이상 지났는지 확인
      const lastProcessedYear2 = lastProcessed.getFullYear();
      const todayYear2 = today.getFullYear();
      return todayYear2 > lastProcessedYear2;

    default:
      return false;
  }
}

/**
 * 특정 고정비를 수동으로 처리
 */
export function processRecurringExpenseById(id: string, targetDate?: string): ExpenseItem | null {
  const today = targetDate || format(new Date(), 'yyyy-MM-dd');
  const recurring = recurringExpenseQueries.getById(id);

  if (!recurring || !recurring.is_active) {
    return null;
  }

  const item: ExpenseItem = {
    id: generateUniqueId(),
    date: today,
    amount: recurring.amount,
    category: recurring.category,
    description: recurring.description,
    type: recurring.type,
  };

  expenseQueries.create(item);
  recurringExpenseQueries.update(id, {
    lastProcessedDate: today,
  });

  return item;
}
