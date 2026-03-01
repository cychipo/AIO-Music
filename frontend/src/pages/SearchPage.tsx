import { useRef, useEffect, useState } from 'react';
import { useSearchStore } from '../store/searchStore';
import { usePlayerStore } from '../store/playerStore';
import { usePlaylistStore } from '../store/playlistStore';
import { useAuthStore } from '../store/authStore';
import { SearchResult } from '../types';
import type { AddTrackPayload } from '../lib/apiClient';

/* ── Icons ── */
function IconSearch() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
  youtube:    { cls: 'bg-red-500/20 text-red-400 border border-red-500/30',    label: 'YouTube'    },
  spotify:    { cls: 'bg-green-500/20 text-green-400 border border-green-500/30', label: 'Spotify' },
  soundcloud: { cls: 'bg-orange-500/20 text-orange-400 border border-orange-500/30', label: 'SoundCloud' },
};

/* ── Format duration ── */
function fmt(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ── Track row ── */
interface TrackRowProps {
  track: SearchResult;
  index: number;
  isPlaying: boolean;
  isCurrentTrack: boolean;
  onPlay: () => void;
}
function TrackRow({ track, index, isPlaying, isCurrentTrack, onPlay }: TrackRowProps) {
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
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  // Build AddTrackPayload đầy đủ — SearchResult.id là sourceId
  const trackPayload: AddTrackPayload = {
    title:     track.title,
    artist:    track.artist,
    thumbnail: track.thumbnail,
    duration:  track.duration,
    sourceId:  track.id,
    source:    track.source,
    youtubeId: track.youtubeId,
    url:       track.url,
  };

  return (
    <div
      className={`group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl transition-all cursor-pointer ${
        isCurrentTrack
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-white/5 border border-transparent'
      }`}
      onClick={onPlay}
    >
      {/* Index */}
      <div className="w-5 flex-shrink-0 text-center">
        {isCurrentTrack && isPlaying ? (
          <span className="text-primary text-xs">▶</span>
        ) : (
          <span className="text-slate-500 text-sm group-hover:hidden">{index + 1}</span>
        )}
        {!isCurrentTrack && (
          <span className="hidden group-hover:inline text-white">
            {isPlaying ? <IconPause /> : <IconPlay />}
          </span>
        )}
      </div>

      {/* Thumbnail */}
      <img
        src={track.thumbnail || 'https://via.placeholder.com/48'}
        alt={track.title}
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover flex-shrink-0 shadow"
      />

      {/* Title + artist */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${isCurrentTrack ? 'text-primary' : 'text-white'}`}>
          {track.title}
        </p>
        <p className="text-xs text-slate-400 truncate">{track.artist}</p>
      </div>

      {/* Source badge */}
      <span className={`hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls} flex-shrink-0`}>
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
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
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
                onClick={() => { openAddToPlaylist(trackPayload); setMenuOpen(false); }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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
  const { query, results, isLoading, setQuery, search } = useSearchStore();
  const { play, currentTrack, status } = usePlayerStore();
  const inputRef = useRef<HTMLInputElement>(null);

  function getCurrentTrackId() {
    if (!currentTrack) return null;
    return 'id' in currentTrack ? (currentTrack as SearchResult).id : (currentTrack as any)._id;
  }
  const playingId = getCurrentTrackId();

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') search();
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-black text-white mb-6">Tìm kiếm</h1>

      {/* Search input */}
      <div className="relative mb-6 max-w-2xl">
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
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <IconClose />
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-2xl animate-pulse">
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
      {!isLoading && results.length === 0 && query && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <svg className="w-14 h-14 mb-4 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-base font-semibold">Không tìm thấy kết quả</p>
          <p className="text-sm mt-1">Thử tìm với từ khoá khác.</p>
        </div>
      )}

      {/* Empty state — no query yet */}
      {!isLoading && results.length === 0 && !query && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600">
          <svg className="w-14 h-14 mb-4 opacity-30" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
          </svg>
          <p className="text-base font-semibold">Tìm bài nhạc yêu thích</p>
          <p className="text-sm mt-1">Nhập từ khoá và nhấn Enter để tìm.</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            {results.length} kết quả
          </p>
          {results.map((track, i) => (
            <TrackRow
              key={`${track.source}-${track.id}`}
              track={track}
              index={i}
              isCurrentTrack={playingId === track.id}
              isPlaying={status === 'playing'}
              onPlay={() => play(track, results)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
