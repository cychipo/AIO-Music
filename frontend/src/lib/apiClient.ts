import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: đính kèm JWT access token vào mọi request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("aio_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Cờ để tránh gọi refresh nhiều lần đồng thời
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// Response interceptor: tự động refresh token khi nhận 401
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Chỉ thử refresh 1 lần, và không áp dụng cho chính endpoint /auth/refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      const storedRefreshToken = localStorage.getItem("aio_refresh_token");

      if (!storedRefreshToken) {
        // Không có refresh token → redirect về login
        localStorage.removeItem("aio_token");
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Đang refresh → chờ token mới rồi retry
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken } = res.data;

        localStorage.setItem("aio_token", accessToken);
        localStorage.setItem("aio_refresh_token", newRefreshToken);

        apiClient.defaults.headers.common["Authorization"] =
          `Bearer ${accessToken}`;
        onRefreshed(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        // Refresh thất bại → xoá token và về trang login
        localStorage.removeItem("aio_token");
        localStorage.removeItem("aio_refresh_token");
        refreshSubscribers = [];
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;

// Typed API helpers
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post("/auth/login", { email, password }),
  register: (email: string, password: string, displayName: string) =>
    apiClient.post("/auth/register", { email, password, displayName }),
  refresh: (refreshToken: string) =>
    apiClient.post("/auth/refresh", { refreshToken }),
  logout: (refreshToken: string) =>
    apiClient.post("/auth/logout", { refreshToken }),
  /** Đăng nhập bằng Google One Tap — gửi id_token (credential) lên backend để verify */
  googleOneTap: (credential: string) =>
    apiClient.post("/auth/google/one-tap", { credential }),
};

export const searchApi = {
  searchAll: (q: string, limit = 10) =>
    apiClient.get("/search", { params: { q, limit } }),
  searchYoutube: (q: string, limit = 10) =>
    apiClient.get("/search/youtube", { params: { q, limit } }),
  searchSpotify: (q: string, limit = 10) =>
    apiClient.get("/search/spotify", { params: { q, limit } }),
  searchSoundCloud: (q: string, limit = 10) =>
    apiClient.get("/search/soundcloud", { params: { q, limit } }),
};

export const streamApi = {
  getStreamUrl: (youtubeId: string) =>
    `${BASE_URL}/stream?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${youtubeId}`)}`,
};

export interface AddTrackPayload {
  title: string;
  artist: string;
  album?: string;
  thumbnail?: string;
  duration?: number;
  sourceId: string;
  source: string;
  youtubeId?: string;
  url?: string;
}

export const playlistApi = {
  getMy: () => apiClient.get("/playlists/my"),
  getPublic: () => apiClient.get("/playlists/public"),
  getById: (playlistId: string) => apiClient.get(`/playlists/${playlistId}`),
  create: (data: { name: string; description?: string; isPublic?: boolean }) =>
    apiClient.post("/playlists", data),
  /**
   * Thêm bài hát vào playlist.
   * trackData chứa đầy đủ metadata của bài hát để backend có thể upsert vào Track collection.
   * trackId trong URL chỉ mang tính mô tả (dùng sourceId), body mới là nguồn thật.
   */
  addTrack: (playlistId: string, trackData: AddTrackPayload) =>
    apiClient.patch(
      `/playlists/${playlistId}/tracks/${encodeURIComponent(trackData.sourceId)}`,
      trackData,
    ),
  removeTrack: (playlistId: string, trackId: string) =>
    apiClient.delete(`/playlists/${playlistId}/tracks/${trackId}`),
  delete: (playlistId: string) => apiClient.delete(`/playlists/${playlistId}`),
};

export const userApi = {
  getMe: () => apiClient.get("/users/me"),
  updateProfile: (data: object) => apiClient.patch("/users/me", data),
  toggleLike: (trackId: string) => apiClient.patch(`/users/me/like/${trackId}`),
};

export const trendingApi = {
  /** Lấy trending song song từ cả 3 nền tảng */
  getAll: (limit = 10) => apiClient.get("/trending", { params: { limit } }),
  getYoutube: (limit = 10) =>
    apiClient.get("/trending/youtube", { params: { limit } }),
  getSpotify: (limit = 10) =>
    apiClient.get("/trending/spotify", { params: { limit } }),
  getSoundCloud: (limit = 10) =>
    apiClient.get("/trending/soundcloud", { params: { limit } }),
};
