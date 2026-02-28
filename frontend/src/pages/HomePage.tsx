import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

/* ── Data ── */
const RECOMMENDED = [
  {
    id: 0,
    title: "Neon Horizon",
    artist: "Vaporwave Collective",
    color: "from-violet-500 to-purple-400",
  },
  {
    id: 1,
    title: "Deep Echoes",
    artist: "Soma & Soul",
    color: "from-sky-500 to-cyan-400",
  },
  {
    id: 2,
    title: "Woodland Folk",
    artist: "The Wanderer",
    color: "from-emerald-500 to-teal-400",
  },
  {
    id: 3,
    title: "Bass Culture",
    artist: "Electric City",
    color: "from-orange-500 to-amber-400",
  },
  {
    id: 4,
    title: "Retro Grooves",
    artist: "Classic Gold",
    color: "from-yellow-500 to-orange-400",
  },
  {
    id: 5,
    title: "Late Night Jazz",
    artist: "Blue Note Trio",
    color: "from-blue-600 to-indigo-500",
  },
];

const POPULAR = [
  {
    rank: 1,
    title: "After Hours",
    artist: "The Weekenders",
    album: "Solaris Rising",
    duration: "3:45",
    liked: false,
  },
  {
    rank: 2,
    title: "Electric Sky",
    artist: "Midnight Pulse",
    album: "Digital Echoes",
    duration: "4:12",
    liked: true,
  },
  {
    rank: 3,
    title: "Golden Hour",
    artist: "Sun Collective",
    album: "Warmth",
    duration: "3:29",
    liked: false,
  },
  {
    rank: 4,
    title: "Midnight Run",
    artist: "Neon Drive",
    album: "City Lights",
    duration: "5:01",
    liked: false,
  },
  {
    rank: 5,
    title: "Lunar Waves",
    artist: "Drift & Echo",
    album: "Cosmos",
    duration: "3:58",
    liked: true,
  },
];

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="font-sans">
      {/* ── Hero Banner ── */}
      <section className="mb-8 sm:mb-12">
        <div className="relative h-[220px] sm:h-[280px] lg:h-[340px] w-full rounded-2xl sm:rounded-[2.5rem] overflow-hidden group border border-white/5">
          {/* Concert atmosphere background — dark left, purple/magenta right */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, #121212 0%, rgba(18,18,18,0.85) 35%, rgba(100,30,80,0.55) 65%, rgba(140,40,110,0.75) 100%)",
            }}
          />
          {/* Warm orange glow near text */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 75% 50%, rgba(180,60,140,0.45) 0%, transparent 60%), radial-gradient(ellipse at 90% 80%, rgba(255,111,0,0.12) 0%, transparent 40%)",
            }}
          />
          {/* Subtle neon lines on right side */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden opacity-40"
            aria-hidden="true"
          >
            <div className="absolute top-1/3 right-1/4 w-px h-32 rotate-[20deg] bg-gradient-to-b from-transparent via-purple-400 to-transparent blur-[1px]" />
            <div className="absolute top-1/4 right-1/3 w-px h-48 rotate-[-15deg] bg-gradient-to-b from-transparent via-pink-300 to-transparent blur-[1px]" />
            <div className="absolute top-1/2 right-1/6 w-px h-24 rotate-[35deg] bg-gradient-to-b from-transparent via-purple-300 to-transparent blur-[2px]" />
          </div>
          {/* Scale on hover */}
          <div
            className="absolute inset-0 transition-transform duration-1000 group-hover:scale-105 rounded-[2.5rem]"
            style={{
              background:
                "radial-gradient(ellipse at 80% 50%, rgba(100,30,90,0.3) 0%, transparent 70%)",
            }}
          />

          {/* Content */}
          <div
            className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10 lg:p-16"
            style={{ paddingTop: "16px" }}
          >
            <span className="flex items-center gap-2 text-accent-gold font-bold text-xs uppercase tracking-[0.3em] mb-4">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {user ? `${greeting}, ${user.displayName}` : "Trending Artist"}
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-5 lg:mb-6 drop-shadow-2xl tracking-tighter leading-none">
              All Your Music,
              <br />
              <span className="text-primary">One Place.</span>
            </h1>

            <p className="hidden sm:block text-slate-300 max-w-md mb-6 lg:mb-10 text-sm lg:text-lg font-light leading-relaxed">
              Stream from YouTube, Spotify, TikTok & SoundCloud — all without
              switching apps.
            </p>

            <div className="flex gap-3">
              <Link to="/search">
                <button className="px-5 sm:px-8 lg:px-10 py-3 sm:py-4 bg-gradient-to-r from-primary to-accent-amber text-white font-bold rounded-full flex items-center gap-2 hover:scale-105 transition-all shadow-2xl shadow-primary/40 text-sm sm:text-base">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Listen Now
                </button>
              </Link>
              <button className="px-5 sm:px-8 lg:px-10 py-3 sm:py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold rounded-full hover:bg-white/20 transition-all text-sm sm:text-base">
                Top Charts
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Recommended for You ── */}
      <section className="mb-8 sm:mb-12">
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Recommended for You
          </h2>
          <Link
            to="/search"
            className="text-sm font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1"
          >
            See all
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-5 lg:gap-8">
          {RECOMMENDED.map((item) => (
            <article
              key={item.id}
              className="group p-4 sm:p-5 rounded-2xl bg-surface-dark hover:bg-surface-dark-light transition-all border border-white/5 cursor-pointer"
            >
              {/* Artwork */}
              <div
                className={`relative aspect-square mb-5 rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br ${item.color}`}
              >
                {/* Play button — appears on hover */}
                <button
                  aria-label={`Play ${item.title}`}
                  className="absolute bottom-3 right-3 size-14 rounded-full bg-gradient-to-br from-primary to-accent-amber text-white shadow-2xl
                             opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0
                             transition-all flex items-center justify-center hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <svg
                    className="w-7 h-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
              <h3 className="font-bold text-white mb-1 truncate group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-slate-400 truncate">{item.artist}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Popular Tracks ── */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Popular Tracks
          </h2>
        </div>

        {/* Header row */}
        <div className="flex items-center gap-4 px-3 pb-3 border-b border-white/8 text-xs text-slate-500 uppercase tracking-wider font-bold">
          <span className="w-8 text-center">#</span>
          <span className="w-14 flex-shrink-0" />
          <span className="flex-1">Title</span>
          <span className="hidden md:block text-sm w-36">Album</span>
          <span className="flex items-center gap-6 pr-1">
            <span className="w-5" />
            <span className="w-12 text-right">Duration</span>
            <span className="w-5" />
          </span>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          {POPULAR.map((track, i) => (
            <div
              key={track.rank}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 group transition-all border border-transparent hover:border-white/5 cursor-pointer"
            >
              {/* Rank / play */}
              <span className="w-8 text-center text-slate-500 group-hover:hidden tabular-nums">
                {track.rank}
              </span>
              <button
                aria-label={`Play ${track.title}`}
                className="w-8 text-center text-primary hidden group-hover:flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>

              {/* Thumbnail */}
              <div
                aria-hidden="true"
                className={`size-14 flex-shrink-0 rounded-lg border border-white/5 bg-gradient-to-br shadow-2xl ${RECOMMENDED[i % RECOMMENDED.length].color}`}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white group-hover:text-primary transition-colors truncate">
                  {track.title}
                </p>
                <p className="text-sm text-slate-400 truncate">
                  {track.artist}
                </p>
              </div>

              {/* Album */}
              <p className="hidden md:block text-sm text-slate-400 truncate w-36">
                {track.album}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-6 flex-shrink-0">
                <button
                  aria-label={track.liked ? "Unlike" : "Like"}
                  aria-pressed={track.liked}
                  className={`transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-full ${track.liked ? "text-primary" : "text-slate-500 hover:text-primary"}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill={track.liked ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
                <span className="text-sm text-slate-400 w-12 text-right tabular-nums">
                  {track.duration}
                </span>
                <button
                  aria-label="More options"
                  className="text-slate-500 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 5c-.828 0-1.5-.672-1.5-1.5S11.172 2 12 2s1.5.672 1.5 1.5S12.828 5 12 5zm0 7c-.828 0-1.5-.672-1.5-1.5S11.172 10.5 12 10.5s1.5.672 1.5 1.5S12.828 12 12 12zm0 7c-.828 0-1.5-.672-1.5-1.5S11.172 17 12 17s1.5.672 1.5 1.5S12.828 19 12 19z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
