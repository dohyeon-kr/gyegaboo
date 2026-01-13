import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores/authStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { useToast } from './ui/use-toast';

interface RegisterProps {
  token?: string;
}

export function Register({ token: tokenProp }: RegisterProps) {
  const [token, setToken] = useState<string | null>(tokenProp || null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const { registerWithInvite } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    // prop으로 받은 토큰이 있으면 사용, 없으면 URL에서 추출
    if (tokenProp) {
      setToken(tokenProp);
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      setToken(tokenFromUrl);
    }
  }, [tokenProp]);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setIsValidToken(false);
        return;
      }

      try {
        const result = await authService.verifyInviteToken(token);
        setIsValidToken(result.valid);
        if (!result.valid) {
          toast({
            title: '유효하지 않은 링크',
            description: result.message || '초대 링크가 만료되었거나 유효하지 않습니다.',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        setIsValidToken(false);
        toast({
          title: '오류',
          description: error.message || '링크 검증에 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token, toast]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast({
        title: '오류',
        description: '초대 토큰이 없습니다.',
        variant: 'destructive',
      });
      return;
    }

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
      await registerWithInvite(token, username, password);
      toast({
        title: '회원가입 완료',
        description: '가계부에 오신 것을 환영합니다!',
      });
      // 로그인 상태로 전환되므로 자동으로 메인 페이지로 이동
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: '회원가입 실패',
        description: error.message || '회원가입에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <div className="p-6 text-center">
            <p>초대 링크를 확인하는 중...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <div className="p-6 text-center space-y-4">
            <h1 className="text-2xl font-bold">유효하지 않은 링크</h1>
            <p className="text-muted-foreground">
              초대 링크가 만료되었거나 이미 사용되었습니다.
            </p>
            <Button type="button" onClick={() => window.location.href = '/'}>홈으로 돌아가기</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">회원가입</h1>
            <p className="text-muted-foreground">
              가계부에 가입하여 가족과 함께 가계부를 관리하세요.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
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
              {isLoading ? '가입 중...' : '회원가입'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
