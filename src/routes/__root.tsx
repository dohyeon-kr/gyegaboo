import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AuthGuard } from '../components/AuthGuard'
import { AppLayout } from '../components/AppLayout'

export const Route = createRootRoute({
  component: RootComponent,
})

/**
 * Root 컴포넌트
 * 인증 가드와 레이아웃만 담당
 */
function RootComponent() {
  return (
    <AuthGuard>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AuthGuard>
  )
}
