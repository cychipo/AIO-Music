import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popconfirm } from 'antd';
import { usePlaylistStore } from '../store/playlistStore';
import type { Playlist } from '../types';

/* ── Icons ── */
function IconMusic() {
  return (
    <svg className="w-12 h-12 text-white/60" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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
function IconClose() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

/* ── Create Playlist Modal ── */
interface CreateModalProps {
  onClose: () => void;
  onCreate: (name: string, description: string, isPublic: boolean) => Promise<void>;
}
function CreatePlaylistModal({ onClose, onCreate }: CreateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Tên playlist không được để trống'); return; }
    setLoading(true);
    setError('');
    try {
      await onCreate(name.trim(), description.trim(), isPublic);
      onClose();
    } catch {
      setError('Tạo playlist thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4 bg-[#221810] border border-white/10 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Tạo playlist mới</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <IconClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Tên */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Tên playlist *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Playlist"
              maxLength={100}
              className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors"
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về playlist này..."
              rows={3}
              maxLength={300}
              className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors resize-none"
            />
          </div>

          {/* Public toggle */}
          <label className="flex items-center justify-between cursor-pointer py-2">
            <div>
              <p className="text-sm font-semibold">Công khai</p>
              <p className="text-xs text-slate-400">Mọi người có thể tìm kiếm và nghe playlist này</p>
            </div>
            <div
              onClick={() => setIsPublic((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${isPublic ? 'bg-primary' : 'bg-white/20'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isPublic ? 'left-7' : 'left-1'}`} />
            </div>
          </label>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang tạo...' : 'Tạo playlist'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Playlist Card ── */
interface PlaylistCardProps {
  playlist: Playlist;
  onDelete: (id: string) => void;
}
function PlaylistCard({ playlist, onDelete }: PlaylistCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="group relative bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all border border-white/5 hover:border-white/10 cursor-pointer"
      onClick={() => navigate(`/library/playlist/${playlist._id}`)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square mb-4 rounded-xl overflow-hidden">
        {playlist.thumbnail ? (
          <img
            src={playlist.thumbnail}
            alt={playlist.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/60 to-amber-500/40 flex items-center justify-center">
            <IconMusic />
          </div>
        )}
        {/* Play button on hover */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-3 right-3 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-110 hover:bg-primary/90"
          aria-label={`Phát ${playlist.name}`}
        >
          <IconPlay />
        </button>
      </div>

      {/* Info */}
      <h4 className="font-bold text-sm truncate text-white">{playlist.name}</h4>
      <p className="text-xs text-slate-400 truncate mt-0.5">
        {playlist.tracks.length} bài · {playlist.isPublic ? 'Công khai' : 'Riêng tư'}
      </p>

      {/* Delete button — dùng Popconfirm của antd */}
      <Popconfirm
        title="Xoá playlist"
        description={`Bạn có chắc muốn xoá "${playlist.name}"?`}
        onConfirm={(e) => { e?.stopPropagation(); onDelete(playlist._id); }}
        onCancel={(e) => e?.stopPropagation()}
        okText="Xoá"
        cancelText="Huỷ"
        okButtonProps={{ danger: true }}
      >
        <button
          onClick={(e) => e.stopPropagation()}
          title="Xoá playlist"
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 bg-black/40 text-slate-300 hover:bg-red-500/80 hover:text-white"
        >
          <IconTrash />
        </button>
      </Popconfirm>
    </div>
  );
}

/* ── Tabs ── */
type Tab = 'playlists' | 'artists' | 'albums' | 'downloaded';
const TABS: { id: Tab; label: string }[] = [
  { id: 'playlists', label: 'Playlists' },
  { id: 'artists', label: 'Nghệ sĩ' },
  { id: 'albums', label: 'Albums' },
  { id: 'downloaded', label: 'Đã tải' },
];

/* ── LibraryPage ── */
export default function LibraryPage() {
  const { playlists, isLoading, error, fetchMyPlaylists, createPlaylist, deletePlaylist } =
    usePlaylistStore();
  const [activeTab, setActiveTab] = useState<Tab>('playlists');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    fetchMyPlaylists();
  }, [fetchMyPlaylists]);

  async function handleCreate(name: string, description: string, isPublic: boolean) {
    await createPlaylist({ name, description: description || undefined, isPublic });
  }

  async function handleDelete(playlistId: string) {
    try {
      await deletePlaylist(playlistId);
    } catch {
      setDeleteError('Xoá playlist thất bại. Vui lòng thử lại.');
      setTimeout(() => setDeleteError(''), 3000);
    }
  }

  const totalTracks = playlists.reduce((sum, p) => sum + p.tracks.length, 0);

  return (
    <div className="min-h-full">
      {/* ── Hero ── */}
      <div className="flex items-end gap-6 sm:gap-8 py-8 mb-8">
        {/* Cover art */}
        <div className="w-36 h-36 sm:w-48 sm:h-48 flex-shrink-0 rounded-2xl bg-gradient-to-br from-primary to-amber-400 shadow-2xl shadow-primary/30 flex items-center justify-center">
          <svg className="w-16 h-16 sm:w-20 sm:h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth={2} strokeLinecap="round" fill="none" />
          </svg>
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-2 min-w-0">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Thư viện</span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 leading-none">
            Your Library
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            <span className="font-bold text-white">{playlists.length}</span> playlist ·{' '}
            <span className="font-bold text-white">{totalTracks}</span> bài hát
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-6 border-b border-white/10 mb-8 sticky top-0 bg-[#121212]/95 backdrop-blur-sm z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Playlists Tab ── */}
      {activeTab === 'playlists' && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Playlists của bạn</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors"
            >
              <IconPlus />
              <span className="hidden sm:inline">Tạo playlist</span>
            </button>
          </div>

          {deleteError && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {deleteError}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="text-center py-16">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchMyPlaylists}
                className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 text-sm transition-colors"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && playlists.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <IconMusic />
              </div>
              <h3 className="text-lg font-bold mb-2">Chưa có playlist nào</h3>
              <p className="text-slate-400 text-sm mb-6">Tạo playlist đầu tiên để bắt đầu lưu nhạc yêu thích của bạn.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors"
              >
                <IconPlus />
                Tạo playlist mới
              </button>
            </div>
          )}

          {/* Grid */}
          {!isLoading && !error && playlists.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist._id} playlist={playlist} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Coming Soon tabs ── */}
      {activeTab !== 'playlists' && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <svg className="w-16 h-16 mb-4 opacity-30" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <p className="text-lg font-semibold">Sắp ra mắt</p>
          <p className="text-sm mt-1">Tính năng này đang được phát triển.</p>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <CreatePlaylistModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
