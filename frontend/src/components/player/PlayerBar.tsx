import { AnimatePresence, motion } from "framer-motion";
import { usePlayerStore } from "../../store/playerStore";

function formatTime(s: number) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

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

  if (!currentTrack) return null;
  const isPlaying = status === "playing";

  return (
    <AnimatePresence>
      <motion.footer
        role="region"
        aria-label="Now playing"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 h-24 glass-panel border-t border-white/10 px-8 flex items-center justify-between z-40"
      >
        {/* ── Track info ── */}
        <div className="flex items-center gap-5 w-1/4 min-w-0">
          {currentTrack.thumbnail ? (
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              width={56}
              height={56}
              className="size-16 rounded-xl object-cover shadow-2xl border border-white/10 flex-shrink-0"
            />
          ) : (
            <div
              aria-hidden="true"
              className="size-16 rounded-xl gradient-primary flex-shrink-0 shadow-2xl"
            />
          )}
          <div className="min-w-0 overflow-hidden">
            <p className="font-bold truncate text-white text-lg">
              {currentTrack.title}
            </p>
            <p className="text-sm text-slate-400 truncate">
              {currentTrack.artist}
            </p>
          </div>
          <button
            aria-label="Like this song"
            className="ml-2 text-primary hover:scale-110 transition-transform focus-visible:ring-2 focus-visible:ring-primary rounded-full flex-shrink-0"
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

        {/* ── Controls ── */}
        <div className="flex flex-col items-center gap-3 flex-1 max-w-2xl px-12">
          <div className="flex items-center gap-8 text-slate-400">
            <button
              onClick={toggleShuffle}
              aria-label="Shuffle"
              aria-pressed={isShuffled}
              className={`hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-full ${isShuffled ? "text-primary" : ""}`}
            >
              {/* Shuffle icon */}
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
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
            </button>
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
              {isPlaying ? (
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
            <button
              onClick={cycleRepeat}
              aria-label="Repeat"
              aria-pressed={repeatMode !== "none"}
              className={`hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-full ${repeatMode !== "none" ? "text-primary" : ""}`}
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
            </button>
          </div>

          {/* Progress */}
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
                if (e.key === "ArrowLeft") seek(Math.max(0, currentTime - 5));
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

        {/* ── Volume & Extra ── */}
        <div className="flex items-center justify-end gap-5 w-1/4 text-slate-400">
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
      </motion.footer>
    </AnimatePresence>
  );
}
