import { useState, useRef } from 'react';
import { ImageService } from '../services/imageService';
import { useExpenseStore } from '../stores/expenseStore';

export function ImageUpload() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addItems } = useExpenseStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 미리보기
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const response = await ImageService.uploadAndExtract(file);
      
      if (response.success && response.items && response.items.length > 0) {
        addItems(response.items);
        alert(`${response.items.length}개의 항목이 추가되었습니다.`);
        // 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setPreview(null);
      } else {
        alert(response.message || '이미지에서 데이터를 추출하지 못했습니다.');
      }
    } catch (error) {
      alert('업로드 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-upload">
      <h2>이미지로 가계부 추가</h2>
      <div className="upload-area">
        {preview ? (
          <div className="preview-container">
            <img src={preview} alt="미리보기" className="preview-image" />
            <button onClick={() => setPreview(null)}>다시 선택</button>
          </div>
        ) : (
          <div className="upload-placeholder">
            <p>영수증이나 가계부 이미지를 업로드하세요</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="select-button"
            >
              이미지 선택
            </button>
          </div>
        )}
      </div>
      {preview && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="upload-button"
        >
          {loading ? '처리 중...' : '업로드 및 추출'}
        </button>
      )}
    </div>
  );
}
