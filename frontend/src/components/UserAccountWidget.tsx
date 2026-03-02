import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../store/authStore";

/**
 * Widget góc phải — hiển thị khi đã đăng nhập:
 * - Avatar (ảnh hoặc chữ cái đầu)
 * - Tên hiển thị
 * - Nút Đăng xuất
 *
 * Khi chưa đăng nhập: không render gì (GSI One Tap tự hiện popup của Google).
 */
export default function UserAccountWidget() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!isAuthenticated || !user) return null;

  const initials = user.displayName?.[0]?.toUpperCase() ?? "?";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      // GSI One Tap sẽ tự kích hoạt lại sau khi isAuthenticated = false
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Tài khoản của bạn"
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* Avatar */}
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.displayName}
            className="w-9 h-9 rounded-full object-cover border-2 border-primary/50 ring-2 ring-primary/10 flex-shrink-0"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-primary/50 ring-2 ring-primary/10 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #FF6F00, #e65100)" }}
          >
            {initials}
          </div>
        )}
        {/* Tên — ẩn trên màn hình nhỏ */}
        <span className="hidden md:block text-sm font-semibold text-slate-100 max-w-[120px] truncate">
          {user.displayName}
        </span>
        {/* Chevron */}
        <svg
          className={`hidden md:block w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-2xl z-50 py-1 overflow-hidden"
          style={{
            background: "rgba(34, 24, 16, 0.97)",
            border: "1px solid rgba(255, 111, 0, 0.15)",
            backdropFilter: "blur(12px)",
          }}
          role="menu"
          aria-label="Menu tài khoản"
        >
          {/* Info */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-sm font-semibold text-white truncate">
              {user.displayName}
            </p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>

          {/* Đăng xuất */}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {loggingOut ? (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            )}
            {loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}
          </button>
        </div>
      )}
    </div>
  );
}
