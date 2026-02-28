import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('aio_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 globally
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('aio_token');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;

// Typed API helpers
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (email: string, password: string, displayName: string) =>
    apiClient.post('/auth/register', { email, password, displayName }),
};

export const searchApi = {
  searchAll: (q: string, limit = 10) =>
    apiClient.get('/search', { params: { q, limit } }),
  searchYoutube: (q: string, limit = 10) =>
    apiClient.get('/search/youtube', { params: { q, limit } }),
  searchSpotify: (q: string, limit = 10) =>
    apiClient.get('/search/spotify', { params: { q, limit } }),
};

export const streamApi = {
  getStreamUrl: (youtubeId: string) =>
    `${BASE_URL}/stream?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${youtubeId}`)}`,
};

export const playlistApi = {
  getMy: () => apiClient.get('/playlists/my'),
  getPublic: () => apiClient.get('/playlists/public'),
  create: (data: { name: string; description?: string; isPublic?: boolean }) =>
    apiClient.post('/playlists', data),
  addTrack: (playlistId: string, trackId: string) =>
    apiClient.patch(`/playlists/${playlistId}/tracks/${trackId}`),
  removeTrack: (playlistId: string, trackId: string) =>
    apiClient.delete(`/playlists/${playlistId}/tracks/${trackId}`),
  delete: (playlistId: string) =>
    apiClient.delete(`/playlists/${playlistId}`),
};

export const userApi = {
  getMe: () => apiClient.get('/users/me'),
  updateProfile: (data: object) => apiClient.patch('/users/me', data),
  toggleLike: (trackId: string) => apiClient.patch(`/users/me/like/${trackId}`),
};

export const trendingApi = {
  /** Lấy trending song song từ cả 3 nền tảng */
  getAll: (limit = 10) =>
    apiClient.get('/trending', { params: { limit } }),
  getYoutube: (limit = 10) =>
    apiClient.get('/trending/youtube', { params: { limit } }),
  getSpotify: (limit = 10) =>
    apiClient.get('/trending/spotify', { params: { limit } }),
  getSoundCloud: (limit = 10) =>
    apiClient.get('/trending/soundcloud', { params: { limit } }),
};
