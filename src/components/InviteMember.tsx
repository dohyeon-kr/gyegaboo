import { useState } from 'react';
import { authService } from '../services/authService';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useToast } from './ui/use-toast';
import { Copy, Check } from 'lucide-react';

export function InviteMember() {
  const [inviteLink, setInviteLink] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCreateInvite = async () => {
    setIsLoading(true);
    try {
      const result = await authService.createInviteLink();
      setInviteLink(result.inviteLink);
      toast({
        title: '초대 링크 생성 완료',
        description: '링크는 10분간 유효합니다.',
      });
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '초대 링크 생성에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: '복사 완료',
        description: '초대 링크가 클립보드에 복사되었습니다.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: '복사 실패',
        description: '링크를 복사할 수 없습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">구성원 초대</h2>
          <p className="text-muted-foreground">
            초대 링크를 생성하여 가족 구성원을 초대할 수 있습니다.
            링크는 10분간 유효하며, 사용 후 즉시 만료됩니다.
          </p>
        </div>

        <Button type="button" onClick={handleCreateInvite} disabled={isLoading} className="w-full">
          {isLoading ? '링크 생성 중...' : '초대 링크 생성'}
        </Button>

        {inviteLink && (
          <div className="space-y-2">
            <label className="text-sm font-medium">초대 링크</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md bg-background text-foreground"
              />
              <Button
                type="button"
                onClick={handleCopyLink}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              이 링크를 공유하여 가족 구성원을 초대하세요.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
