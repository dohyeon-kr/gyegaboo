import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { useToast } from './ui/use-toast';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, checkAuth } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(username, password);
      toast({
        title: '로그인 성공',
        description: '환영합니다!',
      });
    } catch (err: any) {
      toast({
        title: '로그인 실패',
        description: err.message || '로그인에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.isInitialAdmin) {
    return <RegisterAdminForm />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-2 sm:p-4">
      <Card className="w-full max-w-md">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">가계부</h1>
            <p className="text-sm sm:text-base text-muted-foreground">로그인하여 시작하세요</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">사용자명</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

function RegisterAdminForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { registerAdmin } = useAuthStore();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: '오류',
        description: '비밀번호가 일치하지 않습니다.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: '오류',
        description: '비밀번호는 최소 8자 이상이어야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await registerAdmin(username, password);
      toast({
        title: '등록 완료',
        description: '새로운 관리자가 등록되었습니다.',
      });
    } catch (err: any) {
      toast({
        title: '등록 실패',
        description: err.message || '관리자 등록에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">관리자 등록</h1>
            <p className="text-muted-foreground">
              초기 관리자 계정으로 로그인하셨습니다.<br />
              새로운 관리자 계정을 등록해주세요.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">사용자명</Label>
              <Input
                id="new-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">비밀번호</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-sm text-muted-foreground">
                최소 8자 이상 입력해주세요.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">비밀번호 확인</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '등록 중...' : '관리자 등록'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            등록 완료 후 초기 관리자 계정은 자동으로 삭제됩니다.
          </p>
        </div>
      </Card>
    </div>
  );
}
