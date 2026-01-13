import { useMemo, useState } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import type { ExpenseItem } from '../types';
import { format, parseISO } from 'date-fns';

export function ExpenseList() {
  const { items, removeItem } = useExpenseStore();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  const filteredAndSortedItems = useMemo(() => {
    let filtered: ExpenseItem[] = items;

    if (filter !== 'all') {
      filtered = items.filter((item) => item.type === filter);
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return b.date.localeCompare(a.date);
      } else {
        return b.amount - a.amount;
      }
    });
  }, [items, filter, sortBy]);

  return (
    <div className="expense-list">
      <div className="list-header">
        <h2>가계부 목록</h2>
        <div className="filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="all">전체</option>
            <option value="income">수입</option>
            <option value="expense">지출</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="date">날짜순</option>
            <option value="amount">금액순</option>
          </select>
        </div>
      </div>

      <div className="items-container">
        {filteredAndSortedItems.length === 0 ? (
          <div className="empty-state">
            <p>항목이 없습니다.</p>
          </div>
        ) : (
          filteredAndSortedItems.map((item) => (
            <div key={item.id} className={`expense-item ${item.type}`}>
              <div className="item-main">
                <div className="item-info">
                  <div className="item-date">
                    {format(parseISO(item.date), 'yyyy-MM-dd')}
                  </div>
                  <div className="item-category">{item.category}</div>
                  <div className="item-description">{item.description}</div>
                </div>
                <div className={`item-amount ${item.type}`}>
                  {item.type === 'income' ? '+' : '-'}
                  {item.amount.toLocaleString()}원
                </div>
              </div>
              {item.imageUrl && (
                <div className="item-image">
                  <img src={item.imageUrl} alt="첨부 이미지" />
                </div>
              )}
              <button
                className="delete-button"
                onClick={() => removeItem(item.id)}
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
