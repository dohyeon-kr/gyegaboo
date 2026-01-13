import { apiClient, getErrorMessage } from '../utils/apiClient';

export interface User {
  id: string;
  username: string;
  nickname?: string;
  profileImageUrl?: string;
  isInitialAdmin: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterAdminResponse {
  token: string;
  user: User;
  message: string;
}

export interface InviteResponse {
  token: string;
  inviteLink: string;
  expiresAt: string;
  message: string;
}

export interface RegisterResponse {
  token: string;
  user: User;
  message: string;
}

class AuthService {
  private tokenKey = 'gyegaboo_auth_token';

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', { username, password });
      this.setToken(data.token);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || '로그인에 실패했습니다.');
    }
  }

  async registerAdmin(username: string, password: string): Promise<RegisterAdminResponse> {
    if (!this.getToken()) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const { data } = await apiClient.post<RegisterAdminResponse>('/auth/register-admin', { username, password });
      this.setToken(data.token);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || '관리자 등록에 실패했습니다.');
    }
  }

  async getCurrentUser(): Promise<User> {
    if (!this.getToken()) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const { data } = await apiClient.get<User>('/auth/me');
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || '인증에 실패했습니다.');
    }
  }

  async logout(): Promise<void> {
    if (this.getToken()) {
      try {
        await apiClient.post('/auth/logout');
      } catch (error) {
        // 로그아웃 실패해도 토큰은 삭제
        console.error('Logout error:', error);
      }
    }
    this.removeToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async createInviteLink(): Promise<InviteResponse> {
    if (!this.getToken()) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const { data } = await apiClient.post<InviteResponse>('/auth/invite');
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || '초대 링크 생성에 실패했습니다.');
    }
  }

  async verifyInviteToken(token: string): Promise<{ valid: boolean; message?: string }> {
    try {
      const { data } = await apiClient.get<{ valid: boolean; message?: string }>(`/auth/invite/${token}`);
      return data;
    } catch (error) {
      return { valid: false, message: getErrorMessage(error) };
    }
  }

  async registerWithInvite(token: string, username: string, password: string): Promise<RegisterResponse> {
    try {
      const { data } = await apiClient.post<RegisterResponse>('/auth/register', { token, username, password });
      this.setToken(data.token);
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || '회원가입에 실패했습니다.');
    }
  }

  async updateProfile(nickname?: string): Promise<User> {
    if (!this.getToken()) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const { data } = await apiClient.put<User>('/auth/profile', { nickname });
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || '프로필 업데이트에 실패했습니다.');
    }
  }

  async uploadProfileImage(file: File): Promise<User> {
    if (!this.getToken()) {
      throw new Error('로그인이 필요합니다.');
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      // FormData를 사용할 때는 Content-Type을 명시하지 않아야 함
      // 브라우저가 자동으로 boundary를 포함한 올바른 Content-Type을 설정함
      const { data } = await apiClient.post<User>('/auth/profile/image', formData, {
        headers: {
          'Content-Type': undefined, // undefined로 설정하여 axios가 자동으로 설정하도록 함
        },
      });
      return data;
    } catch (error) {
      throw new Error(getErrorMessage(error) || '프로필 이미지 업로드에 실패했습니다.');
    }
  }
}

export const authService = new AuthService();
