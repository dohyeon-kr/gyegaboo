import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { useAuthStore } from '../stores/authStore'
import { ThemeToggle } from '../components/ThemeToggle'
import { Card } from '../components/ui/card'
import { LogOut } from 'lucide-react'
import { Button } from '../components/ui/button'
import { FloatingChatWizard } from '../components/FloatingChatWizard'
import { MenuDrawer } from '../components/MenuDrawer'
import { Login } from '../components/Login'
import { Register } from '../components/Register'
import { useEffect } from 'react'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const { isAuthenticated, user, logout, checkAuth, isLoading } = useAuthStore()

  // 인증 상태 확인
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // URL에서 토큰이 있으면 회원가입 페이지로 리다이렉트
  const searchParams = new URLSearchParams(window.location.search)
  const inviteToken = searchParams.get('token')
  
  if (inviteToken) {
    return <Register token={inviteToken} />
  }

  // 로딩 중이거나 인증되지 않은 경우 로그인 페이지 표시
  if (isLoading || !isAuthenticated || user?.isInitialAdmin) {
    return <Login />
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-2 sm:p-4 max-w-7xl">
        <Card className="mb-4 sm:mb-6">
          <div className="p-3 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <MenuDrawer>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </Button>
                </MenuDrawer>
                <Link to="/" className="text-xl sm:text-2xl md:text-3xl font-bold hover:opacity-80 transition-opacity">
                  가계부
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="로그아웃"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-3 sm:p-6">
            <Outlet />
          </div>
        </Card>
      </div>
      
      {/* 플로팅 챗봇 위자드 */}
      <FloatingChatWizard />
    </div>
  )
}
