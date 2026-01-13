import type { ExpenseItem, Statistics, CategoryStatistics, MonthlyData } from '../types';
import { format, parseISO } from 'date-fns';

/**
 * 가계부 항목들로부터 통계를 계산합니다
 */
export function calculateStatistics(items: ExpenseItem[]): Statistics {
  const totalIncome = items
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpense = items
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  const balance = totalIncome - totalExpense;

  // 카테고리별 통계
  const categoryMap = new Map<string, number>();
  items
    .filter((item) => item.type === 'expense')
    .forEach((item) => {
      const current = categoryMap.get(item.category) || 0;
      categoryMap.set(item.category, current + item.amount);
    });

  const categoryBreakdown: CategoryStatistics[] = Array.from(
    categoryMap.entries()
  ).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
  }));

  // 월별 통계
  const monthlyMap = new Map<string, { income: number; expense: number }>();
  items.forEach((item) => {
    const month = format(parseISO(item.date), 'yyyy-MM');
    const current = monthlyMap.get(month) || { income: 0, expense: 0 };
    if (item.type === 'income') {
      current.income += item.amount;
    } else {
      current.expense += item.amount;
    }
    monthlyMap.set(month, current);
  });

  const monthlyData: MonthlyData[] = Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalIncome,
    totalExpense,
    balance,
    categoryBreakdown,
    monthlyData,
  };
}

/**
 * 날짜 범위로 필터링된 항목들의 통계를 계산합니다
 */
export function calculateStatisticsByDateRange(
  items: ExpenseItem[],
  startDate: string,
  endDate: string
): Statistics {
  const filtered = items.filter(
    (item) => item.date >= startDate && item.date <= endDate
  );
  return calculateStatistics(filtered);
}
