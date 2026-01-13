import { useMemo, useState } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import type { ExpenseItem } from '../types';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
import { Trash2, TrendingUp, TrendingDown, Edit, Search, X } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { EditExpenseDialog } from './EditExpenseDialog';

export function ExpenseList() {
  const { items, removeItem } = useExpenseStore();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [authorFilter, setAuthorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ExpenseItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ExpenseItem | null>(null);
  const { toast } = useToast();

  // 고유한 작성자 목록 추출
  const uniqueAuthors = useMemo(() => {
    const authors = new Set<string>();
    items.forEach((item) => {
      if (item.createdByUsername) {
        authors.add(item.createdByUsername);
      }
    });
    return Array.from(authors).sort();
  }, [items]);

  const filteredAndSortedItems = useMemo(() => {
    let filtered: ExpenseItem[] = items;

    // 유형 필터
    if (filter !== 'all') {
      filtered = filtered.filter((item) => item.type === filter);
    }

    // 작성자 필터
    if (authorFilter !== 'all') {
      filtered = filtered.filter((item) => item.createdByUsername === authorFilter);
    }

    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) =>
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return b.date.localeCompare(a.date);
      } else {
        return b.amount - a.amount;
      }
    });
  }, [items, filter, authorFilter, searchQuery, sortBy]);

  const handleDeleteClick = (item: ExpenseItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (item: ExpenseItem) => {
    setItemToEdit(item);
    setEditDialogOpen(true);
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
          <div className="space-y-4 mb-4 sm:mb-6">
            {/* 검색 바 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="설명 또는 카테고리로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* 필터 및 정렬 */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="income">수입</SelectItem>
                  <SelectItem value="expense">지출</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={authorFilter} onValueChange={setAuthorFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="작성자" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 작성자</SelectItem>
                  {uniqueAuthors.map((author) => (
                    <SelectItem key={author} value={author}>
                      {author}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">날짜순</SelectItem>
                  <SelectItem value="amount">금액순</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 필터 상태 표시 */}
            {(filter !== 'all' || authorFilter !== 'all' || searchQuery.trim()) && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">적용된 필터:</span>
                {filter !== 'all' && (
                  <span className="px-2 py-1 rounded-md bg-primary/10 text-primary">
                    {filter === 'income' ? '수입' : '지출'}
                  </span>
                )}
                {authorFilter !== 'all' && (
                  <span className="px-2 py-1 rounded-md bg-primary/10 text-primary">
                    작성자: {authorFilter}
                  </span>
                )}
                {searchQuery.trim() && (
                  <span className="px-2 py-1 rounded-md bg-primary/10 text-primary">
                    검색: {searchQuery}
                  </span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilter('all');
                    setAuthorFilter('all');
                    setSearchQuery('');
                  }}
                  className="h-7 text-xs"
                >
                  필터 초기화
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {filteredAndSortedItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>
                  {items.length === 0
                    ? '항목이 없습니다.'
                    : '필터 조건에 맞는 항목이 없습니다.'}
                </p>
                {(filter !== 'all' || authorFilter !== 'all' || searchQuery.trim()) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setFilter('all');
                      setAuthorFilter('all');
                      setSearchQuery('');
                    }}
                  >
                    필터 초기화
                  </Button>
                )}
              </div>
            ) : (
              filteredAndSortedItems.map((item) => (
                <Card key={item.id} className="border-l-4" style={{
                  borderLeftColor: item.type === 'income' ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'
                }}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
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
                            <span className="truncate">{item.createdByUsername || '시스템'}</span>
                          </div>
                        </div>
                        <p className="text-sm font-medium break-words">{item.description}</p>
                        {item.imageUrl && (
                          <div className="mt-2">
                            <img 
                              src={item.imageUrl} 
                              alt="첨부 이미지" 
                              className="max-w-full sm:max-w-[200px] rounded-md border"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:flex-col sm:items-end">
                        <div className={`text-right sm:text-right ${item.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                          <div className="flex items-center gap-1">
                            {item.type === 'income' ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span className="font-bold text-sm sm:text-base">
                              {item.type === 'income' ? '+' : '-'}
                              {item.amount.toLocaleString()}원
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(item)}
                            className="text-primary hover:text-primary"
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(item)}
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

      <EditExpenseDialog
        item={itemToEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
}
