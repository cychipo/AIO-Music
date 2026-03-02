import { NavLink, Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { usePlaylistStore } from "../../store/playlistStore";

const navItems = [
  {
    to: "/",
    label: "Home",
    icon: (
      <svg
        className="w-6 h-6"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    to: "/search",
    label: "Search",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
  {
    to: "/library",
    label: "Your Library",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        />
      </svg>
    ),
  },
];

export default function Sidebar({
  isCollapsed = false,
}: {
  isCollapsed?: boolean;
}) {
  const { user, logout } = useAuthStore();
  const { playlists } = usePlaylistStore();

  return (
    <>
      {/* Logo */}
      <div
        className={`flex items-center gap-3 ${isCollapsed ? "justify-center w-full px-0" : "px-2"}`}
      >
        <div className="bg-gradient-to-br from-primary to-accent-amber p-2 rounded-lg glow-orange">
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
        {!isCollapsed && (
          <h1 className="text-xl font-bold tracking-tight text-white whitespace-nowrap overflow-hidden text-ellipsis">
            VibeX
          </h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2" aria-label="Primary navigation">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            title={isCollapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center font-semibold transition-all focus-visible:ring-2 focus-visible:ring-primary/70 ${
                isCollapsed
                  ? "justify-center w-12 h-12 rounded-full mx-auto"
                  : "gap-4 px-4 py-3 rounded-full"
              } ${
                isActive
                  ? "bg-gradient-to-r from-primary/20 to-transparent text-primary border border-primary/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            <div className={isCollapsed ? "w-6 h-6 flex-shrink-0" : ""}>
              {icon}
            </div>
            {!isCollapsed && (
              <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Playlist list — chỉ hiện khi expanded và đã đăng nhập */}
      {!isCollapsed && user && playlists.length > 0 && (
        <div className="flex flex-col gap-1 flex-shrink-0">
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-1">
            Playlists
          </p>
          <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto hide-scrollbar">
            {playlists.map((pl) => (
              <NavLink
                key={pl._id}
                to={`/library/playlist/${pl._id}`}
                title={pl.name}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-full text-sm transition-all truncate ${
                    isActive
                      ? "bg-gradient-to-r from-primary/20 to-transparent text-primary border border-primary/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                {/* Mini thumbnail or gradient dot */}
                <div className="w-4 h-4 flex-shrink-0 rounded-sm overflow-hidden bg-gradient-to-br from-primary/60 to-amber-400/40">
                  {pl.thumbnail && (
                    <img
                      src={pl.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <span className="truncate font-medium">{pl.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Bottom — Premium CTA or User */}
      <div className="mt-auto pb-6">
        {!user ? (
          /* Guest */
          isCollapsed ? (
            <Link
              to="/register"
              title="Create Account"
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto border border-primary/30 glow-amber bg-white/5 hover:bg-white/10 transition-colors"
            >
              <svg
                className="w-6 h-6 text-accent-amber"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </Link>
          ) : (
            <div
              className="p-5 rounded-2xl border border-white/5 glow-amber flex-shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(251,191,36,0.05))",
              }}
            >
              <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.2em] mb-2 whitespace-nowrap">
                Exclusive Access
              </p>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Sign up to unlock liked songs, playlists and your listening
                history.
              </p>
              <Link to="/register">
                <button className="w-full py-2.5 bg-gradient-to-r from-primary to-accent-amber text-white font-bold rounded-full text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20">
                  Create Account
                </button>
              </Link>
            </div>
          )
        ) : /* Logged-in */
        isCollapsed ? (
          <div
            className="w-12 h-12 mx-auto rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:brightness-110"
            onClick={logout}
            title="Sign Out"
          >
            {user.displayName?.[0]?.toUpperCase() ?? "?"}
          </div>
        ) : (
          <div className="pt-4 border-t border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3 px-2 mb-3">
              <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user.displayName?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-white truncate">
                  {user.displayName}
                </p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full text-sm text-slate-400 hover:text-white py-2 rounded-full hover:bg-white/5 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
