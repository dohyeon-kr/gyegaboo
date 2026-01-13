import { authService } from '../services/authService';

/**
 * 인증 토큰을 포함한 헤더를 반환합니다
 */
export function getAuthHeaders(): HeadersInit {
  const token = authService.getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * 인증이 필요한 API 요청을 수행합니다
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 인증 실패 시 로그아웃 처리
  if (response.status === 401) {
    authService.removeToken();
    window.location.reload();
  }

  return response;
}
