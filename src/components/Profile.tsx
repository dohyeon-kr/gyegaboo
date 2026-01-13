import { useState, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from './ui/use-toast';
import { User, Upload, X } from 'lucide-react';

export function Profile() {
  const { user, updateProfile, uploadProfileImage } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname || user?.username || '');
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(user?.profileImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
  };

  const handleSaveNickname = async () => {
    if (!nickname.trim()) {
      toast({
        title: "오류",
        description: "닉네임을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await updateProfile(nickname.trim());
      toast({
        title: "저장 완료",
        description: "닉네임이 변경되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "닉네임 변경에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 미리보기
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setImageLoading(true);
    try {
      await uploadProfileImage(file);
      toast({
        title: "업로드 완료",
        description: "프로필 이미지가 변경되었습니다.",
      });
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "이미지 업로드에 실패했습니다.",
        variant: "destructive",
      });
      // 실패 시 미리보기 초기화
      setPreview(user?.profileImageUrl || null);
    } finally {
      setImageLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    setImageLoading(true);
    try {
      // 빈 파일을 업로드하여 이미지 제거 (또는 별도 API 필요)
      // 임시로 닉네임만 업데이트하여 이미지 제거는 나중에 구현
      setPreview(null);
      toast({
        title: "알림",
        description: "이미지 제거 기능은 준비 중입니다.",
      });
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "이미지 제거에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setImageLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>프로필 설정</CardTitle>
          <CardDescription>닉네임과 프로필 이미지를 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 프로필 이미지 */}
          <div className="space-y-4">
            <Label>프로필 이미지</Label>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative shrink-0">
                {preview ? (
                  <img
                    src={preview}
                    alt="프로필"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                    <User className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageLoading}
                  className="w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  이미지 선택
                </Button>
                {preview && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUploadImage}
                      disabled={imageLoading}
                      className="w-full sm:w-auto"
                    >
                      {imageLoading ? '업로드 중...' : '업로드'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleRemoveImage}
                      disabled={imageLoading}
                      className="text-destructive w-full sm:w-auto"
                    >
                      <X className="h-4 w-4 mr-2" />
                      제거
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 닉네임 */}
          <div className="space-y-2">
            <Label htmlFor="nickname">닉네임</Label>
            <div className="flex gap-2">
              <Input
                id="nickname"
                type="text"
                value={nickname}
                onChange={handleNicknameChange}
                placeholder="닉네임을 입력하세요"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleSaveNickname}
                disabled={loading || nickname === (user.nickname || user.username)}
              >
                {loading ? '저장 중...' : '저장'}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              현재 사용자명: {user.username}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
