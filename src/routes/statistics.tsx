import { createFileRoute } from '@tanstack/react-router'
import { Statistics } from '../components/Statistics'

export const Route = createFileRoute('/statistics')({
  component: StatisticsComponent,
})

function StatisticsComponent() {
  return <Statistics />
}
