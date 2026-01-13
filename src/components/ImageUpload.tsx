import { useState, useRef } from 'react';
import { ImageService } from '../services/imageService';
import { useExpenseStore } from '../stores/expenseStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from './ui/use-toast';

export function ImageUpload() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addItems } = useExpenseStore();
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // 이미지 미리보기
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "오류",
        description: "파일을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await ImageService.uploadAndExtract(selectedFile);
      
      if (response.success && response.items && response.items.length > 0) {
        try {
        await addItems(response.items);
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
        } catch (addError) {
          console.error('Error adding items:', addError);
          toast({
            title: "추가 실패",
            description: addError instanceof Error ? addError.message : "항목 추가 중 오류가 발생했습니다.",
            variant: "destructive",
          });
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>이미지로 가계부 추가</CardTitle>
        <CardDescription>영수증이나 가계부 이미지를 업로드하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed rounded-lg p-4 sm:p-8 text-center">
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                이미지 선택
              </Button>
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
