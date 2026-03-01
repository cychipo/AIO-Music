import { create } from 'zustand';
import { playlistApi, AddTrackPayload } from '../lib/apiClient';
import type { Playlist } from '../types';

interface PlaylistStore {
  // Dữ liệu
  playlists: Playlist[];
  isLoading: boolean;
  error: string | null;

  // Modal "Thêm vào playlist" — lưu full track payload thay vì chỉ id
  pendingTrack: AddTrackPayload | null;

  // Actions
  fetchMyPlaylists: () => Promise<void>;
  createPlaylist: (data: { name: string; description?: string; isPublic?: boolean }) => Promise<Playlist>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addTrack: (playlistId: string, trackData: AddTrackPayload) => Promise<void>;
  removeTrack: (playlistId: string, trackId: string) => Promise<void>;

  // Modal helpers
  openAddToPlaylist: (track: AddTrackPayload) => void;
  closeAddToPlaylist: () => void;
}

export const usePlaylistStore = create<PlaylistStore>((set, get) => ({
  playlists: [],
  isLoading: false,
  error: null,
  pendingTrack: null,

  fetchMyPlaylists: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await playlistApi.getMy();
      set({ playlists: res.data as Playlist[], isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lấy danh sách playlist thất bại';
      set({ error: msg, isLoading: false });
    }
  },

  createPlaylist: async (data) => {
    const res = await playlistApi.create(data);
    const newPlaylist = res.data as Playlist;
    set((state) => ({ playlists: [newPlaylist, ...state.playlists] }));
    return newPlaylist;
  },

  deletePlaylist: async (playlistId) => {
    await playlistApi.delete(playlistId);
    set((state) => ({
      playlists: state.playlists.filter((p) => p._id !== playlistId),
    }));
  },

  addTrack: async (playlistId, trackData) => {
    const res = await playlistApi.addTrack(playlistId, trackData);
    const updated = res.data as Playlist;
    set((state) => ({
      playlists: state.playlists.map((p) => (p._id === playlistId ? updated : p)),
    }));
  },

  removeTrack: async (playlistId, trackId) => {
    const res = await playlistApi.removeTrack(playlistId, trackId);
    const updated = res.data as Playlist;
    set((state) => ({
      playlists: state.playlists.map((p) => (p._id === playlistId ? updated : p)),
    }));
  },

  openAddToPlaylist: (track) => {
    // Đảm bảo đã có danh sách playlist
    if (get().playlists.length === 0) {
      get().fetchMyPlaylists();
    }
    set({ pendingTrack: track });
  },

  closeAddToPlaylist: () => set({ pendingTrack: null }),
}));
