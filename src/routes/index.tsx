import { createFileRoute } from '@tanstack/react-router'
import { ExpenseList } from '../components/ExpenseList'
import { useExpenseStore } from '../stores/expenseStore'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  const { fetchItems, fetchCategories } = useExpenseStore()

  useEffect(() => {
    fetchItems()
    fetchCategories()
  }, [fetchItems, fetchCategories])

  return (
    <div>
      <ExpenseList />
    </div>
  )
}
