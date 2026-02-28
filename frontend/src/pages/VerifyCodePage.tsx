import { useState, useRef, useEffect, useId } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

const OTP_LENGTH = 4;
const RESEND_SECONDS = 119; // 01:59

export default function VerifyCodePage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Email được truyền từ ForgotPasswordPage qua navigate state
  const email: string = (location.state as any)?.email ?? "";
  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + "*".repeat(b.length) + c)
    : "al***@example.com";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Đếm ngược
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  const minutes = String(Math.floor(timer / 60)).padStart(2, "0");
  const seconds = String(timer % 60).padStart(2, "0");

  // ── OTP input handlers ────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    // Chỉ chấp nhận 1 ký tự số
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    // Tự động focus ô tiếp theo
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const newOtp = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => { newOtp[i] = ch; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      setError("Vui lòng nhập đầy đủ mã xác minh.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await apiClient.post("/auth/verify-reset-code", { email, code });
      // Chuyển đến trang đặt mật khẩu mới (chưa build — tạm thời về login)
      navigate("/login", {
        state: { message: "Xác minh thành công. Vui lòng đặt mật khẩu mới." },
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Mã không hợp lệ hoặc đã hết hạn."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend ────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    try {
      await apiClient.post("/auth/forgot-password", { email });
      setOtp(Array(OTP_LENGTH).fill(""));
      setError("");
      setTimer(RESEND_SECONDS);
      // Khởi động lại đếm ngược
      clearInterval(timerRef.current!);
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) { clearInterval(timerRef.current!); return 0; }
          return t - 1;
        });
      }, 1000);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Không thể gửi lại mã. Vui lòng thử lại.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#221810] text-slate-100">
      {/* ── Ambient glow ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-[10%] -right-[5%] w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[5%] w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* ── Header ── */}
      <header className="w-full border-b border-primary/20 px-6 md:px-20 py-4 flex items-center justify-between bg-[#221810]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3 text-primary">
          <div className="w-8 h-8 flex items-center justify-center bg-primary rounded-lg text-[#221810]">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold tracking-tight">Sunset Music</h2>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-slate-300 text-sm font-medium hover:text-primary transition-colors">Home</Link>
          <Link to="/search" className="text-slate-300 text-sm font-medium hover:text-primary transition-colors">Browse</Link>
          <Link to="/library" className="text-slate-300 text-sm font-medium hover:text-primary transition-colors">Library</Link>
        </nav>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-[480px]">
          <div
            className="rounded-xl p-8 md:p-12 shadow-2xl backdrop-blur-xl"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            {/* Icon + heading */}
            <div className="flex flex-col items-center text-center gap-6 mb-10">
              <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center">
                {/* shield_lock */}
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h1 className="text-white text-3xl font-bold tracking-tight">
                  Verify Your Identity
                </h1>
                <p className="text-slate-400 text-base leading-relaxed">
                  We&apos;ve sent a security code to your email
                  <br />
                  <span className="text-primary font-medium">{maskedEmail}</span>
                </p>
              </div>
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

            {/* OTP inputs */}
            <form onSubmit={handleSubmit}>
              <div className="flex justify-center mb-10">
                <fieldset className="flex gap-4">
                  <legend className="sr-only">Mã xác minh 4 chữ số</legend>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      aria-label={`Ký tự ${i + 1}`}
                      className="w-14 h-14 md:w-16 md:h-16 text-center text-2xl font-bold bg-white/5 border-2 border-primary/20 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 text-white transition-all outline-none"
                    />
                  ))}
                </fieldset>
              </div>

              {/* Action */}
              <div className="flex flex-col gap-6">
                <button
                  type="submit"
                  disabled={isLoading || otp.join("").length < OTP_LENGTH}
                  className="w-full bg-primary hover:bg-primary/90 text-[#221810] font-bold py-4 rounded-full shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Đang xác minh…
                    </span>
                  ) : (
                    "Verify Account"
                  )}
                </button>

                {/* Timer & Resend */}
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-10 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-primary text-sm font-bold">{minutes}</span>
                    </div>
                    <span className="text-slate-400">:</span>
                    <div className="flex items-center justify-center w-12 h-10 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-primary text-sm font-bold">{seconds}</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm">
                    Didn&apos;t receive the code?{" "}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={timer > 0 || isResending}
                      className="text-primary hover:underline font-semibold ml-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Resend
                    </button>
                  </p>
                </div>
              </div>
            </form>

            {/* Footer help */}
            <div className="mt-8 flex items-center justify-center gap-6">
              <a
                href="#"
                className="text-slate-400 text-xs flex items-center gap-1 hover:text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help Center
              </a>
              <span className="text-slate-600">|</span>
              <Link
                to="/login"
                className="text-slate-400 text-xs flex items-center gap-1 hover:text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
