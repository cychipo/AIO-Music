import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import Sidebar from "./Sidebar";
import PlayerBar from "../player/PlayerBar";

/* ── Icons (inlined SVG to avoid extra deps) ── */
function IconMenu({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-5 h-5"}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}
function IconClose({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-5 h-5"}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
function IconChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-5 h-5"}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}
function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "w-5 h-5"}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

/* ── Detect if screen is mobile (<768px) ── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

/* ── Detect if screen is desktop (>=1024px) ── */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();

  // Sidebar expanded: defaults to true on desktop, false on mobile & tablet
  const [isExpanded, setIsExpanded] = useState(isDesktop);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile) setIsExpanded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // When screen changes breakpoint, auto-adjust
  useEffect(() => {
    setIsExpanded(isDesktop);
  }, [isDesktop]);

  const toggleSidebar = () => setIsExpanded((v) => !v);

  // Collapse state: only applies on non-mobile when NOT expanded
  const isCollapsed = !isMobile && !isExpanded;

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark text-white font-sans">
      {/* ── Mobile overlay backdrop ── */}
      {isMobile && isExpanded && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          aria-hidden="true"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        id="sidebar"
        aria-label="Main navigation"
        className={`
          flex flex-col flex-shrink-0 glass-panel border-r border-white/10 z-50
          transition-all duration-300 ease-in-out
          ${
            isMobile
              ? `fixed inset-y-0 left-0 w-64 p-6 gap-8 ${isExpanded ? "translate-x-0" : "-translate-x-full"}`
              : `relative h-full overflow-y-auto hide-scrollbar ${isExpanded ? "w-64 p-6 gap-8" : "w-20 p-4 gap-6 items-center"}`
          }
        `}
      >
        {/* Close button in sidebar — mobile only */}
        {isMobile && (
          <button
            onClick={toggleSidebar}
            aria-label="Close sidebar"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors focus-ring"
          >
            <IconClose className="w-4 h-4" />
          </button>
        )}

        <Sidebar isCollapsed={isCollapsed} />
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* ── Sticky Header ── */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 py-3 glass-panel border-b border-white/10 gap-2"
          style={{ minHeight: "60px" }}
        >
          {/* Left: hamburger + nav */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Hamburger — always visible */}
            <button
              onClick={toggleSidebar}
              aria-label={isExpanded ? "Close sidebar" : "Open sidebar"}
              aria-expanded={isExpanded}
              aria-controls="sidebar"
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5 focus-ring"
            >
              {isExpanded && isMobile ? <IconClose /> : <IconMenu />}
            </button>

            {/* Back / Forward — hidden on small mobile */}
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="hidden sm:flex w-10 h-10 rounded-full bg-white/5 items-center justify-center hover:bg-white/10 transition-colors border border-white/5 focus-ring"
            >
              <IconChevronLeft />
            </button>
            <button
              onClick={() => navigate(1)}
              aria-label="Go forward"
              className="hidden sm:flex w-10 h-10 rounded-full bg-white/5 items-center justify-center hover:bg-white/10 transition-colors border border-white/5 focus-ring"
            >
              <IconChevronRight />
            </button>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Desktop App — icon on mobile, full on sm+ */}
            <button
              aria-label="Download desktop app"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors bg-white/5 text-sm font-medium focus-ring"
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span className="hidden sm:inline">Desktop App</span>
            </button>

            {user ? (
              /* Avatar */
              <div
                role="img"
                aria-label={`Signed in as ${user.displayName}`}
                className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm border-2 border-primary/50 ring-4 ring-primary/10 flex-shrink-0"
              >
                {user.displayName?.[0]?.toUpperCase() ?? "?"}
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <a
                  href="/login"
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-text-secondary hover:text-white transition-colors rounded-full hover:bg-white/5 focus-ring whitespace-nowrap"
                >
                  Sign in
                </a>
                <a
                  href="/register"
                  className="px-3 sm:px-5 py-2 text-xs sm:text-sm font-bold gradient-primary text-white rounded-full hover:brightness-110 transition-all glow-orange focus-ring whitespace-nowrap"
                >
                  Sign up
                </a>
              </div>
            )}
          </div>
        </header>

        {/* ── Scrollable page content ── */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-0">
          <Outlet />
        </div>

        {/* ── Player Bar ── */}
        <PlayerBar />
      </main>
    </div>
  );
}
