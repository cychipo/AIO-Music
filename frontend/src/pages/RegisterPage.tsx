import { useState, useId } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useGoogleOneTap } from "../hooks/useGoogleOneTap";
import UserAccountWidget from "../components/UserAccountWidget";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

function redirectToOAuth(provider: "google" | "facebook") {
  window.location.href = `${API_BASE}/auth/${provider}`;
}

// ── Logo icon (diamond) ───────────────────────────────────────────────────────
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

// ── Google icon ───────────────────────────────────────────────────────────────
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── Facebook icon ─────────────────────────────────────────────────────────────
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

  // Google One Tap — hiện popup nếu chưa đăng nhập
  useGoogleOneTap();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    try {
      await register(email, password, displayName);
      navigate("/");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        // Email đã tồn tại — gợi ý đăng nhập qua provider phù hợp
        const provider: string | undefined = err?.response?.data?.provider;
        if (provider === "google") {
          setError(
            "Email này đã được đăng ký qua Google. Vui lòng đăng nhập bằng Google.",
          );
        } else if (provider === "facebook") {
          setError(
            "Email này đã được đăng ký qua Facebook. Vui lòng đăng nhập bằng Facebook.",
          );
        } else {
          setError("Email này đã được sử dụng. Vui lòng đăng nhập.");
        }
      } else {
        setError(
          err?.response?.data?.message || err?.message || "Đăng ký thất bại",
        );
      }
    }
  };

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ background: "#221810", color: "#f1f5f9" }}
    >
      {/* ── Left: brand panel (ẩn trên mobile) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#221810]/80 to-transparent z-10" />
        {/* background gradient thay cho ảnh thật (không có external image) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #3a1a00 0%, #1a0a00 40%, #221810 100%)",
          }}
        >
          {/* Decorative blobs */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-[80px]" />
          <div className="absolute bottom-40 right-10 w-60 h-60 bg-amber-600/10 rounded-full blur-[60px]" />
        </div>

        {/* Brand content */}
        <div className="relative z-20 flex flex-col justify-end p-20 w-full">
          <div className="flex items-center gap-3 mb-6">
            <LogoIcon className="w-8 h-8 text-primary" />
            <span className="text-white text-2xl font-bold tracking-tight">
              Sunset Music
            </span>
          </div>
          <h1 className="text-5xl font-black text-white leading-tight mb-4">
            The rhythm of your life, <br />
            captured in sound.
          </h1>
          <p className="text-slate-200 text-lg max-w-md">
            Join over 2 million music lovers discovering hand-crafted playlists
            and exclusive artist sessions.
          </p>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 md:p-16 bg-[#221810] overflow-y-auto relative">
        {/* Widget tài khoản — góc trên phải, chỉ hiện khi đã đăng nhập */}
        {isAuthenticated && (
          <div className="absolute top-4 right-4 z-10">
            <UserAccountWidget />
          </div>
        )}

        <div className="max-w-[440px] w-full">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-8">
            <LogoIcon className="w-7 h-7 text-primary" />
            <span className="text-white text-xl font-bold">Sunset Music</span>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold mb-2 text-slate-100">
              Create your account
            </h2>
            <p className="text-slate-400">
              Experience music like never before.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor={nameId}
                className="text-sm font-semibold text-slate-300 ml-1"
              >
                Full Name
              </label>
              <div className="relative group">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <input
                  id={nameId}
                  type="text"
                  autoComplete="name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-12 pr-4 h-14 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-100 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor={emailId}
                className="text-sm font-semibold text-slate-300 ml-1"
              >
                Email Address
              </label>
              <div className="relative group">
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
                  className="w-full pl-12 pr-4 h-14 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-100 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor={passwordId}
                className="text-sm font-semibold text-slate-300 ml-1"
              >
                Password
              </label>
              <div className="relative group">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full pl-12 pr-12 h-14 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-100 placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !email || !password || !displayName}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
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
                  Đang tạo tài khoản…
                </>
              ) : (
                <>
                  <span>Join Now</span>
                  {/* arrow forward */}
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Or continue with
            </span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => redirectToOAuth("google")}
              className="flex items-center justify-center gap-3 h-12 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <GoogleIcon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Google</span>
            </button>
            <button
              type="button"
              onClick={() => redirectToOAuth("facebook")}
              className="flex items-center justify-center gap-3 h-12 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FacebookIcon className="w-5 h-5 flex-shrink-0 text-[#1877F2]" />
              <span className="text-sm font-medium">Facebook</span>
            </button>
          </div>

          {/* Login link */}
          <p className="mt-10 text-center text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-bold hover:underline underline-offset-4 ml-1"
            >
              Log in
            </Link>
          </p>

          {/* Legal */}
          <p className="mt-8 text-center text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
            By joining, you agree to our{" "}
            <a href="#" className="underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
