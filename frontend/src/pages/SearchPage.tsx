import { Input, Spin, Empty } from 'antd';
import { Search } from 'lucide-react';
import { useSearchStore } from '../store/searchStore';
import { usePlayerStore } from '../store/playerStore';
import { SearchResult } from '../types';
import { motion } from 'framer-motion';

export default function SearchPage() {
  const { query, results, isLoading, setQuery, search } = useSearchStore();
  const { play } = usePlayerStore();

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Search</h1>

      <Input
        size="large"
        prefix={<Search size={18} className="text-text-muted" />}
        placeholder="Search songs, artists, albums..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onPressEnter={() => search()}
        className="mb-6"
        style={{ borderRadius: 12, background: '#fff8f2' }}
      />

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      )}

      {!isLoading && results.length === 0 && query && (
        <Empty description="No results found" />
      )}

      <div className="flex flex-col gap-2">
        {results.map((track, i) => (
          <motion.div
            key={`${track.source}-${track.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => play(track, results)}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-surface cursor-pointer transition-all group"
          >
            <img
              src={track.thumbnail || 'https://via.placeholder.com/48'}
              alt={track.title}
              className="w-12 h-12 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-text-primary truncate">{track.title}</p>
              <p className="text-xs text-text-muted truncate">{track.artist}</p>
            </div>
            <span className="text-xs text-text-muted capitalize px-2 py-1 rounded-lg bg-background">
              {track.source}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
