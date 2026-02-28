export interface User {
  _id: string;
  email: string;
  displayName: string;
  avatar: string;
  likedTracks: string[];
  isPremium: boolean;
  createdAt: string;
}

export interface Track {
  _id: string;
  title: string;
  artist: string;
  album?: string;
  thumbnail: string;
  duration: number; // seconds
  sourceId: string;
  source: 'youtube' | 'spotify' | 'soundcloud' | 'tiktok';
  youtubeId?: string; // không bắt buộc — SoundCloud tracks không có youtubeId
  url?: string;       // permalink URL để buildAudioStreamUrl() dùng fast-path
  playCount: number;
  tags: string[];
}

export interface SearchResult {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  source: 'youtube' | 'spotify' | 'soundcloud';
  youtubeId?: string;
  url?: string;
}

export interface Playlist {
  _id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  owner: string | User;
  tracks: Track[];
  isPublic: boolean;
  createdAt: string;
}

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface TrendingTrack {
  rank: number;
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  source: 'youtube' | 'spotify' | 'soundcloud';
  youtubeId?: string;
  previewUrl?: string;
  url: string;
  viewCount?: number;
  playCount?: number;
}

export interface TrendingData {
  youtube: TrendingTrack[];
  spotify: TrendingTrack[];
  soundcloud: TrendingTrack[];
  fetchedAt: string;
}

export interface PlayerState {
  currentTrack: SearchResult | Track | null;
  queue: (SearchResult | Track)[];
  queueIndex: number;
  status: PlayerStatus;
  progress: number;    // 0-100
  currentTime: number; // seconds
  duration: number;    // seconds
  volume: number;      // 0-1
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
}
