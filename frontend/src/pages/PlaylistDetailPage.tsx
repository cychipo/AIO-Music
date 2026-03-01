import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Popconfirm } from 'antd';
import { usePlaylistStore } from '../store/playlistStore';
import { usePlayerStore } from '../store/playerStore';
import { playlistApi } from '../lib/apiClient';
import type { Track, Playlist } from '../types';

/* ── Utils ── */
function formatDuration(seconds: number | undefined | null): string {
  const s = Math.floor((seconds ?? 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (s <= 0) return '—';
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

/* ── Icons ── */
function IconArrowLeft() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function IconPause() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
function IconMusic() {
  return (
    <svg className="w-8 h-8 text-white/40" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

/* ── Track row ── */
interface TrackRowProps {
  track: Track;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
}
function TrackRow({ track, index, isPlaying, onPlay, onRemove }: TrackRowProps) {
  return (
    <div
      className={`group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer ${
        isPlaying ? 'bg-primary/10 border border-primary/20' : ''
      }`}
      onClick={onPlay}
    >
      {/* Index / play indicator */}
      <div className="w-6 flex-shrink-0 flex items-center justify-center">
        {isPlaying ? (
          <span className="text-primary text-xs font-bold">▶</span>
        ) : (
          <span className="text-slate-500 text-sm font-medium group-hover:hidden">{index + 1}</span>
        )}
        {!isPlaying && (
          <span className="hidden group-hover:flex text-white">
            <IconPlay />
          </span>
        )}
      </div>

      {/* Thumbnail */}
      <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
        {track.thumbnail ? (
          <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <IconMusic />
        )}
      </div>

      {/* Title + artist */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${isPlaying ? 'text-primary' : 'text-white'}`}>
          {track.title}
        </p>
        <p className="text-xs text-slate-400 truncate">{track.artist}</p>
      </div>

      {/* Album */}
      <p className="hidden md:block text-sm text-slate-400 truncate max-w-[160px]">
        {track.album ?? '—'}
      </p>

      {/* Duration */}
      <p className="text-sm text-slate-400 font-medium flex-shrink-0 ml-4">
        {formatDuration(track.duration)}
      </p>

      {/* Remove */}
      <Popconfirm
        title="Xoá bài hát này khỏi playlist?"
        okText="Xoá"
        cancelText="Huỷ"
        okButtonProps={{ danger: true }}
        onConfirm={(e) => { e?.stopPropagation(); onRemove(); }}
        onCancel={(e) => e?.stopPropagation()}
      >
        <button
          onClick={(e) => e.stopPropagation()}
          title="Xoá khỏi playlist"
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
        >
          <IconTrash />
        </button>
      </Popconfirm>
    </div>
  );
}

/* ── PlaylistDetailPage ── */
export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { removeTrack } = usePlaylistStore();
  const { play, currentTrack, status } = usePlayerStore();

  // Fetch playlist trực tiếp từ API để luôn có tracks đã populate
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setFetchError('');
    playlistApi.getById(id)
      .then((res) => setPlaylist(res.data as Playlist))
      .catch(() => setFetchError('Không thể tải playlist.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError || !playlist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-slate-400">{fetchError || 'Playlist không tìm thấy.'}</p>
        <button
          onClick={() => navigate('/library')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
        >
          <IconArrowLeft />
          Quay lại thư viện
        </button>
      </div>
    );
  }

  const tracks = playlist.tracks;
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0);
  const totalMin = Math.floor(totalDuration / 60);

  function handlePlayAll() {
    if (tracks.length === 0) return;
    play(tracks[0], tracks);
  }

  function getCurrentTrackId(): string | null {
    if (!currentTrack) return null;
    return '_id' in currentTrack ? (currentTrack as Track)._id : null;
  }

  const playingTrackId = getCurrentTrackId();
  const isThisPlaylistPlaying = status === 'playing' && tracks.some((t) => t._id === playingTrackId);

  async function handleRemoveTrack(trackId: string) {
    await removeTrack(playlist!._id, trackId);
    // Re-fetch để cập nhật local state sau khi xoá
    try {
      const res = await playlistApi.getById(id!);
      setPlaylist(res.data as Playlist);
    } catch {
      // Nếu fetch lỗi, xoá track khỏi local state thủ công
      setPlaylist((prev) =>
        prev ? { ...prev, tracks: prev.tracks.filter((t) => t._id !== trackId) } : prev
      );
    }
  }

  return (
    <div className="min-h-full">
      {/* ── Back button ── */}
      <Link
        to="/library"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
      >
        <IconArrowLeft />
        Thư viện
      </Link>

      {/* ── Hero ── */}
      <div className="flex items-end gap-6 sm:gap-8 py-6 mb-8">
        {/* Cover */}
        <div className="w-40 h-40 sm:w-52 sm:h-52 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
          {playlist.thumbnail ? (
            <img src={playlist.thumbnail} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/70 to-amber-500/50 flex items-center justify-center">
              <svg className="w-16 h-16 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-2 min-w-0">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            {playlist.isPublic ? 'Playlist công khai' : 'Playlist riêng tư'}
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-sm text-slate-400 line-clamp-2">{playlist.description}</p>
          )}
          <p className="text-sm text-slate-400 mt-1">
            <span className="font-semibold text-white">{tracks.length}</span> bài ·{' '}
            {totalMin} phút
          </p>

          {/* Play all button */}
          {tracks.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="mt-3 flex items-center gap-3 w-fit px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-all hover:scale-105 shadow-lg shadow-primary/30"
            >
              {isThisPlaylistPlaying ? <IconPause /> : <IconPlay />}
              {isThisPlaylistPlaying ? 'Đang phát' : 'Phát tất cả'}
            </button>
          )}
        </div>
      </div>

      {/* ── Track list ── */}
      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <IconMusic />
          </div>
          <p className="text-base font-semibold">Playlist trống</p>
          <p className="text-sm mt-1">Thêm bài hát vào playlist này từ trang tìm kiếm.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {/* Table header */}
          <div className="flex items-center gap-4 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-white/5 mb-2">
            <div className="w-6">#</div>
            <div className="w-10" />
            <div className="flex-1">Tiêu đề</div>
            <div className="hidden md:block max-w-[160px] w-[160px]">Album</div>
            <div className="ml-4 w-12 text-right">Thời lượng</div>
            <div className="w-8" />
          </div>

          {tracks.map((track, i) => (
            <TrackRow
              key={track._id}
              track={track}
              index={i}
              isPlaying={status === 'playing' && playingTrackId === track._id}
              onPlay={() => play(track, tracks)}
              onRemove={() => handleRemoveTrack(track._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
