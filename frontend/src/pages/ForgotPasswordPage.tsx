import { useState, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../lib/apiClient";

// ── Logo icon ─────────────────────────────────────────────────────────────────
function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        clipRule="evenodd"
        d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const emailId = useId();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      // Gửi yêu cầu reset password — backend gửi email với OTP
      await apiClient.post("/auth/forgot-password", { email });
      setSent(true);
      // Chuyển sang trang nhập OTP, truyền email qua state
      navigate("/forgot-password/verify", { state: { email } });
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Không thể gửi email. Vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#221810] text-slate-100">
      {/* ── Ambient glow ── */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      {/* ── Header ── */}
      <header className="w-full border-b border-primary/10 px-6 md:px-10 py-4 flex items-center justify-between bg-[#221810]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3 text-primary">
          <LogoIcon className="w-6 h-6" />
          <h2 className="text-white text-xl font-bold tracking-tight">
            Sunset Music
          </h2>
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-slate-400 hover:text-primary transition-colors text-sm font-medium"
            >
              Explore
            </Link>
            <Link
              to="/"
              className="text-slate-400 hover:text-primary transition-colors text-sm font-medium"
            >
              Library
            </Link>
          </nav>
          <Link
            to="/register"
            className="flex min-w-[100px] items-center justify-center rounded-full h-10 px-5 bg-primary text-[#221810] text-sm font-bold hover:brightness-110 transition-all"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div
          className="relative w-full max-w-[480px] rounded-xl shadow-2xl p-8 md:p-12 backdrop-blur-xl"
          style={{
            background: "rgba(34, 24, 16, 0.4)",
            border: "1px solid rgba(242, 127, 13, 0.1)",
          }}
        >
          {/* Icon + heading */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              {/* lock_reset icon (SVG) */}
              <svg
                className="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 7a4 4 0 00-8 0v3H5a1 1 0 00-1 1v8a1 1 0 001 1h14a1 1 0 001-1v-8a1 1 0 00-1-1h-2V7zM9 7a3 3 0 016 0v3H9V7z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M12 14v3"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M16 5.5a5 5 0 010 7"
                  opacity="0.4"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-3 text-white">
              Forgot Password?
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Don&apos;t worry, it happens. Enter the email address associated
              with your account and we&apos;ll send you a recovery link.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
            >
              {error}
            </div>
          )}

          {/* Success */}
          {sent && (
            <div
              role="status"
              className="mb-6 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm"
            >
              Email đã được gửi. Đang chuyển hướng…
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <label
                htmlFor={emailId}
                className="text-sm font-semibold text-slate-300 ml-1 block"
              >
                Email Address
              </label>
              <div className="relative group">
                {/* mail icon */}
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#221810]/60 border border-primary/20 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full flex items-center justify-center gap-2 h-14 bg-primary text-[#221810] font-bold text-lg rounded-xl hover:shadow-[0_0_20px_rgba(244,123,37,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Đang gửi…
                </>
              ) : (
                <>
                  Send Reset Link
                  {/* arrow_forward */}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-medium py-2"
            >
              {/* arrow_back */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Back to Login
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer decoration ── */}
      <footer className="p-10 flex flex-col items-center justify-center gap-4 opacity-40">
        <div className="flex items-end gap-1 h-8">
          <div className="w-1 bg-primary h-4 rounded-full" />
          <div className="w-1 bg-primary h-8 rounded-full" />
          <div className="w-1 bg-primary h-6 rounded-full" />
          <div className="w-1 bg-primary h-2 rounded-full" />
          <div className="w-1 bg-primary h-5 rounded-full" />
        </div>
        <p className="text-xs uppercase tracking-[0.2em] font-medium">
          Keep the music playing
        </p>
      </footer>
    </div>
  );
}
