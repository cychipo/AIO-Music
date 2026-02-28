import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/apiClient';

// Mở rộng Window để tránh TS lỗi khi truy cập google.accounts
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          cancel: () => void;
          renderButton: (parent: HTMLElement, options: object) => void;
        };
      };
    };
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

/**
 * Hook khởi tạo Google One Tap.
 *
 * - Khi chưa đăng nhập: gọi `google.accounts.id.prompt()` → hiện popup góc phải.
 * - Khi đã đăng nhập: gọi `google.accounts.id.cancel()` để tắt prompt nếu nó đang hiện.
 *
 * Cách dùng: `useGoogleOneTap()` trong bất kỳ page/layout nào bạn muốn hiện popup.
 */
export function useGoogleOneTap() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loginWithOAuth = useAuthStore((s) => s.loginWithOAuth);

  useEffect(() => {
    if (!CLIENT_ID) {
      // VITE_GOOGLE_CLIENT_ID chưa được set → bỏ qua
      return;
    }

    // Chờ GSI script load xong
    const init = () => {
      if (!window.google?.accounts?.id) return;

      if (isAuthenticated) {
        // Đã đăng nhập → tắt One Tap nếu đang hiện
        window.google.accounts.id.cancel();
        return;
      }

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response: { credential: string }) => {
          try {
            const res = await authApi.googleOneTap(response.credential);
            const { accessToken, refreshToken } = res.data;
            await loginWithOAuth(accessToken, refreshToken);
          } catch (err) {
            console.error('[GoogleOneTap] Đăng nhập thất bại:', err);
          }
        },
        // Hiện prompt ngay, không delay
        auto_select: false,
        // Không dùng FedCM (tránh vấn đề browser compat)
        use_fedcm_for_prompt: false,
      });

      window.google.accounts.id.prompt((notification: any) => {
        // Ghi log khi prompt bị dismiss (tuỳ chọn)
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // One Tap không hiện được (ví dụ: user đã dismiss nhiều lần)
          // → không làm gì thêm, giữ im lặng
        }
      });
    };

    // Nếu script đã load
    if (window.google?.accounts?.id) {
      init();
    } else {
      // Script chưa load — chờ sự kiện load
      window.addEventListener('load', init, { once: true });
    }

    return () => {
      window.removeEventListener('load', init);
      window.google?.accounts?.id?.cancel();
    };
  }, [isAuthenticated, loginWithOAuth]);
}
