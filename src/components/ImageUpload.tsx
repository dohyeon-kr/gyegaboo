import { useState, useRef, useEffect, useCallback } from 'react';
import { useExpenseStore } from '../stores/expenseStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Upload, X, Image as ImageIcon, Clipboard } from 'lucide-react';
import { useToast } from './ui/use-toast';

export function ImageUpload() {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { uploadImageAndExtract, loading } = useExpenseStore();
  const { toast } = useToast();

  const processImageFile = useCallback((file: File) => {
    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      toast({
        title: "오류",
        description: "이미지 파일만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // 이미지 미리보기
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    // 파일 입력 필드에 포커스가 있으면 무시 (파일 선택 중일 때)
    if (document.activeElement === fileInputRef.current) {
      return;
    }

    const items = e.clipboardData?.items;
    if (!items) return;

    // 클립보드에서 이미지 찾기
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          processImageFile(file);
          toast({
            title: "이미지 붙여넣기",
            description: "클립보드에서 이미지를 가져왔습니다.",
          });
        }
        break;
      }
    }
  }, [processImageFile, toast]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 컴포넌트 마운트 시 paste 이벤트 리스너 추가
    container.addEventListener('paste', handlePaste);
    
    // 포커스를 받을 수 있도록 tabIndex 설정
    container.tabIndex = -1;

    return () => {
      container.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "오류",
        description: "파일을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await uploadImageAndExtract(selectedFile);
      
      if (response.success && response.items && response.items.length > 0) {
        toast({
          title: "추가 완료",
          description: `${response.items.length}개의 항목이 추가되었습니다.`,
        });
        // 초기화
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast({
          title: "추출 실패",
          description: response.message || '이미지에서 데이터를 추출하지 못했습니다.',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>이미지로 가계부 추가</CardTitle>
        <CardDescription>영수증이나 가계부 이미지를 업로드하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          ref={containerRef}
          className="border-2 border-dashed rounded-lg p-4 sm:p-8 text-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {preview ? (
            <div className="space-y-4">
              <img 
                src={preview} 
                alt="미리보기" 
                className="max-w-full max-h-64 sm:max-h-96 mx-auto rounded-lg border"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                다시 선택
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <ImageIcon className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground" />
              <p className="text-sm sm:text-base text-muted-foreground">
                영수증이나 가계부 이미지를 업로드하세요
              </p>
              <p className="text-xs text-muted-foreground">
                또는 Ctrl+V (Mac: Cmd+V)로 클립보드 이미지를 붙여넣을 수 있습니다
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  이미지 선택
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    // 포커스를 컨테이너로 이동하여 paste 이벤트 활성화
                    containerRef.current?.focus();
                    toast({
                      title: "클립보드 붙여넣기",
                      description: "Ctrl+V (Mac: Cmd+V)를 눌러 이미지를 붙여넣으세요",
                    });
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <Clipboard className="h-4 w-4 mr-2" />
                  붙여넣기
                </Button>
              </div>
            </div>
          )}
        </div>
        {preview && (
          <Button
            type="button"
            onClick={handleUpload}
            disabled={loading}
            className="w-full"
          >
            {loading ? '처리 중...' : '업로드 및 추출'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
