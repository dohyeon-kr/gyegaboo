import { useState } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import type { ExpenseItem } from '../types';
import { getToday } from '../utils/dateUtils';

export function ManualEntry() {
  const { addItem, categories } = useExpenseStore();
  const [formData, setFormData] = useState<Partial<ExpenseItem>>({
    date: getToday(),
    type: 'expense',
    amount: 0,
    category: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.category || !formData.description || !formData.amount) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      date: formData.date,
      amount: formData.amount,
      category: formData.category,
      description: formData.description,
      type: formData.type || 'expense',
    };

    addItem(newItem);
    
    // 폼 초기화
    setFormData({
      date: getToday(),
      type: 'expense',
      amount: 0,
      category: '',
      description: '',
    });
    
    alert('항목이 추가되었습니다.');
  };

  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.type
  );

  return (
    <div className="manual-entry">
      <h2>수동 입력</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>유형</label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as 'income' | 'expense', category: '' })
            }
          >
            <option value="expense">지출</option>
            <option value="income">수입</option>
          </select>
        </div>

        <div className="form-group">
          <label>날짜</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>카테고리</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          >
            <option value="">선택하세요</option>
            {filteredCategories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>금액</label>
          <input
            type="number"
            value={formData.amount || ''}
            onChange={(e) =>
              setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })
            }
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label>설명</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="항목 설명을 입력하세요"
            required
          />
        </div>

        <button type="submit" className="submit-button">
          추가
        </button>
      </form>
    </div>
  );
}
