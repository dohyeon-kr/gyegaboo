import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷합니다
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환합니다
 */
export function getToday(): string {
  return formatDate(new Date());
}

/**
 * 이번 달의 시작일과 종료일을 반환합니다
 */
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  return {
    start: formatDate(startOfMonth(now)),
    end: formatDate(endOfMonth(now)),
  };
}

/**
 * N개월 전의 날짜 범위를 반환합니다
 */
export function getMonthRange(monthsAgo: number): { start: string; end: string } {
  const date = subMonths(new Date(), monthsAgo);
  return {
    start: formatDate(startOfMonth(date)),
    end: formatDate(endOfMonth(date)),
  };
}
