import { createFileRoute } from '@tanstack/react-router'
import { InviteMember } from '../components/InviteMember'

export const Route = createFileRoute('/invite')({
  component: InviteComponent,
})

function InviteComponent() {
  return <InviteMember />
}
