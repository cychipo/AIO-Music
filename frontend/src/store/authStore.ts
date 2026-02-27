import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authApi, userApi } from '../lib/apiClient';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login(email, password);
          const { user, token } = res.data;
          localStorage.setItem('aio_token', token);
          set({ user, token, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (email, password, displayName) => {
        set({ isLoading: true });
        try {
          const res = await authApi.register(email, password, displayName);
          const { user, token } = res.data;
          localStorage.setItem('aio_token', token);
          set({ user, token, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem('aio_token');
        set({ user: null, token: null, isAuthenticated: false });
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
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
