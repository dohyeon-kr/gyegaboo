import { createFileRoute } from '@tanstack/react-router'
import { Register } from '../components/Register'

export const Route = createFileRoute('/register')({
  component: RegisterComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || undefined,
    }
  },
})

function RegisterComponent() {
  const { token } = Route.useSearch()
  return <Register token={token} />
}
