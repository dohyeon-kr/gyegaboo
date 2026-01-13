const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface User {
  id: string;
  username: string;
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
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '로그인에 실패했습니다.');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  async registerAdmin(username: string, password: string): Promise<RegisterAdminResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch(`${API_URL}/auth/register-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '관리자 등록에 실패했습니다.');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('인증에 실패했습니다.');
    }

    return response.json();
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
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
    const token = this.getToken();
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch(`${API_URL}/auth/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '초대 링크 생성에 실패했습니다.');
    }

    return response.json();
  }

  async verifyInviteToken(token: string): Promise<{ valid: boolean; message?: string }> {
    const response = await fetch(`${API_URL}/auth/invite/${token}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      return { valid: false, message: error.error };
    }

    return response.json();
  }

  async registerWithInvite(token: string, username: string, password: string): Promise<RegisterResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '회원가입에 실패했습니다.');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }
}

export const authService = new AuthService();
