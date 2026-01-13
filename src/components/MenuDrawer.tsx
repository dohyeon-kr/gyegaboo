import React from 'react'
import { Link } from '@tanstack/react-router'
import { Home, BarChart3, Upload, FileText, Calendar, UserPlus, User } from 'lucide-react'
import { Button } from './ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet'

interface MenuItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  category: string
}

interface MenuDrawerProps {
  children?: React.ReactNode
}

export function MenuDrawer({ children }: MenuDrawerProps) {
  const [open, setOpen] = React.useState(false)

  const menuItems: MenuItem[] = [
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

  const handleLinkClick = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button type="button" variant="ghost" size="icon">
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
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>메뉴</SheetTitle>
          <SheetDescription>가계부 기능을 선택하세요</SheetDescription>
        </SheetHeader>
        <nav className="mt-6 space-y-6">
          {/* 주요 메뉴 */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">주요</h3>
            <ul className="space-y-1">
              {mainMenuItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
                      activeProps={{ className: 'bg-primary text-primary-foreground' }}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* 입력 메뉴 */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">입력</h3>
            <ul className="space-y-1">
              {inputMenuItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
                      activeProps={{ className: 'bg-primary text-primary-foreground' }}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* 관리 메뉴 */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">관리</h3>
            <ul className="space-y-1">
              {managementMenuItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
                      activeProps={{ className: 'bg-primary text-primary-foreground' }}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* 설정 메뉴 */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">설정</h3>
            <ul className="space-y-1">
              {settingsMenuItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
                      activeProps={{ className: 'bg-primary text-primary-foreground' }}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
