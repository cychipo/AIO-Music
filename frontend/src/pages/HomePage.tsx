import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { usePlayerStore } from "../store/playerStore";
import {
  useTrending,
  trendingTrackToPlayable,
  formatDuration,
} from "../hooks/useTrending";
import { TrendingTrack } from "../types";

// ─── Platform badge config ───────────────────────────────────────────────────

const PLATFORM_BADGE: Record<
  TrendingTrack["source"],
  { label: string; cls: string; icon: JSX.Element }
> = {
  youtube: {
    label: "YouTube",
    cls: "bg-red-600/25 text-red-400 border border-red-500/30",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z" />
      </svg>
    ),
  },
  spotify: {
    label: "Spotify",
    cls: "bg-green-600/25 text-green-400 border border-green-500/30",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.7 0 12 0zm5.5 17.3c-.2.4-.7.5-1 .3-2.8-1.7-6.4-2.1-10.6-1.1-.4.1-.8-.2-.9-.5-.1-.4.2-.8.5-.9 4.6-1 8.5-.6 11.6 1.3.4.2.5.7.4 1zm1.5-3.3c-.3.4-.8.6-1.3.3-3.2-2-8.1-2.6-11.9-1.4-.5.1-1-.1-1.1-.6-.1-.5.1-1 .6-1.1 4.3-1.3 9.7-.7 13.3 1.6.4.3.6.8.4 1.2zm.1-3.4c-3.9-2.3-10.2-2.5-13.9-1.4-.6.2-1.2-.2-1.4-.7-.2-.6.2-1.2.7-1.4C7.9 5.7 14.8 6 19.2 8.6c.5.3.7 1 .4 1.5-.3.5-1 .7-1.5.5z" />
      </svg>
    ),
  },
  soundcloud: {
    label: "SoundCloud",
    cls: "bg-orange-500/25 text-orange-400 border border-orange-500/30",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M0 15.5a.5.5 0 0 0 1 0v-5a.5.5 0 0 0-1 0v5zm1.5 1a.5.5 0 0 0 1 0v-7a.5.5 0 0 0-1 0v7zm1.5.5a.5.5 0 0 0 1 0V12a.5.5 0 0 0-1 0v5zm1.5.5a.5.5 0 0 0 1 0v-6a.5.5 0 0 0-1 0v6zm5.5-10C9.5 5 8 6.5 8 8.2c0 .1 0 .2.01.3A3 3 0 0 0 6 11.5a3 3 0 0 0 3 3h7a2.5 2.5 0 0 0 2.5-2.5c0-1.2-.8-2.2-2-2.5V9a4.5 4.5 0 0 0-7.5-1z" />
      </svg>
    ),
  },
};

// ─── Card skeleton ────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface-dark border border-white/5 animate-pulse">
      <div className="aspect-square mb-4 rounded-xl bg-white/10" />
      <div className="h-3.5 bg-white/10 rounded w-4/5 mb-2" />
      <div className="h-3 bg-white/8 rounded w-3/5 mb-3" />
      <div className="h-5 bg-white/6 rounded-full w-20" />
    </div>
  );
}

// ─── Track card ───────────────────────────────────────────────────────────────

interface TrackCardProps {
  track: TrendingTrack;
  queue: TrendingTrack[];
  isCurrentTrack: boolean;
  isPlaying: boolean;
}

function TrackCard({ track, queue, isCurrentTrack, isPlaying }: TrackCardProps) {
  const play = usePlayerStore((s) => s.play);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const badge = PLATFORM_BADGE[track.source];

  const handlePlay = () => {
    if (isCurrentTrack) { togglePlay(); return; }
    const playable = trendingTrackToPlayable(track);
    const playableQueue = queue.map(trendingTrackToPlayable);
    play(playable, playableQueue);
  };

  return (
    <article
      onClick={handlePlay}
      className={`
        group relative p-4 sm:p-5 rounded-2xl border cursor-pointer
        transition-all duration-200
        ${isCurrentTrack
          ? "bg-primary/10 border-primary/30"
          : "bg-surface-dark hover:bg-surface-dark-light border-white/5 hover:border-white/10"
        }
      `}
    >
      {/* Rank badge — top-left */}
      <span className="absolute top-3 left-3 z-10 text-xs font-bold tabular-nums text-slate-500 bg-black/40 rounded px-1.5 py-0.5">
        #{track.rank}
      </span>

      {/* Thumbnail / artwork */}
      <div className="relative aspect-square mb-4 rounded-xl overflow-hidden shadow-2xl">
        {track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>
        )}

        {/* Play button overlay */}
        <button
          aria-label={isCurrentTrack && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          className="
            absolute bottom-2 right-2 size-11 rounded-full
            bg-gradient-to-br from-primary to-accent-amber text-white shadow-xl
            opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0
            transition-all duration-200 flex items-center justify-center
            hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
          "
        >
          {isCurrentTrack && isPlaying ? (
            // Pause icon
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Playing indicator overlay */}
        {isCurrentTrack && isPlaying && (
          <div className="absolute inset-0 bg-primary/10 flex items-end justify-start p-2 pointer-events-none">
            <span className="flex items-end gap-px h-5">
              {[60, 100, 40, 80, 60].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-primary rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"
                  style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }}
                />
              ))}
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className={`
        font-bold text-sm leading-tight mb-1 truncate transition-colors
        ${isCurrentTrack ? "text-primary" : "text-white group-hover:text-primary"}
      `}>
        {track.title}
      </h3>

      {/* Artist */}
      <p className="text-xs text-slate-400 truncate mb-3">{track.artist}</p>

      {/* Footer: platform badge + duration */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
          {badge.icon}
          {badge.label}
        </span>
        {track.duration > 0 && (
          <span className="text-xs text-slate-600 tabular-nums">
            {formatDuration(track.duration)}
          </span>
        )}
      </div>
    </article>
  );
}

// ─── HomePage ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const status = usePlayerStore((s) => s.status);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const { data, isLoading, refetch } = useTrending(10);

  // Gộp cả 3 nguồn thành 1 mảng phẳng, xen kẽ (1 YT, 1 SP, 1 SC...)
  // để homepage trông đa dạng chứ không bị lặp nguồn
  const allTracks: TrendingTrack[] = (() => {
    if (!data) return [];
    const yt = data.youtube;
    const sp = data.spotify;
    const sc = data.soundcloud;
    const merged: TrendingTrack[] = [];
    const len = Math.max(yt.length, sp.length, sc.length);
    for (let i = 0; i < len; i++) {
      if (yt[i]) merged.push(yt[i]);
      if (sp[i]) merged.push(sp[i]);
      if (sc[i]) merged.push(sc[i]);
    }
    return merged;
  })();

  const isCurrentTrackFn = (track: TrendingTrack) => {
    if (!currentTrack) return false;
    const ctId = "id" in currentTrack ? currentTrack.id : (currentTrack as any)._id;
    const ctYtId = (currentTrack as any).youtubeId;
    return (
      ctId === (track.youtubeId || track.id) ||
      (ctYtId && ctYtId === track.youtubeId)
    );
  };

  return (
    <div className="font-sans">
      {/* ── Hero Banner ── */}
      <section className="mb-8 sm:mb-12">
        <div className="relative h-[220px] sm:h-[280px] lg:h-[340px] w-full rounded-2xl sm:rounded-[2.5rem] overflow-hidden group border border-white/5">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, #121212 0%, rgba(18,18,18,0.85) 35%, rgba(100,30,80,0.55) 65%, rgba(140,40,110,0.75) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 75% 50%, rgba(180,60,140,0.45) 0%, transparent 60%), radial-gradient(ellipse at 90% 80%, rgba(255,111,0,0.12) 0%, transparent 40%)",
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden opacity-40"
            aria-hidden="true"
          >
            <div className="absolute top-1/3 right-1/4 w-px h-32 rotate-[20deg] bg-gradient-to-b from-transparent via-purple-400 to-transparent blur-[1px]" />
            <div className="absolute top-1/4 right-1/3 w-px h-48 rotate-[-15deg] bg-gradient-to-b from-transparent via-pink-300 to-transparent blur-[1px]" />
            <div className="absolute top-1/2 right-1/6 w-px h-24 rotate-[35deg] bg-gradient-to-b from-transparent via-purple-300 to-transparent blur-[2px]" />
          </div>
          <div
            className="absolute inset-0 transition-transform duration-1000 group-hover:scale-105 rounded-[2.5rem]"
            style={{
              background:
                "radial-gradient(ellipse at 80% 50%, rgba(100,30,90,0.3) 0%, transparent 70%)",
            }}
          />

          <div
            className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10 lg:p-16"
            style={{ paddingTop: "16px" }}
          >
            <span className="flex items-center gap-2 text-accent-gold font-bold text-xs uppercase tracking-[0.3em] mb-4">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {user ? `${greeting}, ${user.displayName}` : "Trending Now"}
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-3 sm:mb-5 lg:mb-6 drop-shadow-2xl tracking-tighter leading-none">
              All Your Music,
              <br />
              <span className="text-primary">One Place.</span>
            </h1>

            <p className="hidden sm:block text-slate-300 max-w-md mb-6 lg:mb-10 text-sm lg:text-lg font-light leading-relaxed">
              Stream from YouTube, Spotify & SoundCloud — all without switching apps.
            </p>

            <div className="flex gap-3">
              <Link to="/search">
                <button className="px-5 sm:px-8 lg:px-10 py-3 sm:py-4 bg-gradient-to-r from-primary to-accent-amber text-white font-bold rounded-full flex items-center gap-2 hover:scale-105 transition-all shadow-2xl shadow-primary/40 text-sm sm:text-base">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Listen Now
                </button>
              </Link>
              <button
                onClick={refetch}
                className="px-5 sm:px-8 lg:px-10 py-3 sm:py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold rounded-full hover:bg-white/20 transition-all text-sm sm:text-base"
              >
                Top Charts
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trending Charts ── */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Trending Now
          </h2>
          <Link
            to="/search"
            className="text-sm font-bold text-slate-400 hover:text-primary transition-colors flex items-center gap-1"
          >
            See all
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-5 lg:gap-6">
            {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : allTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-base font-medium">No trending data available</p>
            <button
              onClick={refetch}
              className="mt-1 text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-5 lg:gap-6">
            {allTracks.map((track) => (
              <TrackCard
                key={`${track.source}-${track.id}`}
                track={track}
                queue={allTracks}
                isCurrentTrack={isCurrentTrackFn(track)}
                isPlaying={status === "playing"}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
