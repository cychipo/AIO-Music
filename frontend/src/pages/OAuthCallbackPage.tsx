import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

/**
 * Trang callback sau khi đăng nhập OAuth (Google / Facebook).
 * Backend redirect về: /auth/callback?accessToken=...&refreshToken=...
 * Trang này lưu token vào store rồi chuyển hướng về trang chủ.
 */
export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const loginWithOAuth = useAuthStore((s) => s.loginWithOAuth);
  const handled = useRef(false); // tránh chạy 2 lần do StrictMode

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (!accessToken || !refreshToken) {
      // Token không hợp lệ — quay về trang login với thông báo lỗi
      navigate("/login?error=oauth_failed", { replace: true });
      return;
    }

    loginWithOAuth(accessToken, refreshToken).then(() => {
      navigate("/", { replace: true });
    });
  }, []);

  return (
    <div
      className="flex h-screen w-full items-center justify-center"
      style={{ background: "#221810", color: "#f1f5f9" }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <svg
          className="w-10 h-10 animate-spin text-primary"
          fill="none"
          viewBox="0 0 24 24"
          aria-label="Đang xử lý đăng nhập…"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
        <p className="text-slate-400 text-sm">Đang hoàn tất đăng nhập…</p>
      </div>
    </div>
  );
}
