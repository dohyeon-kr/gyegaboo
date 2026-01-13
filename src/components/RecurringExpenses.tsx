import { useState, useEffect } from 'react';
import { RecurringExpenseService } from '../services/recurringExpenseService';
import { useExpenseStore } from '../stores/expenseStore';
import type { RecurringExpense } from '../types';
import { getToday } from '../utils/dateUtils';
import { format, parseISO } from 'date-fns';

export function RecurringExpenses() {
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringExpense | null>(null);
  const { categories, fetchItems } = useExpenseStore();
  const [formData, setFormData] = useState<Partial<RecurringExpense>>({
    name: '',
    amount: 0,
    category: '',
    description: '',
    type: 'expense',
    repeatType: 'monthly',
    repeatDay: 1,
    startDate: getToday(),
    endDate: undefined,
    isActive: true,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await RecurringExpenseService.getAll();
      setItems(data);
    } catch (error) {
      console.error('고정비 로드 오류:', error);
      alert('고정비를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.amount || !formData.category || !formData.startDate) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    try {
      if (editingItem) {
        await RecurringExpenseService.update(editingItem.id, formData);
      } else {
        const newItem: RecurringExpense = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: formData.name!,
          amount: formData.amount!,
          category: formData.category!,
          description: formData.description || '',
          type: formData.type || 'expense',
          repeatType: formData.repeatType || 'monthly',
          repeatDay: formData.repeatDay,
          startDate: formData.startDate!,
          endDate: formData.endDate,
          isActive: formData.isActive !== false,
        };
        await RecurringExpenseService.create(newItem);
      }
      await loadItems();
      setShowForm(false);
      setEditingItem(null);
      setFormData({
        name: '',
        amount: 0,
        category: '',
        description: '',
        type: 'expense',
        repeatType: 'monthly',
        repeatDay: 1,
        startDate: getToday(),
        endDate: undefined,
        isActive: true,
      });
      alert(editingItem ? '고정비가 수정되었습니다.' : '고정비가 추가되었습니다.');
    } catch (error) {
      console.error('고정비 저장 오류:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const handleEdit = (item: RecurringExpense) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      amount: item.amount,
      category: item.category,
      description: item.description,
      type: item.type,
      repeatType: item.repeatType,
      repeatDay: item.repeatDay,
      startDate: item.startDate,
      endDate: item.endDate,
      isActive: item.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await RecurringExpenseService.delete(id);
      await loadItems();
      alert('삭제되었습니다.');
    } catch (error) {
      console.error('고정비 삭제 오류:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleProcess = async () => {
    try {
      const result = await RecurringExpenseService.process();
      if (result.count > 0) {
        alert(`${result.count}개의 고정비 항목이 추가되었습니다.`);
        await fetchItems();
        await loadItems();
      } else {
        alert('처리할 고정비가 없습니다.');
      }
    } catch (error) {
      console.error('고정비 처리 오류:', error);
      alert('처리에 실패했습니다.');
    }
  };

  const handleProcessById = async (id: string) => {
    try {
      await RecurringExpenseService.processById(id);
      alert('고정비가 처리되었습니다.');
      await fetchItems();
      await loadItems();
    } catch (error) {
      console.error('고정비 처리 오류:', error);
      alert('처리에 실패했습니다.');
    }
  };

  const getRepeatTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: '매일',
      weekly: '매주',
      monthly: '매월',
      yearly: '매년',
    };
    return labels[type] || type;
  };

  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.type
  );

  return (
    <div className="recurring-expenses">
      <div className="header-section">
        <h2>고정비 관리</h2>
        <div className="header-actions">
          <button onClick={handleProcess} className="process-button">
            지금 처리하기
          </button>
          <button onClick={() => setShowForm(!showForm)} className="add-button">
            {showForm ? '취소' : '고정비 추가'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-section">
          <h3>{editingItem ? '고정비 수정' : '고정비 추가'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>이름 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>유형 *</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as 'income' | 'expense',
                    category: '',
                  })
                }
              >
                <option value="expense">지출</option>
                <option value="income">수입</option>
              </select>
            </div>

            <div className="form-group">
              <label>카테고리 *</label>
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
              <label>금액 *</label>
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
                placeholder="설명을 입력하세요"
              />
            </div>

            <div className="form-group">
              <label>반복 유형 *</label>
              <select
                value={formData.repeatType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    repeatType: e.target.value as RecurringExpense['repeatType'],
                  })
                }
              >
                <option value="daily">매일</option>
                <option value="weekly">매주</option>
                <option value="monthly">매월</option>
                <option value="yearly">매년</option>
              </select>
            </div>

            {(formData.repeatType === 'weekly' || formData.repeatType === 'monthly') && (
              <div className="form-group">
                <label>
                  {formData.repeatType === 'weekly' ? '요일 (0=일요일, 6=토요일)' : '일자 (1-31)'}
                </label>
                <input
                  type="number"
                  value={formData.repeatDay || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      repeatDay: parseInt(e.target.value) || undefined,
                    })
                  }
                  min={formData.repeatType === 'weekly' ? 0 : 1}
                  max={formData.repeatType === 'weekly' ? 6 : 31}
                />
              </div>
            )}

            <div className="form-group">
              <label>시작일 *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>만료일 (선택사항)</label>
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value || undefined })
                }
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                활성화
              </label>
            </div>

            <button type="submit" className="submit-button">
              {editingItem ? '수정' : '추가'}
            </button>
          </form>
        </div>
      )}

      <div className="list-section">
        <h3>고정비 목록</h3>
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">고정비가 없습니다.</div>
        ) : (
          <div className="items-container">
            {items.map((item) => (
              <div key={item.id} className={`recurring-item ${item.isActive ? 'active' : 'inactive'}`}>
                <div className="item-main">
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-details">
                      <span className="item-category">{item.category}</span>
                      <span className="item-repeat">
                        {getRepeatTypeLabel(item.repeatType)}
                        {item.repeatDay !== undefined && item.repeatDay !== null && (
                          <>
                            {' '}
                            {item.repeatType === 'weekly'
                              ? `(${['일', '월', '화', '수', '목', '금', '토'][item.repeatDay]}요일)`
                              : `${item.repeatDay}일`}
                          </>
                        )}
                      </span>
                    </div>
                    <div className="item-dates">
                      시작: {format(parseISO(item.startDate), 'yyyy-MM-dd')}
                      {item.endDate && ` ~ ${format(parseISO(item.endDate), 'yyyy-MM-dd')}`}
                      {item.lastProcessedDate &&
                        ` | 마지막 처리: ${format(parseISO(item.lastProcessedDate), 'yyyy-MM-dd')}`}
                    </div>
                  </div>
                  <div className={`item-amount ${item.type}`}>
                    {item.type === 'income' ? '+' : '-'}
                    {item.amount.toLocaleString()}원
                  </div>
                </div>
                <div className="item-actions">
                  <button
                    onClick={() => handleProcessById(item.id)}
                    className="process-item-button"
                    disabled={!item.isActive}
                  >
                    처리
                  </button>
                  <button onClick={() => handleEdit(item)} className="edit-button">
                    수정
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="delete-button">
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
