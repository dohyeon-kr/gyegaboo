import type { ImageUploadResponse } from '../types';
import { apiClient, getErrorMessage } from '../utils/apiClient';

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

      const { data } = await apiClient.post<{ items?: any[] }>('/image/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        items: data.items || [],
      };
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      return {
        success: false,
        message: getErrorMessage(error) || '알 수 없는 오류',
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
      const { data } = await apiClient.post<{ items?: any[] }>('/image/extract', { imageUrl });
      return {
        success: true,
        items: data.items || [],
      };
    } catch (error) {
      console.error('이미지 추출 오류:', error);
      return {
        success: false,
        message: getErrorMessage(error) || '알 수 없는 오류',
      };
    }
  }
}
