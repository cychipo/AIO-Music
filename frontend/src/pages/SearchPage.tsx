import { useRef, useEffect, useState } from "react";
import { useSearchStore } from "../store/searchStore";
import { usePlayerStore } from "../store/playerStore";
import { usePlaylistStore } from "../store/playlistStore";
import { useAuthStore } from "../store/authStore";
import { SearchResult } from "../types";
import type { AddTrackPayload } from "../lib/apiClient";

/* ── Icons ── */
function IconSearch() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
function IconClose() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function IconPause() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}
function IconDots() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}

/* ── Platform badge ── */
const SOURCE_BADGE: Record<string, { cls: string; label: string }> = {
  youtube: {
    cls: "bg-red-500/20 text-red-400 border border-red-500/30",
    label: "YouTube",
  },
  spotify: {
    cls: "bg-green-500/20 text-green-400 border border-green-500/30",
    label: "Spotify",
  },
  soundcloud: {
    cls: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    label: "SoundCloud",
  },
};

/* ── Format duration ── */
function fmt(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Track row ── */
interface TrackRowProps {
  track: SearchResult;
  index: number;
  isPlaying: boolean;
  isCurrentTrack: boolean;
  onPlay: () => void;
}
function TrackRow({
  track,
  index,
  isPlaying,
  isCurrentTrack,
  onPlay,
}: TrackRowProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openAddToPlaylist = usePlaylistStore((s) => s.openAddToPlaylist);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const badge = SOURCE_BADGE[track.source] ?? SOURCE_BADGE.youtube;

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Build AddTrackPayload đầy đủ — SearchResult.id là sourceId
  const trackPayload: AddTrackPayload = {
    title: track.title,
    artist: track.artist,
    thumbnail: track.thumbnail,
    duration: track.duration,
    sourceId: track.id,
    source: track.source,
    youtubeId: track.youtubeId,
    url: track.url,
  };

  return (
    <div
      className={`group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl transition-all cursor-pointer ${
        isCurrentTrack
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-white/5 border border-transparent"
      }`}
      onClick={onPlay}
    >
      {/* Index */}
      <div className="w-5 flex-shrink-0 text-center">
        {isCurrentTrack && isPlaying ? (
          <span className="text-primary text-xs">▶</span>
        ) : (
          <span className="text-slate-500 text-sm group-hover:hidden">
            {index + 1}
          </span>
        )}
        {!isCurrentTrack && (
          <span className="hidden group-hover:inline text-white">
            {isPlaying ? <IconPause /> : <IconPlay />}
          </span>
        )}
      </div>

      {/* Thumbnail */}
      <img
        src={track.thumbnail || "https://via.placeholder.com/48"}
        alt={track.title}
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover flex-shrink-0 shadow"
      />

      {/* Title + artist */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-semibold text-sm truncate ${isCurrentTrack ? "text-primary" : "text-white"}`}
        >
          {track.title}
        </p>
        <p className="text-xs text-slate-400 truncate">{track.artist}</p>
      </div>

      {/* Source badge */}
      <span
        className={`hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls} flex-shrink-0`}
      >
        {badge.label}
      </span>

      {/* Duration */}
      {track.duration > 0 && (
        <span className="text-xs text-slate-500 tabular-nums flex-shrink-0 hidden sm:block">
          {fmt(track.duration)}
        </span>
      )}

      {/* 3-dot menu — chỉ khi đã đăng nhập */}
      {isAuthenticated && (
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Thêm tùy chọn"
          >
            <IconDots />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-44 bg-[#1e140b] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/8 transition-colors text-left"
                onClick={() => {
                  openAddToPlaylist(trackPayload);
                  setMenuOpen(false);
                }}
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Thêm vào playlist
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── SearchPage ── */
export default function SearchPage() {
  const {
    query,
    results,
    isLoading,
    isLoadingMore,
    activeSource,
    searchLimit,
    setQuery,
    setSource,
    search,
    loadMoreSearch,
  } = useSearchStore();
  const { play, currentTrack, status } = usePlayerStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Force activeSource to be one of the 3 specific tabs, default 'youtube'
  useEffect(() => {
    if ((activeSource as any) === "all") {
      setSource("youtube");
    }
  }, [activeSource, setSource]);

  const currentTab = (activeSource as any) === "all" ? "youtube" : activeSource;

  function getCurrentTrackId() {
    if (!currentTrack) return null;
    return "id" in currentTrack
      ? (currentTrack as SearchResult).id
      : (currentTrack as any)._id;
  }
  const playingId = getCurrentTrackId();

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") search(query, true);
  }

  function handleTabClick(platform: "youtube" | "spotify" | "soundcloud") {
    if (platform === activeSource) return;
    setSource(platform);
    if (query.trim()) {
      search(query, true);
    }
  }

  // Handle infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const { hasMore } = useSearchStore.getState();
        if (
          entries[0].isIntersecting &&
          results[currentTab].length > 0 &&
          !isLoading &&
          !isLoadingMore &&
          hasMore[currentTab]
        ) {
          loadMoreSearch();
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [
    results,
    currentTab,
    searchLimit,
    isLoading,
    isLoadingMore,
    loadMoreSearch,
  ]);

  const PLATFORM_BADGE: Record<string, { cls: string; icon: JSX.Element }> = {
    youtube: {
      cls: "bg-red-500/20 text-red-500",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
        </svg>
      ),
    },
    spotify: {
      cls: "bg-green-500/20 text-green-500",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.561 17.38c-.33 0-.66-.128-.888-.356-4.52-4.522-10.375-3.856-10.596-3.829-.538.066-1.026-.315-1.092-.852-.066-.539.316-1.027.854-1.093.5-.06 7.152-.861 12.608 4.59.35.352.348.919-.004 1.267-.23.23-.553.352-.882.352m-.867-2.914c-.333 0-.666-.128-.894-.356-5.83-5.832-13.314-4.895-13.567-4.86-.54.072-1.042-.303-1.114-.843-.071-.54.302-1.043.842-1.114.619-.082 8.783-1.134 15.626 5.707.35.352.348.919-.004 1.267-.229.231-.552.353-.882.353v-.006zm.738-3.085c-.328 0-.656-.126-.884-.352-7.07-7.069-15.932-5.895-16.22-5.854-.543.076-1.045-.302-1.121-.845-.076-.542.301-1.046.844-1.123.701-.098 10.334-1.385 18.261 6.541.352.354.35.925-.004 1.277-.23.23-.556.356-.888.356h.012z" />
        </svg>
      ),
    },
    soundcloud: {
      cls: "bg-orange-500/20 text-orange-500",
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10.198 17h-.543v-8.156l.543-.543v8.699zm1.319 0h-.542v-9.522l.542-.544v10.066zm1.317 0h-.542v-11.163l.542-.543v11.706zm1.319 0h-.542v-10.891l.542-.424v11.315zm1.32 0h-.543v-9.522l.543-.225v9.747zm7.527-3.957c0 2.185-1.782 3.957-3.972 3.957h-3.328v-8.831c1.378-1.558 3.39-2.541 5.627-2.541 3.253 0 6 2.112 6.703 5.06h-1.058c.018.115.028.232.028.355zm-14.78-4.735l.541.529v8.163h-.541v-8.692zm-1.879 1.107l.543.518v7.585h-.543v-8.103zm-1.879 1.487l.543.498v6.616h-.543v-7.114zm-1.876 1.764l.541.458v5.35h-.541v-5.808zM1.88 14.36l.543.375v4.542H1.88v-4.917zM0 15.655l.542.413v3.21H0v-3.623z" />
        </svg>
      ),
    },
  };

  // Only render results matching the current tab
  const filteredResults =
    results[currentTab as "youtube" | "spotify" | "soundcloud"] || [];

  return (
    <div className="pb-12 h-full flex flex-col">
      <h1 className="text-2xl sm:text-3xl font-black text-white mb-6 flex-shrink-0">
        Tìm kiếm
      </h1>

      {/* Search input */}
      <div className="relative mb-6 w-full flex-shrink-0">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <IconSearch />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tìm bài hát, nghệ sĩ, album..."
          className="w-full bg-white/5 border border-white/10 rounded-[10px] pl-12 pr-12 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <IconClose />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 sm:gap-3 bg-white/5 p-1 rounded-full border border-white/10 overflow-x-auto hide-scrollbar mb-6 w-max flex-shrink-0">
        {(["youtube", "spotify", "soundcloud"] as const).map((platform) => (
          <button
            key={platform}
            onClick={() => handleTabClick(platform)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize whitespace-nowrap
              ${
                currentTab === platform
                  ? `bg-white/10 text-white shadow-lg`
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }
            `}
          >
            <span
              className={
                PLATFORM_BADGE[platform].cls
                  .replace("bg-", "text-")
                  .split(" ")[1]
              }
            >
              {PLATFORM_BADGE[platform].icon}
            </span>
            {platform}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3 rounded-2xl animate-pulse"
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3.5 bg-white/10 rounded w-3/5 mb-2" />
                <div className="h-3 bg-white/8 rounded w-2/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading &&
        !isLoadingMore &&
        query &&
        filteredResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <svg
              className="w-14 h-14 mb-4 opacity-30"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-base font-semibold">Không tìm thấy kết quả</p>
            <p className="text-sm mt-1">
              Đảm bảo từ khóa đúng hoặc thử từ khác.
            </p>
          </div>
        )}

      {/* Empty state — no query yet */}
      {!isLoading && !query && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600">
          <svg
            className="w-14 h-14 mb-4 opacity-30"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
          </svg>
          <p className="text-base font-semibold">Tìm bài nhạc yêu thích</p>
          <p className="text-sm mt-1">Nhập từ khoá và nhấn Enter để tìm.</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && filteredResults.length > 0 && (
        <div className="flex flex-col gap-1 flex-1 pb-10">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
            Kết quả trên {currentTab}
          </p>
          {filteredResults.map((track, i) => (
            <TrackRow
              key={`${track.source}-${track.id}-${i}`}
              track={track}
              index={i}
              isCurrentTrack={playingId === track.id}
              isPlaying={status === "playing"}
              onPlay={() => play(track, filteredResults)}
            />
          ))}

          {/* Observer target */}
          <div
            ref={observerTarget}
            className="h-10 w-full bg-transparent flex items-center justify-center my-4"
          >
            {isLoadingMore ? (
              <svg
                className="w-6 h-6 animate-spin text-primary"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <span className="text-xs text-slate-500">Đang tải thêm...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
