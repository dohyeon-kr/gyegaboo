import { Link } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';
import { ThemeToggle } from './ThemeToggle';
import { Card } from './ui/card';
import { LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { FloatingChatWizard } from './FloatingChatWizard';
import { MenuDrawer } from './MenuDrawer';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * 메인 애플리케이션 레이아웃 컴포넌트
 * 헤더, 네비게이션, 플로팅 위자드를 포함
 */
export function AppLayout({ children }: AppLayoutProps) {
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

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
            {children}
          </div>
        </Card>
      </div>

      {/* 플로팅 챗봇 위자드 */}
      <FloatingChatWizard />
    </div>
  );
}
