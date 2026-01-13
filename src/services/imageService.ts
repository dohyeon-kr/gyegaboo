import type { ImageUploadResponse } from '../types';
import { authenticatedFetch } from '../utils/apiClient';
import { authService } from './authService';

// 이미지 업로드 및 OCR 서비스
const IMAGE_API_URL = import.meta.env.VITE_IMAGE_API_URL || '/api/image';

export class ImageService {
  /**
   * 이미지를 업로드하고 OCR을 통해 가계부 데이터를 추출합니다
   * @param file 이미지 파일
   * @returns 추출된 가계부 항목 배열
   */
  static async uploadAndExtract(file: File): Promise<ImageUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = authService.getToken();
      const headers: HeadersInit = {};
      
      // FormData를 사용할 때는 Content-Type을 설정하지 않음 (브라우저가 자동 설정)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${IMAGE_API_URL}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '이미지 업로드 실패' }));
        throw new Error(errorData.error || `서버 오류: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        items: data.items || [],
      };
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * 이미지 URL에서 가계부 데이터를 추출합니다
   * @param imageUrl 이미지 URL
   * @returns 추출된 가계부 항목 배열
   */
  static async extractFromUrl(imageUrl: string): Promise<ImageUploadResponse> {
    try {
      const response = await authenticatedFetch(`${IMAGE_API_URL}/extract`, {
        method: 'POST',
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error('이미지 처리 실패');
      }

      const data = await response.json();
      return {
        success: true,
        items: data.items || [],
      };
    } catch (error) {
      console.error('이미지 추출 오류:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }
}
