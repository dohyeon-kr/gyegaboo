import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { useAuthStore } from '../stores/authStore'
import { ThemeToggle } from '../components/ThemeToggle'
import { Card } from '../components/ui/card'
import { Home, BarChart3, Upload, FileText, Calendar, UserPlus, User, LogOut } from 'lucide-react'
import { Button } from '../components/ui/button'
import { FloatingChatWizard } from '../components/FloatingChatWizard'
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

  const menuItems = [
    { path: '/', label: '목록', icon: Home, category: 'main' },
    { path: '/statistics', label: '통계', icon: BarChart3, category: 'main' },
    { path: '/image', label: '이미지', icon: Upload, category: 'input' },
    { path: '/manual', label: '수동 입력', icon: FileText, category: 'input' },
    { path: '/recurring', label: '고정비', icon: Calendar, category: 'management' },
    { path: '/invite', label: '초대', icon: UserPlus, category: 'settings' },
    { path: '/profile', label: '프로필', icon: User, category: 'settings' },
  ]

  const mainMenuItems = menuItems.filter(item => item.category === 'main')
  const inputMenuItems = menuItems.filter(item => item.category === 'input')
  const managementMenuItems = menuItems.filter(item => item.category === 'management')
  const settingsMenuItems = menuItems.filter(item => item.category === 'settings')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-2 sm:p-4 max-w-7xl">
        <Card className="mb-4 sm:mb-6">
          <div className="p-3 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <Link to="/" className="text-xl sm:text-2xl md:text-3xl font-bold hover:opacity-80 transition-opacity">
                가계부
              </Link>
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
            <nav className="space-y-3">
              {/* 주요 메뉴 */}
              <div className="flex flex-wrap gap-2">
                {mainMenuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
                      activeProps={{ className: 'bg-primary text-primary-foreground' }}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
              
              {/* 입력 메뉴 */}
              <div className="flex flex-wrap gap-2 border-t pt-2">
                <span className="text-xs text-muted-foreground px-2 py-1 hidden sm:inline">입력</span>
                {inputMenuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
                      activeProps={{ className: 'bg-primary text-primary-foreground' }}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
              
              {/* 관리 메뉴 */}
              <div className="flex flex-wrap gap-2 border-t pt-2">
                <span className="text-xs text-muted-foreground px-2 py-1 hidden sm:inline">관리</span>
                {managementMenuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
                      activeProps={{ className: 'bg-primary text-primary-foreground' }}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
              
              {/* 설정 메뉴 */}
              <div className="flex flex-wrap gap-2 border-t pt-2">
                <span className="text-xs text-muted-foreground px-2 py-1 hidden sm:inline">설정</span>
                {settingsMenuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
                      activeProps={{ className: 'bg-primary text-primary-foreground' }}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </nav>
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
