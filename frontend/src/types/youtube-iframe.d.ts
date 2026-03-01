// Type declarations for YouTube IFrame Player API
// https://developers.google.com/youtube/iframe_api_reference

declare namespace YT {
  type PlayerState = -1 | 0 | 1 | 2 | 3 | 5;

  const PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };

  interface PlayerVars {
    autoplay?: 0 | 1;
    controls?: 0 | 1 | 2;
    disablekb?: 0 | 1;
    enablejsapi?: 0 | 1;
    fs?: 0 | 1;
    iv_load_policy?: 1 | 3;
    loop?: 0 | 1;
    modestbranding?: 0 | 1;
    origin?: string;
    playsinline?: 0 | 1;
    rel?: 0 | 1;
    start?: number;
  }

  interface Events {
    onReady?: (event: PlayerEvent) => void;
    onStateChange?: (event: OnStateChangeEvent) => void;
    onError?: (event: OnErrorEvent) => void;
  }

  interface PlayerOptions {
    videoId?: string;
    width?: number | string;
    height?: number | string;
    host?: string;
    playerVars?: PlayerVars;
    events?: Events;
  }

  interface PlayerEvent {
    target: Player;
  }

  interface OnStateChangeEvent {
    target: Player;
    data: PlayerState;
  }

  interface OnErrorEvent {
    target: Player;
    data: number;
  }

  class Player {
    constructor(
      elementIdOrElement: string | HTMLElement,
      options: PlayerOptions,
    );
    loadVideoById(videoId: string, startSeconds?: number): void;
    cueVideoById(videoId: string, startSeconds?: number): void;
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getPlayerState(): PlayerState;
    getCurrentTime(): number;
    getDuration(): number;
    setVolume(volume: number): void;
    getVolume(): number;
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    destroy(): void;
    getIframe(): HTMLIFrameElement;
  }
}

interface Window {
  YT: typeof YT;
  onYouTubeIframeAPIReady: () => void;
}
