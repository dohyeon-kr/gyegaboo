import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Login } from './Login';
import { Register } from './Register';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 인증이 필요한 페이지를 보호하는 컴포넌트
 * 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, user, checkAuth, isLoading } = useAuthStore();

  // 인증 상태 확인
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // URL에서 토큰이 있으면 회원가입 페이지로 리다이렉트
  const searchParams = new URLSearchParams(window.location.search);
  const inviteToken = searchParams.get('token');

  if (inviteToken) {
    return <Register token={inviteToken} />;
  }

  // 로딩 중이거나 인증되지 않은 경우 로그인 페이지 표시
  if (isLoading || !isAuthenticated || user?.isInitialAdmin) {
    return <Login />;
  }

  return <>{children}</>;
}
