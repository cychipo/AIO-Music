import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authApi, userApi } from '../lib/apiClient';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithOAuth: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login(email, password);
          const { user, accessToken, refreshToken } = res.data;
          localStorage.setItem('aio_token', accessToken);
          localStorage.setItem('aio_refresh_token', refreshToken);
          set({ user, token: accessToken, refreshToken, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (email, password, displayName) => {
        set({ isLoading: true });
        try {
          const res = await authApi.register(email, password, displayName);
          const { user, accessToken, refreshToken } = res.data;
          localStorage.setItem('aio_token', accessToken);
          localStorage.setItem('aio_refresh_token', refreshToken);
          set({ user, token: accessToken, refreshToken, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      // Lưu token từ OAuth callback (Google / Facebook)
      loginWithOAuth: async (accessToken, refreshToken) => {
        localStorage.setItem('aio_token', accessToken);
        localStorage.setItem('aio_refresh_token', refreshToken);
        set({ token: accessToken, refreshToken, isAuthenticated: true });
        // Lấy thông tin user từ server
        try {
          const res = await userApi.getMe();
          set({ user: res.data });
        } catch {
          // Nếu không lấy được user thì vẫn giữ trạng thái authenticated
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await authApi.logout(refreshToken);
          }
        } catch {
          // Bỏ qua lỗi khi logout — xoá token local dù sao
        } finally {
          localStorage.removeItem('aio_token');
          localStorage.removeItem('aio_refresh_token');
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
        }
      },

      refresh: async () => {
        const { refreshToken } = get();
        if (!refreshToken) throw new Error('Không có refresh token');
        const res = await authApi.refresh(refreshToken);
        const { accessToken, refreshToken: newRefreshToken } = res.data;
        localStorage.setItem('aio_token', accessToken);
        localStorage.setItem('aio_refresh_token', newRefreshToken);
        set({ token: accessToken, refreshToken: newRefreshToken });
      },

      fetchMe: async () => {
        try {
          const res = await userApi.getMe();
          set({ user: res.data, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'aio-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);
