import { Slider } from 'antd';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Shuffle, Repeat, Repeat1,
} from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { motion, AnimatePresence } from 'framer-motion';

function formatTime(s: number) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function PlayerBar() {
  const {
    currentTrack, status, progress, currentTime, duration,
    volume, isMuted, isShuffled, repeatMode,
    togglePlay, next, prev, seek, setVolume, toggleMute,
    toggleShuffle, cycleRepeat,
  } = usePlayerStore();

  if (!currentTrack) return null;

  const isPlaying = status === 'playing';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(253, 227, 200, 0.95)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid #f0d4be',
          padding: '12px 24px',
        }}
      >
        <div className="flex items-center gap-4 max-w-screen-xl mx-auto">
          {/* Track Info */}
          <div className="flex items-center gap-3 w-64 min-w-0">
            {currentTrack.thumbnail ? (
              <img
                src={currentTrack.thumbnail}
                alt={currentTrack.title}
                className="w-12 h-12 rounded-xl object-cover shadow-card"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-white text-lg">♪</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm text-text-primary truncate">{currentTrack.title}</p>
              <p className="text-xs text-text-muted truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleShuffle}
                className={`p-1 rounded-lg transition-colors ${isShuffled ? 'text-primary' : 'text-text-muted hover:text-text-primary'}`}
              >
                <Shuffle size={16} />
              </button>
              <button onClick={prev} className="p-1.5 rounded-xl hover:bg-background transition-colors text-text-secondary">
                <SkipBack size={20} />
              </button>
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-primary hover:bg-primary-dark flex items-center justify-center shadow-pastel transition-all"
              >
                {isPlaying ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white ml-0.5" />}
              </button>
              <button onClick={next} className="p-1.5 rounded-xl hover:bg-background transition-colors text-text-secondary">
                <SkipForward size={20} />
              </button>
              <button
                onClick={cycleRepeat}
                className={`p-1 rounded-lg transition-colors ${repeatMode !== 'none' ? 'text-primary' : 'text-text-muted hover:text-text-primary'}`}
              >
                {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
              </button>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 w-full max-w-md">
              <span className="text-xs text-text-muted w-8 text-right">{formatTime(currentTime)}</span>
              <Slider
                className="flex-1"
                value={progress}
                onChange={(val) => seek((val / 100) * duration)}
                tooltip={{ formatter: () => formatTime(currentTime) }}
              />
              <span className="text-xs text-text-muted w-8">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 w-32">
            <button onClick={toggleMute} className="text-text-muted hover:text-text-primary transition-colors">
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <Slider
              className="flex-1"
              value={isMuted ? 0 : volume * 100}
              onChange={(val) => setVolume(val / 100)}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
