import { useState } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import type { ExpenseItem } from '../types';
import { getToday } from '../utils/dateUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from './ui/use-toast';

export function ManualEntry() {
  const { addItem, categories } = useExpenseStore();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<ExpenseItem>>({
    date: getToday(),
    type: 'expense',
    amount: 0,
    category: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.category || !formData.description || !formData.amount) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
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

    try {
      await addItem(newItem);
      
      // 폼 초기화
      setFormData({
        date: getToday(),
        type: 'expense',
        amount: 0,
        category: '',
        description: '',
      });
      
      toast({
        title: "추가 완료",
        description: "항목이 추가되었습니다.",
      });
    } catch (error) {
      toast({
        title: "오류",
        description: "항목 추가에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const filteredCategories = categories.filter(
    (cat) => cat.type === formData.type
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>수동 입력</CardTitle>
        <CardDescription>가계부 항목을 직접 입력하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">유형</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as 'income' | 'expense', category: '' })
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

            <div className="space-y-2">
              <Label htmlFor="date">날짜</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
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
            <Label htmlFor="amount">금액</Label>
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

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="항목 설명을 입력하세요"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            추가
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
