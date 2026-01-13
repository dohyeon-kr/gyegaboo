import { useMemo, useState } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import type { ExpenseItem } from '../types';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
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
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from './ui/use-toast';

export function ExpenseList() {
  const { items, removeItem } = useExpenseStore();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ExpenseItem | null>(null);
  const { toast } = useToast();

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

  const handleDeleteClick = (item: ExpenseItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await removeItem(itemToDelete.id);
      toast({
        title: "삭제 완료",
        description: "항목이 삭제되었습니다.",
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      toast({
        title: "오류",
        description: "삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>가계부 목록</CardTitle>
          <CardDescription>수입과 지출 내역을 확인하고 관리하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="income">수입</SelectItem>
                <SelectItem value="expense">지출</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">날짜순</SelectItem>
                <SelectItem value="amount">금액순</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredAndSortedItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>항목이 없습니다.</p>
              </div>
            ) : (
              filteredAndSortedItems.map((item) => (
                <Card key={item.id} className="border-l-4" style={{
                  borderLeftColor: item.type === 'income' ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(item.date), 'yyyy-MM-dd')}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded-md bg-secondary">
                            {item.category}
                          </span>
                          <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary">
                            {item.createdByProfileImageUrl ? (
                              <img
                                src={item.createdByProfileImageUrl}
                                alt={item.createdByUsername || '작성자'}
                                className="w-4 h-4 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-muted" />
                            )}
                            <span>{item.createdByUsername || '시스템'}</span>
                          </div>
                        </div>
                        <p className="text-sm font-medium">{item.description}</p>
                        {item.imageUrl && (
                          <div className="mt-2">
                            <img 
                              src={item.imageUrl} 
                              alt="첨부 이미지" 
                              className="max-w-[200px] rounded-md border"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`text-right ${item.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                          <div className="flex items-center gap-1">
                            {item.type === 'income' ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span className="font-bold">
                              {item.type === 'income' ? '+' : '-'}
                              {item.amount.toLocaleString()}원
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(item)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>항목 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 항목을 삭제하시겠습니까?
              {itemToDelete && (
                <>
                  <br />
                  <br />
                  <strong>{itemToDelete.description}</strong>
                  <br />
                  {itemToDelete.type === 'income' ? '+' : '-'}
                  {itemToDelete.amount.toLocaleString()}원
                  <br />
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(itemToDelete.date), 'yyyy-MM-dd')} · {itemToDelete.category}
                  </span>
                </>
              )}
              <br />
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
