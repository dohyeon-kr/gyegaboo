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

export function Statistics() {
  const { items } = useExpenseStore();
  const stats = useMemo(() => calculateStatistics(items), [items]);

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#6BCB77', '#4D96FF'];

  return (
    <div className="statistics">
      <h2>통계</h2>
      
      <div className="stats-summary">
        <div className="stat-card income">
          <h3>총 수입</h3>
          <p className="amount">{stats.totalIncome.toLocaleString()}원</p>
        </div>
        <div className="stat-card expense">
          <h3>총 지출</h3>
          <p className="amount">{stats.totalExpense.toLocaleString()}원</p>
        </div>
        <div className="stat-card balance">
          <h3>잔액</h3>
          <p className={`amount ${stats.balance >= 0 ? 'positive' : 'negative'}`}>
            {stats.balance.toLocaleString()}원
          </p>
        </div>
      </div>

      {stats.categoryBreakdown.length > 0 && (
        <div className="chart-container">
          <h3>카테고리별 지출</h3>
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
        </div>
      )}

      {stats.monthlyData.length > 0 && (
        <div className="chart-container">
          <h3>월별 수입/지출</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number | undefined) => 
                value !== undefined ? `${value.toLocaleString()}원` : ''
              } />
              <Legend />
              <Bar dataKey="income" fill="#6BCB77" name="수입" />
              <Bar dataKey="expense" fill="#FF6B6B" name="지출" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {items.length === 0 && (
        <div className="empty-state">
          <p>가계부 데이터가 없습니다. 항목을 추가해보세요!</p>
        </div>
      )}
    </div>
  );
}
