import { useState } from 'react';
import { usePlaylistStore } from '../store/playlistStore';
import type { Playlist } from '../types';

/* ── Icons ── */
function IconClose() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
function IconMusic() {
  return (
    <svg className="w-6 h-6 text-white/40" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

/* ── Modal ── */
export default function AddToPlaylistModal() {
  const {
    pendingTrack,
    playlists,
    isLoading,
    closeAddToPlaylist,
    addTrack,
    createPlaylist,
  } = usePlaylistStore();

  const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null);
  const [addedPlaylistIds, setAddedPlaylistIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState('');

  // Tạo playlist nhanh
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  if (!pendingTrack) return null;

  async function handleAddToPlaylist(playlist: Playlist) {
    if (!pendingTrack) return;

    // "Đã có" nếu sourceId của track khớp với sourceId của bất kỳ track nào trong playlist
    const alreadyIn = playlist.tracks.some((t) => t.sourceId === pendingTrack.sourceId);
    if (alreadyIn || addedPlaylistIds.has(playlist._id)) return;

    setLoadingPlaylistId(playlist._id);
    setErrorMsg('');
    try {
      await addTrack(playlist._id, pendingTrack);
      setAddedPlaylistIds((prev) => new Set(prev).add(playlist._id));
    } catch {
      setErrorMsg('Thêm vào playlist thất bại. Vui lòng thử lại.');
    } finally {
      setLoadingPlaylistId(null);
    }
  }

  async function handleQuickCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !pendingTrack) return;
    setCreating(true);
    setErrorMsg('');
    try {
      const created = await createPlaylist({ name: newName.trim() });
      await addTrack(created._id, pendingTrack);
      setAddedPlaylistIds((prev) => new Set(prev).add(created._id));
      setNewName('');
      setShowQuickCreate(false);
    } catch {
      setErrorMsg('Tạo playlist thất bại. Vui lòng thử lại.');
    } finally {
      setCreating(false);
    }
  }

  function isAdded(playlist: Playlist): boolean {
    if (!pendingTrack) return false;
    return (
      addedPlaylistIds.has(playlist._id) ||
      playlist.tracks.some((t) => t.sourceId === pendingTrack.sourceId)
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={closeAddToPlaylist}
    >
      <div
        className="relative w-full max-w-sm mx-4 bg-[#1e140b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="min-w-0">
            <h2 className="font-bold text-base">Thêm vào playlist</h2>
            <p className="text-xs text-slate-400 truncate mt-0.5">{pendingTrack.title}</p>
          </div>
          <button
            onClick={closeAddToPlaylist}
            className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors ml-2"
          >
            <IconClose />
          </button>
        </div>

        {/* Playlist list */}
        <div className="max-h-72 overflow-y-auto px-3 py-2">
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && playlists.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">
              Chưa có playlist nào. Hãy tạo mới bên dưới.
            </p>
          )}

          {!isLoading &&
            playlists.map((playlist) => {
              const added = isAdded(playlist);
              const loading = loadingPlaylistId === playlist._id;
              return (
                <button
                  key={playlist._id}
                  onClick={() => handleAddToPlaylist(playlist)}
                  disabled={added || loading}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    added
                      ? 'opacity-60 cursor-default'
                      : 'hover:bg-white/8 cursor-pointer'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                    {playlist.thumbnail ? (
                      <img
                        src={playlist.thumbnail}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/50 to-amber-500/30 flex items-center justify-center">
                        <IconMusic />
                      </div>
                    )}
                  </div>

                  {/* Name + count */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-white">{playlist.name}</p>
                    <p className="text-xs text-slate-400">{playlist.tracks.length} bài</p>
                  </div>

                  {/* Status indicator */}
                  <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : added ? (
                      <span className="text-primary">
                        <IconCheck />
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        <IconPlus />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
        </div>

        {errorMsg && (
          <p className="text-red-400 text-xs px-5 pb-2">{errorMsg}</p>
        )}

        {/* Quick create */}
        <div className="border-t border-white/10 px-5 py-4">
          {showQuickCreate ? (
            <form onSubmit={handleQuickCreate} className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Tên playlist mới"
                autoFocus
                maxLength={100}
                className="flex-1 bg-white/5 border border-white/10 rounded-[10px] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="px-4 py-2 rounded-[10px] bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {creating ? '...' : 'Tạo'}
              </button>
              <button
                type="button"
                onClick={() => setShowQuickCreate(false)}
                className="px-3 py-2 rounded-[10px] hover:bg-white/10 text-slate-400 text-xs transition-colors"
              >
                Huỷ
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowQuickCreate(true)}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <IconPlus />
              Tạo playlist mới
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
