import { create } from 'zustand';
import { authService, type User } from '../services/authService';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  registerAdmin: (username: string, password: string) => Promise<void>;
  registerWithInvite: (token: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (nickname?: string) => Promise<void>;
  uploadProfileImage: (file: File) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username: string, password: string) => {
    try {
      const response = await authService.login(username, password);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  registerAdmin: async (username: string, password: string) => {
    try {
      const response = await authService.registerAdmin(username, password);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  registerWithInvite: async (token: string, username: string, password: string) => {
    try {
      const response = await authService.registerWithInvite(token, username, password);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await authService.logout();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  checkAuth: async () => {
    if (!authService.isAuthenticated()) {
      set({ isLoading: false });
      return;
    }

    try {
      const user = await authService.getCurrentUser();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      authService.removeToken();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateProfile: async (nickname?: string) => {
    const user = await authService.updateProfile(nickname);
    set({ user });
  },

  uploadProfileImage: async (file: File) => {
    const user = await authService.uploadProfileImage(file);
    set({ user });
  },
}));
