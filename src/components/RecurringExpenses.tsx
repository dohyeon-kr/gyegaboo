import { useState, useEffect } from 'react';
import { RecurringExpenseService } from '../services/recurringExpenseService';
import { useExpenseStore } from '../stores/expenseStore';
import type { RecurringExpense } from '../types';
import { getToday } from '../utils/dateUtils';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Play, Plus, Edit, Trash2, X } from 'lucide-react';
import { useToast } from './ui/use-toast';

export function RecurringExpenses() {
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringExpense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RecurringExpense | null>(null);
  const { categories, fetchItems } = useExpenseStore();
  const { toast } = useToast();
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
      toast({
        title: "오류",
        description: "고정비를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.amount || !formData.category || !formData.startDate) {
      toast({
        title: "입력 오류",
        description: "필수 항목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        await RecurringExpenseService.update(editingItem.id, formData);
        toast({
          title: "수정 완료",
          description: "고정비가 수정되었습니다.",
        });
      } else {
        const newItem: RecurringExpense = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`,
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
        toast({
          title: "추가 완료",
          description: "고정비가 추가되었습니다.",
        });
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
    } catch (error) {
      toast({
        title: "오류",
        description: "저장에 실패했습니다.",
        variant: "destructive",
      });
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
    try {
      await RecurringExpenseService.delete(id);
      await loadItems();
      toast({
        title: "삭제 완료",
        description: "삭제되었습니다.",
      });
    } catch (error) {
      toast({
        title: "오류",
        description: "삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleProcess = async () => {
    try {
      const result = await RecurringExpenseService.process();
      if (result.count > 0) {
        toast({
          title: "처리 완료",
          description: `${result.count}개의 고정비 항목이 추가되었습니다.`,
        });
        await fetchItems();
        await loadItems();
      } else {
        toast({
          title: "알림",
          description: "처리할 고정비가 없습니다.",
        });
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "처리에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleProcessById = async (id: string) => {
    try {
      await RecurringExpenseService.processById(id);
      toast({
        title: "처리 완료",
        description: "고정비가 처리되었습니다.",
      });
      await fetchItems();
      await loadItems();
    } catch (error) {
      toast({
        title: "오류",
        description: "처리에 실패했습니다.",
        variant: "destructive",
      });
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>고정비 관리</CardTitle>
              <CardDescription>반복되는 수입/지출을 자동으로 관리하세요</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleProcess} variant="outline">
                <Play className="h-4 w-4 mr-2" />
                지금 처리하기
              </Button>
              <Button onClick={() => setShowForm(!showForm)}>
                <Plus className="h-4 w-4 mr-2" />
                {showForm ? '취소' : '고정비 추가'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingItem ? '고정비 수정' : '고정비 추가'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">유형 *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        type: value as 'income' | 'expense',
                        category: '',
                      })
                    }
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">지출</SelectItem>
                      <SelectItem value="income">수입</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리 *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">금액 *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="설명을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="repeatType">반복 유형 *</Label>
                  <Select
                    value={formData.repeatType}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        repeatType: value as RecurringExpense['repeatType'],
                      })
                    }
                  >
                    <SelectTrigger id="repeatType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">매일</SelectItem>
                      <SelectItem value="weekly">매주</SelectItem>
                      <SelectItem value="monthly">매월</SelectItem>
                      <SelectItem value="yearly">매년</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.repeatType === 'weekly' || formData.repeatType === 'monthly') && (
                  <div className="space-y-2">
                    <Label htmlFor="repeatDay">
                      {formData.repeatType === 'weekly' ? '요일 (0=일요일, 6=토요일)' : '일자 (1-31)'}
                    </Label>
                    <Input
                      id="repeatDay"
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">시작일 *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">만료일 (선택사항)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value || undefined })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  활성화
                </Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingItem ? '수정' : '추가'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>고정비 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">고정비가 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className={`border-l-4 ${
                    item.isActive ? 'opacity-100' : 'opacity-60'
                  }`}
                  style={{
                    borderLeftColor: item.type === 'income' ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)',
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{item.name}</span>
                          <span className="px-2 py-1 text-xs font-medium rounded-md bg-secondary">
                            {item.category}
                          </span>
                          {!item.isActive && (
                            <span className="px-2 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
                              비활성
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">
                          {getRepeatTypeLabel(item.repeatType)}
                          {item.repeatDay !== undefined && item.repeatDay !== null && (
                            <>
                              {' '}
                              {item.repeatType === 'weekly'
                                ? `(${['일', '월', '화', '수', '목', '금', '토'][item.repeatDay]}요일)`
                                : `${item.repeatDay}일`}
                            </>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          시작: {format(parseISO(item.startDate), 'yyyy-MM-dd')}
                          {item.endDate && ` ~ ${format(parseISO(item.endDate), 'yyyy-MM-dd')}`}
                          {item.lastProcessedDate &&
                            ` | 마지막 처리: ${format(parseISO(item.lastProcessedDate), 'yyyy-MM-dd')}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-right font-bold ${item.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                          {item.type === 'income' ? '+' : '-'}
                          {item.amount.toLocaleString()}원
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleProcessById(item.id)}
                            disabled={!item.isActive}
                            title="처리"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive hover:text-destructive"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
