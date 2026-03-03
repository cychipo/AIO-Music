import { create } from "zustand";
import { PlayerState, PlayerStatus, SearchResult, Track } from "../types";

type AnyTrack = SearchResult | Track;

/**
 * Hệ số gain để giảm SoundCloud/Spotify xuống ngang mức
 * YouTube IFrame (vốn đã normalize output về ~−14 LUFS).
 * Giá trị 0.65 ≈ −3.7 dB — đủ để cân bằng cảm nhận loudness.
 * Có thể chỉnh trong khoảng 0.55–0.75 tuỳ track.
 */
const SC_GAIN_NORMALIZATION = 0.65;

function getYouTubeId(track: AnyTrack): string | null {
  const t = track as any;
  
  // If track is from TikTok but has YouTube URL (from yt-dlp search)
  if (track.source === "tiktok" && t.url && t.url.includes("youtube.com")) {
    const m = t.url.match(/[?&]v=([^&]+)/) || t.url.match(/youtu\.be\/([^?]+)/);
    if (m) return m[1];
  }
  
  if (t.youtubeId) return t.youtubeId as string;
  if (track.source === "youtube") {
    if ("id" in track) return (track as SearchResult).id;
  }
  if (t.url) {
    const m =
      (t.url as string).match(/[?&]v=([^&]+)/) ||
      (t.url as string).match(/youtu\.be\/([^?]+)/);
    if (m) return m[1];
  }
  return null;
}

function getTiktokId(track: AnyTrack): string | null {
  const t = track as any;
  const url = t.url as string | undefined;
  if (!url) {
    // Try to get from id field if it's a TikTok track
    if (track.source === "tiktok") {
      return (track as any).id || null;
    }
    return null;
  }
  
  // Extract video ID from various TikTok URL formats
  // https://www.tiktok.com/@user/video/1234567890123456789
  const videoMatch = url.match(/video\/(\d+)/);
  if (videoMatch) return videoMatch[1];
  
  // https://www.tiktok.com/music/song-name-1234567890
  const musicMatch = url.match(/music\/[^\/]+-(\d+)/);
  if (musicMatch) return musicMatch[1];
  
  return null;
}

function buildAudioStreamUrl(track: AnyTrack): string {
  const BASE = "/api/v1/stream";
  const t = track as any;
  const originalUrl = t.url as string | undefined;
  
  // TikTok is handled via embed player, not audio streaming
  if (track.source === "tiktok") {
    return "";
  }
  
  // For Spotify, SoundCloud - use the stream endpoint with original URL
  if (originalUrl) {
    if (originalUrl.includes("spotify.com") || 
        originalUrl.includes("soundcloud.com")) {
      return `${BASE}?url=${encodeURIComponent(originalUrl)}`;
    }
  }
  
  if (track.source === "soundcloud") {
    const id =
      "id" in track ? (track as SearchResult).id : (track as Track)._id;
    return `${BASE}?url=${encodeURIComponent(`https://api.soundcloud.com/tracks/${id}`)}`;
  }
  
  return "";
}

// ─────────────────────────────────────────────────────────────
// Web Audio pipeline for HTML5 Audio
// AudioContext → MediaElementSource → GainNode → destination
//
// gainNode.gain.value = SC_GAIN_NORMALIZATION * (volume / 1)
// → lets us normalize SC/Spotify loudness independently of UI volume
// ─────────────────────────────────────────────────────────────

interface AudioPipeline {
  ctx: AudioContext;
  source: MediaElementAudioSourceNode;
  gainNode: GainNode;
}

function createAudioPipeline(audio: HTMLAudioElement): AudioPipeline {
  const ctx = new AudioContext();
  const source = ctx.createMediaElementSource(audio);
  const gainNode = ctx.createGain();
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  return { ctx, gainNode, source };
}

// ─────────────────────────────────────────────────────────────
// Store interface
// ─────────────────────────────────────────────────────────────

interface PlayerStore extends PlayerState {
  audioRef: HTMLAudioElement | null;
  audioPipeline: AudioPipeline | null;
  ytPlayer: YT.Player | null;
  ytContainerId: string;
  _ytPollInterval: ReturnType<typeof setInterval> | null;

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
  setProgress: (
    progress: number,
    currentTime: number,
    duration: number,
  ) => void;
  setStatus: (status: PlayerStatus) => void;
  initYouTubePlayer: (player: YT.Player) => void;
  _stopAll: () => void;
  _startYTPoll: () => void;
  _stopYTPoll: () => void;
}

// ─────────────────────────────────────────────────────────────
// Store implementation
// ─────────────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  status: "idle",
  progress: 0,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  isShuffled: false,
  repeatMode: "none",

  audioRef: null,
  audioPipeline: null,
  ytPlayer: null,
  ytContainerId: "yt-player-container",
  _ytPollInterval: null,

  // ── initYouTubePlayer ──────────────────────────────────────
  initYouTubePlayer: (player) => {
    set({ ytPlayer: player });
  },

  // ── _stopAll ───────────────────────────────────────────────
  _stopAll: () => {
    const { audioRef, ytPlayer, _ytPollInterval } = get();
    if (audioRef) {
      audioRef.pause();
      audioRef.src = "";
    }
    if (ytPlayer) {
      try {
        ytPlayer.stopVideo();
      } catch (_) {
        /* not ready */
      }
    }
    if (_ytPollInterval) {
      clearInterval(_ytPollInterval);
      set({ _ytPollInterval: null });
    }
  },

  // ── _startYTPoll ───────────────────────────────────────────
  _startYTPoll: () => {
    const existing = get()._ytPollInterval;
    if (existing) clearInterval(existing);
    const id = setInterval(() => {
      const { ytPlayer, status } = get();
      if (!ytPlayer || status === "paused" || status === "idle") return;
      try {
        const currentTime = ytPlayer.getCurrentTime();
        const duration = ytPlayer.getDuration();
        set({
          currentTime,
          duration,
          progress: duration > 0 ? (currentTime / duration) * 100 : 0,
        });
      } catch (_) {
        /* not ready */
      }
    }, 500);
    set({ _ytPollInterval: id });
  },

  // ── _stopYTPoll ────────────────────────────────────────────
  _stopYTPoll: () => {
    const { _ytPollInterval } = get();
    if (_ytPollInterval) {
      clearInterval(_ytPollInterval);
      set({ _ytPollInterval: null });
    }
  },

  // ── play ───────────────────────────────────────────────────
  play: (track, queue) => {
    const { volume, isMuted } = get();
    get()._stopAll();

    const newQueue = queue ?? get().queue;
    const trackId =
      "id" in track ? (track as SearchResult).id : (track as Track)._id;
    const idx = queue
      ? queue.findIndex((t) => {
          const tId = "id" in t ? (t as SearchResult).id : (t as Track)._id;
          return tId === trackId;
        })
      : get().queueIndex;

    set({
      currentTrack: track,
      queue: newQueue,
      queueIndex: Math.max(idx, 0),
      status: "loading",
      progress: 0,
      currentTime: 0,
      duration: 0,
    });

    const ytId = getYouTubeId(track);

    if (ytId) {
      // ── YouTube: IFrame Player API ─────────────────────────
      const { ytPlayer } = get();
      if (!ytPlayer) {
        console.warn("[Player] YT.Player not ready yet");
        return;
      }
      // IFrame API max = 100, không boost thêm được
      ytPlayer.setVolume(isMuted ? 0 : 100);
      ytPlayer.loadVideoById({
        videoId: ytId,
        suggestedQuality: "small",
      });
      // Ép quality thấp nhất và tốc độ bình thường cho audio-only playback
      try {
        ytPlayer.setPlaybackQuality("small");
        ytPlayer.setPlaybackRate(1);
      } catch (_) {
        /* player chưa sẵn sàng */
      }
    } else if (track.source === "tiktok") {
      // ── TikTok: Show embed modal ───────────────────────────
      // TikTok is handled by TikTokEngine component via embed iframe
      // Just set status to playing to show the player bar
      set({ status: "playing" });
    } else {
      // ── SoundCloud / Spotify: HTML5 Audio + GainNode ───────
      const streamUrl = buildAudioStreamUrl(track);
      if (!streamUrl) {
        console.warn("[Player] Cannot build stream URL for track:", track);
        set({ status: "error" });
        return;
      }

      // Tái sử dụng audio element, nhưng tạo mới AudioContext nếu cần
      let audio = get().audioRef;
      let pipeline = get().audioPipeline;

      if (!audio) {
        audio = new Audio();
        // crossOrigin cần thiết để AudioContext có thể đọc stream
        audio.crossOrigin = "anonymous";
        pipeline = createAudioPipeline(audio);
        set({ audioRef: audio, audioPipeline: pipeline });
      }

      // Resume AudioContext nếu bị suspend (browser autoplay policy)
      if (pipeline && pipeline.ctx.state === "suspended") {
        pipeline.ctx.resume();
      }

      // Áp dụng gain normalize: SC/Spotify thường louder hơn YT IFrame
      // volume (0–1) × SC_GAIN_NORMALIZATION để cân bằng loudness
      if (pipeline) {
        pipeline.gainNode.gain.value = isMuted
          ? 0
          : volume * SC_GAIN_NORMALIZATION;
      }
      // audio.volume giữ ở 1.0 — gain được điều khiển hoàn toàn bởi GainNode
      audio.volume = 1.0;

      audio.src = streamUrl;
      audio.load();

      audio.oncanplay = () => {
        // Resume context trước khi play (Safari/Chrome autoplay policy)
        pipeline?.ctx.resume().then(() => {
          audio!
            .play()
            .then(() => set({ status: "playing" }))
            .catch(() => set({ status: "error" }));
        });
      };

      audio.ontimeupdate = () => {
        const dur = audio!.duration || 0;
        const ct = audio!.currentTime;
        set({
          currentTime: ct,
          duration: dur,
          progress: dur > 0 ? (ct / dur) * 100 : 0,
        });
      };

      audio.onended = () => {
        const { repeatMode } = get();
        if (repeatMode === "one") {
          audio!.currentTime = 0;
          audio!.play();
        } else {
          get().next();
        }
      };

      audio.onerror = () => set({ status: "error" });
    }
  },

  // ── pause ──────────────────────────────────────────────────
  pause: () => {
    const { audioRef, ytPlayer, currentTrack } = get();
    const ytId = currentTrack ? getYouTubeId(currentTrack) : null;
    if (ytId && ytPlayer) {
      ytPlayer.pauseVideo();
    } else if (audioRef) {
      audioRef.pause();
    }
    get()._stopYTPoll();
    set({ status: "paused" });
  },

  // ── resume ─────────────────────────────────────────────────
  resume: () => {
    const { audioRef, audioPipeline, ytPlayer, currentTrack } = get();
    const ytId = currentTrack ? getYouTubeId(currentTrack) : null;
    if (ytId && ytPlayer) {
      ytPlayer.playVideo();
      get()._startYTPoll();
      set({ status: "playing" });
    } else if (audioRef) {
      audioPipeline?.ctx.resume();
      audioRef
        .play()
        .then(() => set({ status: "playing" }))
        .catch(() => set({ status: "error" }));
    }
  },

  // ── togglePlay ─────────────────────────────────────────────
  togglePlay: () => {
    const { status } = get();
    if (status === "playing") get().pause();
    else get().resume();
  },

  // ── next ───────────────────────────────────────────────────
  next: () => {
    const { queue, queueIndex, isShuffled, repeatMode } = get();
    if (!queue.length) return;
    let nextIdx: number;
    if (isShuffled) {
      // Tránh phát lại track hiện tại: random trong [0, length-1) rồi skip qua index hiện tại
      if (queue.length === 1) {
        nextIdx = 0;
      } else {
        const r = Math.floor(Math.random() * (queue.length - 1));
        nextIdx = r >= queueIndex ? r + 1 : r;
      }
    } else {
      nextIdx = queueIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeatMode === "all") nextIdx = 0;
        else {
          set({ status: "idle" });
          return;
        }
      }
    }
    set({ queueIndex: nextIdx });
    get().play(queue[nextIdx], queue);
  },

  // ── prev ───────────────────────────────────────────────────
  prev: () => {
    const { audioRef, ytPlayer, currentTrack, queue, queueIndex } = get();
    const ytId = currentTrack ? getYouTubeId(currentTrack) : null;
    const currentTime =
      ytId && ytPlayer
        ? ytPlayer.getCurrentTime()
        : (audioRef?.currentTime ?? 0);
    if (currentTime > 3) {
      get().seek(0);
      return;
    }
    const prevIdx = Math.max(queueIndex - 1, 0);
    set({ queueIndex: prevIdx });
    get().play(queue[prevIdx], queue);
  },

  // ── seek ───────────────────────────────────────────────────
  seek: (time) => {
    const { audioRef, ytPlayer, currentTrack } = get();
    const ytId = currentTrack ? getYouTubeId(currentTrack) : null;
    if (ytId && ytPlayer) {
      ytPlayer.seekTo(time, true);
      set({ currentTime: time });
    } else if (audioRef) {
      audioRef.currentTime = time;
    }
  },

  // ── setVolume ──────────────────────────────────────────────
  setVolume: (volume) => {
    const { audioRef, audioPipeline, ytPlayer, currentTrack } = get();
    const ytId = currentTrack ? getYouTubeId(currentTrack) : null;

    if (ytId && ytPlayer) {
      // YouTube IFrame: volume 0–100, không normalize thêm
      ytPlayer.setVolume(Math.round(volume * 100));
    } else if (audioRef && audioPipeline) {
      // SC/Spotify: điều chỉnh qua GainNode với hệ số normalize
      audioPipeline.gainNode.gain.value = volume * SC_GAIN_NORMALIZATION;
    }
    set({ volume, isMuted: volume === 0 });
  },

  // ── toggleMute ─────────────────────────────────────────────
  toggleMute: () => {
    const { audioRef, audioPipeline, ytPlayer, isMuted, volume, currentTrack } =
      get();
    const ytId = currentTrack ? getYouTubeId(currentTrack) : null;

    if (isMuted) {
      if (ytId && ytPlayer) ytPlayer.unMute();
      if (audioPipeline)
        audioPipeline.gainNode.gain.value = volume * SC_GAIN_NORMALIZATION;
      set({ isMuted: false });
    } else {
      if (ytId && ytPlayer) ytPlayer.mute();
      if (audioPipeline) audioPipeline.gainNode.gain.value = 0;
      // audio.volume không cần đổi — GainNode handle
      set({ isMuted: true });
    }

    // Fallback nếu audio không có pipeline
    // isMuted là giá trị CŨ (trước khi toggle), nên dùng ngược lại
    if (audioRef && !audioPipeline) {
      audioRef.volume = isMuted ? volume || 0.8 : 0;
      // isMuted cũ = true → vừa unmute → đặt volume lại
      // isMuted cũ = false → vừa mute → đặt volume = 0
    }
  },

  // ── shuffle / repeat ───────────────────────────────────────
  toggleShuffle: () => set((s) => ({ isShuffled: !s.isShuffled })),

  cycleRepeat: () =>
    set((s) => ({
      repeatMode:
        s.repeatMode === "none"
          ? "all"
          : s.repeatMode === "all"
            ? "one"
            : "none",
    })),

  // ── setQueue ───────────────────────────────────────────────
  setQueue: (tracks, startIndex = 0) => {
    set({ queue: tracks, queueIndex: startIndex });
    if (tracks[startIndex]) get().play(tracks[startIndex], tracks);
  },

  setProgress: (progress, currentTime, duration) =>
    set({ progress, currentTime, duration }),

  setStatus: (status) => set({ status }),
}));
