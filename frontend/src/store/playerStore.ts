import { create } from 'zustand';
import { PlayerState, PlayerStatus, SearchResult, Track } from '../types';
import { streamApi } from '../lib/apiClient';

type AnyTrack = SearchResult | Track;

interface PlayerStore extends PlayerState {
  audioRef: HTMLAudioElement | null;

  // Actions
  play: (track: AnyTrack, queue?: AnyTrack[]) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setQueue: (tracks: AnyTrack[], startIndex?: number) => void;
  setProgress: (progress: number, currentTime: number, duration: number) => void;
  setStatus: (status: PlayerStatus) => void;
}

const getYoutubeId = (track: AnyTrack): string => {
  if ('youtubeId' in track && track.youtubeId) return track.youtubeId;
  if (track.source === 'youtube') return track.id;
  return '';
};

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  status: 'idle',
  progress: 0,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  isShuffled: false,
  repeatMode: 'none',
  audioRef: null,

  play: (track, queue) => {
    const { audioRef, volume } = get();
    const youtubeId = getYoutubeId(track);
    if (!youtubeId) return;

    const token = localStorage.getItem('aio_token');
    const streamUrl = `${streamApi.getStreamUrl(youtubeId)}`;

    // Use global Audio element
    let audio = audioRef;
    if (!audio) {
      audio = new Audio();
      set({ audioRef: audio });
    }

    audio.pause();
    audio.src = streamUrl;
    // Attach auth header via fetch-based approach if needed, else use URL token
    audio.volume = volume;
    audio.load();

    const newQueue = queue || get().queue;
    const idx = queue ? queue.findIndex((t) => t.id === track.id) : get().queueIndex;

    set({
      currentTrack: track,
      queue: newQueue,
      queueIndex: Math.max(idx, 0),
      status: 'loading',
      progress: 0,
      currentTime: 0,
    });

    audio.oncanplay = () => {
      audio!.play().then(() => set({ status: 'playing' })).catch(() => set({ status: 'error' }));
    };

    audio.ontimeupdate = () => {
      const { duration } = audio!;
      const { currentTime } = audio!;
      set({
        currentTime,
        duration: duration || 0,
        progress: duration ? (currentTime / duration) * 100 : 0,
      });
    };

    audio.onended = () => {
      const { repeatMode } = get();
      if (repeatMode === 'one') {
        audio!.currentTime = 0;
        audio!.play();
      } else {
        get().next();
      }
    };

    audio.onerror = () => set({ status: 'error' });
  },

  pause: () => {
    const { audioRef } = get();
    audioRef?.pause();
    set({ status: 'paused' });
  },

  resume: () => {
    const { audioRef } = get();
    audioRef?.play().then(() => set({ status: 'playing' }));
  },

  togglePlay: () => {
    const { status } = get();
    if (status === 'playing') get().pause();
    else get().resume();
  },

  next: () => {
    const { queue, queueIndex, isShuffled, repeatMode } = get();
    if (!queue.length) return;

    let nextIdx: number;
    if (isShuffled) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else {
      nextIdx = queueIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeatMode === 'all') nextIdx = 0;
        else { set({ status: 'idle' }); return; }
      }
    }
    set({ queueIndex: nextIdx });
    get().play(queue[nextIdx], queue);
  },

  prev: () => {
    const { audioRef, queue, queueIndex } = get();
    if (audioRef && audioRef.currentTime > 3) {
      audioRef.currentTime = 0;
      return;
    }
    const prevIdx = Math.max(queueIndex - 1, 0);
    set({ queueIndex: prevIdx });
    get().play(queue[prevIdx], queue);
  },

  seek: (time) => {
    const { audioRef } = get();
    if (audioRef) audioRef.currentTime = time;
  },

  setVolume: (volume) => {
    const { audioRef } = get();
    if (audioRef) audioRef.volume = volume;
    set({ volume, isMuted: volume === 0 });
  },

  toggleMute: () => {
    const { audioRef, isMuted, volume } = get();
    if (!audioRef) return;
    if (isMuted) {
      audioRef.volume = volume || 0.8;
      set({ isMuted: false });
    } else {
      audioRef.volume = 0;
      set({ isMuted: true });
    }
  },

  toggleShuffle: () => set((s) => ({ isShuffled: !s.isShuffled })),

  cycleRepeat: () => set((s) => ({
    repeatMode: s.repeatMode === 'none' ? 'all' : s.repeatMode === 'all' ? 'one' : 'none',
  })),

  setQueue: (tracks, startIndex = 0) => {
    set({ queue: tracks, queueIndex: startIndex });
    if (tracks[startIndex]) get().play(tracks[startIndex], tracks);
  },

  setProgress: (progress, currentTime, duration) =>
    set({ progress, currentTime, duration }),

  setStatus: (status) => set({ status }),
}));
