import { createFileRoute } from '@tanstack/react-router'
import { ManualEntry } from '../components/ManualEntry'

export const Route = createFileRoute('/manual')({
  component: ManualComponent,
})

function ManualComponent() {
  return <ManualEntry />
}
