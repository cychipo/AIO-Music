import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "../../store/playerStore";

function formatTime(s: number) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────
// TikTokEngine — iframe embed for TikTok videos
// ─────────────────────────────────────────────────────────────

function TikTokEngine() {
  const { currentTrack, status, next, repeatMode, volume, isMuted } = usePlayerStore();
  const [tiktokId, setTiktokId] = useState<string | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!currentTrack || currentTrack.source !== "tiktok") {
      setShowEmbed(false);
      return;
    }

    // Extract TikTok video ID
    const url = (currentTrack as any).url;
    if (!url) {
      // Try to get from id field
      const id = (currentTrack as any).id;
      if (id) {
        setTiktokId(id);
        setShowEmbed(true);
      }
      return;
    }

    // Extract video ID from TikTok URL
    const videoMatch = url.match(/video\/(\d+)/);
    if (videoMatch) {
      setTiktokId(videoMatch[1]);
      setShowEmbed(true);
    } else {
      // Try music URL
      const musicMatch = url.match(/music\/[^\/]+-(\d+)/);
      if (musicMatch) {
        setTiktokId(musicMatch[1]);
        setShowEmbed(true);
      }
    }
  }, [currentTrack]);

  // Listen for messages from TikTok iframe
  useEffect(() => {
    if (!showEmbed) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.event === 'video_end') {
          if (repeatMode === "one") {
            // Reload iframe to replay
            setShowEmbed(false);
            setTimeout(() => setShowEmbed(true), 100);
          } else {
            next();
          }
        }
      } catch (e) {
        // Not a TikTok message
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [showEmbed, repeatMode, next]);

  if (!showEmbed || !tiktokId) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      onClick={() => setShowEmbed(false)}
    >
      <div 
        className="relative w-full max-w-[500px] aspect-[9/16] rounded-2xl overflow-hidden bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        <iframe
          ref={iframeRef}
          src={`https://www.tiktok.com/embed/v2/${tiktokId}?autoplay=1&muted=1`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="TikTok Video"
        />
        <button
          onClick={() => setShowEmbed(false)}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// YouTubeEngine — invisible iframe that drives YouTube playback
// ─────────────────────────────────────────────────────────────

function YouTubeEngine() {
  const {
    ytContainerId,
    initYouTubePlayer,
    setStatus,
    _startYTPoll,
    _stopYTPoll,
    next,
    repeatMode,
    ytPlayer,
    volume,
    isMuted,
  } = usePlayerStore();

  const playerRef = useRef<YT.Player | null>(null);
  const repeatModeRef = useRef(repeatMode);
  repeatModeRef.current = repeatMode;

  useEffect(() => {
    let destroyed = false;

    /**
     * Ép player về chất lượng thấp nhất và tốc độ bình thường.
     * "small" = 240p (mức thấp nhất YouTube IFrame API hỗ trợ).
     * Vì chỉ cần audio, không cần decode video chất lượng cao.
     */
    function enforceLowestQuality(player: YT.Player) {
      try {
        player.setPlaybackQuality("small");
        if (player.getPlaybackRate() !== 1) {
          player.setPlaybackRate(1);
        }
      } catch (_) {
        /* player chưa sẵn sàng */
      }
    }

    function createPlayer() {
      if (destroyed) return;
      if (playerRef.current) return; // already created

      playerRef.current = new window.YT.Player(ytContainerId, {
        width: "1",
        height: "1",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (destroyed) return;
            const p = playerRef.current!;
            p.setVolume(isMuted ? 0 : Math.round(volume * 100));
            enforceLowestQuality(p);
            initYouTubePlayer(p);
          },
          onStateChange: (e) => {
            if (destroyed) return;
            const YTState = window.YT.PlayerState;
            switch (e.data) {
              case YTState.PLAYING:
                setStatus("playing");
                _startYTPoll();
                // Ép lại quality mỗi khi chuyển sang PLAYING
                // (YouTube có thể tự nâng quality sau khi buffer)
                enforceLowestQuality(e.target);
                break;

              case YTState.PAUSED: {
                // Phân biệt user pause vs YouTube "Are you still watching?"
                // Khi user bấm pause → store.status đã set thành "paused"
                // Khi YouTube auto-pause → store.status vẫn là "playing"
                const storeStatus = usePlayerStore.getState().status;
                if (storeStatus === "playing") {
                  // YouTube idle detection → auto-resume sau delay ngắn
                  console.log(
                    "[YT] Detected YouTube idle pause — auto-resuming",
                  );
                  setTimeout(() => {
                    if (destroyed) return;
                    try {
                      e.target.playVideo();
                    } catch (_) {
                      /* player destroyed */
                    }
                  }, 500);
                } else {
                  setStatus("paused");
                  _stopYTPoll();
                }
                break;
              }

              case YTState.BUFFERING:
                setStatus("loading");
                break;
              case YTState.ENDED:
                _stopYTPoll();
                if (repeatModeRef.current === "one") {
                  e.target.seekTo(0, true);
                  e.target.playVideo();
                } else {
                  next();
                }
                break;
              case YTState.UNSTARTED:
              case YTState.CUED:
                setStatus("loading");
                break;
            }
          },
          onError: () => {
            setStatus("error");
            _stopYTPoll();
          },
        },
      });
    }

    // YT API may already be loaded (hot reload) or we wait for callback
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        createPlayer();
      };
    }

    return () => {
      destroyed = true;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (_) {
          /* ignore */
        }
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync volume/mute when ytPlayer becomes available and track is already loaded
  // (volume is set directly in playerStore.play/setVolume/toggleMute)

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: "none",
      }}
    >
      <div id={ytContainerId} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PlayerBar
// ─────────────────────────────────────────────────────────────

export default function PlayerBar() {
  const {
    currentTrack,
    status,
    progress,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    togglePlay,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
  } = usePlayerStore();

  const isPlaying = status === "playing";

  return (
    <>
      {/* Always-mounted YouTube engine (invisible) */}
      <YouTubeEngine />

      {/* TikTok embed modal */}
      <TikTokEngine />

      <AnimatePresence>
        {currentTrack && (
          <motion.footer
            role="region"
            aria-label="Now playing"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="h-16 md:h-24 glass-panel border border-white/10 md:border-t-white/10 mx-2 mb-2 md:m-0 rounded-xl md:rounded-none px-3 md:px-8 flex items-center justify-between flex-shrink-0 z-40 relative overflow-hidden"
          >
            {/* ── Track info ── */}
            <div className="flex items-center gap-3 md:gap-5 w-auto md:w-1/4 flex-1 md:flex-none min-w-0">
              {currentTrack.thumbnail ? (
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  width={56}
                  height={56}
                  className="size-10 md:size-16 rounded-md md:rounded-xl object-cover shadow-2xl border border-white/10 flex-shrink-0"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="size-10 md:size-16 rounded-md md:rounded-xl gradient-primary flex-shrink-0 shadow-2xl"
                />
              )}
              <div className="min-w-0 overflow-hidden pr-2 md:pr-0">
                <p className="font-bold truncate text-white text-sm md:text-lg">
                  {currentTrack.title}
                </p>
                <p className="text-xs md:text-sm text-slate-400 truncate">
                  {currentTrack.artist}
                </p>
              </div>
              <button
                aria-label="Like this song"
                className="hidden md:block ml-2 text-primary hover:scale-110 transition-transform focus-visible:ring-2 focus-visible:ring-primary rounded-full flex-shrink-0"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* ── Mobile Right Actions ── */}
            <div className="flex items-center gap-2 md:hidden flex-shrink-0">
              <button
                aria-label="Like this song"
                className="text-slate-400 hover:text-white p-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-full"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="text-white p-2 hover:scale-105 transition-transform"
              >
                {status === "loading" ? (
                  <svg
                    className="w-7 h-7 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                ) : isPlaying ? (
                  <svg
                    className="w-7 h-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* ── Desktop Controls ── */}
            <div className="hidden md:flex flex-col items-center gap-3 flex-1 max-w-2xl px-12">
              <div className="flex items-center gap-8 text-slate-400">
                {/* Shuffle */}
                <button
                  onClick={toggleShuffle}
                  aria-label="Shuffle"
                  aria-pressed={isShuffled}
                  className={`hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-full ${isShuffled ? "text-primary" : ""}`}
                >
                  {/* Shuffle icon — two crossed arrows */}
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"
                    />
                  </svg>
                </button>

                {/* Prev */}
                <button
                  onClick={prev}
                  aria-label="Previous"
                  className="hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause" : "Play"}
                  className="size-12 rounded-full bg-gradient-to-br from-primary to-accent-amber text-white flex items-center justify-center hover:scale-110 transition-all shadow-xl shadow-primary/30 focus-visible:ring-2 focus-visible:ring-primary active:scale-95"
                >
                  {status === "loading" ? (
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                  ) : isPlaying ? (
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-7 h-7"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Next */}
                <button
                  onClick={next}
                  aria-label="Next"
                  className="hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
                  </svg>
                </button>

                {/* Repeat */}
                <button
                  onClick={cycleRepeat}
                  aria-label={`Repeat: ${repeatMode}`}
                  aria-pressed={repeatMode !== "none"}
                  className={`hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-full relative ${repeatMode !== "none" ? "text-primary" : ""}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {repeatMode === "one" && (
                    <span className="absolute -top-1 -right-1 text-[9px] font-bold text-primary leading-none">
                      1
                    </span>
                  )}
                </button>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-4 w-full">
                <span className="text-xs text-slate-500 font-medium w-10 text-right tabular-nums">
                  {formatTime(currentTime)}
                </span>
                <div
                  role="slider"
                  aria-label="Track progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress)}
                  tabIndex={0}
                  className="flex-1 h-1.5 bg-white/10 rounded-full relative group cursor-pointer overflow-hidden"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    seek(((e.clientX - rect.left) / rect.width) * duration);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight")
                      seek(Math.min(duration, currentTime + 5));
                    if (e.key === "ArrowLeft")
                      seek(Math.max(0, currentTime - 5));
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${progress}%`,
                      background: "linear-gradient(to right, #ff7e21, #fbbf24)",
                    }}
                  />
                </div>
                <span className="text-xs text-slate-500 font-medium w-10 tabular-nums">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* ── Desktop Volume & Extra ── */}
            <div className="hidden md:flex items-center justify-end gap-5 w-1/4 text-slate-400">
              <button
                aria-label="Queue"
                className="hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-full"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </button>
              <button
                aria-label="Devices"
                className="hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-full"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </button>

              {/* Volume */}
              <div className="flex items-center gap-3 w-36">
                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                  className="hover:text-primary transition-colors flex-shrink-0 focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    {isMuted || volume === 0 ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M8.586 8.586L5.05 12.05A7 7 0 005 12m3.586-3.414l.707-.707M12 6v.01"
                      />
                    )}
                  </svg>
                </button>
                <div
                  role="slider"
                  aria-label="Volume"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={isMuted ? 0 : Math.round(volume * 100)}
                  tabIndex={0}
                  className="flex-1 h-1.5 bg-white/10 rounded-full relative group cursor-pointer overflow-hidden"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setVolume((e.clientX - rect.left) / rect.width);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight")
                      setVolume(Math.min(1, volume + 0.05));
                    if (e.key === "ArrowLeft")
                      setVolume(Math.max(0, volume - 0.05));
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full group-hover:brightness-110 transition-all"
                    style={{
                      width: `${isMuted ? 0 : volume * 100}%`,
                      background:
                        "linear-gradient(to right, rgba(255,126,33,0.8), #ff7e21)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ── Mobile Progress Bar ── */}
            <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-white/10 md:hidden rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300 pointer-events-none"
                style={{ width: `${progress}%` }}
              />
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </>
  );
}
