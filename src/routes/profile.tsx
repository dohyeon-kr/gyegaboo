import { createFileRoute } from '@tanstack/react-router'
import { Profile } from '../components/Profile'

export const Route = createFileRoute('/profile')({
  component: ProfileComponent,
})

function ProfileComponent() {
  return <Profile />
}
