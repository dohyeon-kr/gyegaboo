import { useState, useEffect } from 'react'
import type { ExpenseItem } from '../types'
import { useExpenseStore } from '../stores/expenseStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useToast } from './ui/use-toast'

interface EditExpenseDialogProps {
  item: ExpenseItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditExpenseDialog({ item, open, onOpenChange }: EditExpenseDialogProps) {
  const { updateItem, categories } = useExpenseStore()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    type: 'expense' as 'income' | 'expense',
    date: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (item) {
      setFormData({
        description: item.description || '',
        amount: item.amount.toString() || '',
        category: item.category || '',
        type: item.type || 'expense',
        date: item.date || new Date().toISOString().split('T')[0],
      })
    }
  }, [item])

  const filteredCategories = categories.filter((cat) => cat.type === formData.type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return

    if (!formData.description || !formData.amount || !formData.category || !formData.date) {
      toast({
        title: '오류',
        description: '모든 필드를 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: '오류',
        description: '올바른 금액을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      await updateItem(item.id, {
        description: formData.description,
        amount,
        category: formData.category,
        type: formData.type,
        date: formData.date,
      })
      toast({
        title: '수정 완료',
        description: '항목이 수정되었습니다.',
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: '오류',
        description: '수정에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>항목 수정</DialogTitle>
          <DialogDescription>가계부 항목을 수정하세요</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-type">유형</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as 'income' | 'expense', category: '' })}
            >
              <SelectTrigger id="edit-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">지출</SelectItem>
                <SelectItem value="income">수입</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">카테고리</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger id="edit-category">
                <SelectValue placeholder="카테고리 선택" />
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
            <Label htmlFor="edit-description">설명</Label>
            <Input
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="항목 설명을 입력하세요"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-amount">금액</Label>
            <Input
              id="edit-amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0"
              min="1"
              step="1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-date">날짜</Label>
            <Input
              id="edit-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '수정 중...' : '수정'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
