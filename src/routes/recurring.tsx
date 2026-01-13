import { createFileRoute } from '@tanstack/react-router'
import { RecurringExpenses } from '../components/RecurringExpenses'

export const Route = createFileRoute('/recurring')({
  component: RecurringComponent,
})

function RecurringComponent() {
  return <RecurringExpenses />
}
