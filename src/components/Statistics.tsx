import { useMemo } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import { calculateStatistics } from '../utils/statistics';
import type { CategoryStatistics } from '../types';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export function Statistics() {
  const { items } = useExpenseStore();
  const stats = useMemo(() => calculateStatistics(items), [items]);

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#6BCB77', '#4D96FF'];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수입</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.totalIncome.toLocaleString()}원
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 지출</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.totalExpense.toLocaleString()}원
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">잔액</CardTitle>
            <Wallet className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.balance.toLocaleString()}원
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 지출</CardTitle>
            <CardDescription>지출 항목을 카테고리별로 분석합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.categoryBreakdown.map((item, index) => ({
                    ...item,
                    fill: COLORS[index % COLORS.length],
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const data = props as CategoryStatistics & { percent?: number };
                    return `${data.category} ${data.percentage.toFixed(1)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {stats.categoryBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number | undefined) => 
                  value !== undefined ? `${value.toLocaleString()}원` : ''
                } />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {stats.monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>월별 수입/지출</CardTitle>
            <CardDescription>월별 수입과 지출 추이를 확인합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  formatter={(value: number | undefined) => 
                    value !== undefined ? `${value.toLocaleString()}원` : ''
                  }
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="income" fill="#6BCB77" name="수입" />
                <Bar dataKey="expense" fill="#FF6B6B" name="지출" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {items.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">가계부 데이터가 없습니다. 항목을 추가해보세요!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
