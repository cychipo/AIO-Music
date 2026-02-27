import { create } from 'zustand';
import { SearchResult } from '../types';
import { searchApi } from '../lib/apiClient';

interface SearchStore {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  activeSource: 'all' | 'youtube' | 'spotify' | 'soundcloud';

  setQuery: (q: string) => void;
  setSource: (source: SearchStore['activeSource']) => void;
  search: (q?: string) => Promise<void>;
  clearResults: () => void;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  query: '',
  results: [],
  isLoading: false,
  error: null,
  activeSource: 'all',

  setQuery: (q) => set({ query: q }),
  setSource: (source) => set({ activeSource: source }),

  search: async (q) => {
    const query = q ?? get().query;
    if (!query.trim()) return;

    set({ isLoading: true, error: null });
    try {
      const { activeSource } = get();
      let res;
      if (activeSource === 'youtube') {
        res = await searchApi.searchYoutube(query);
      } else if (activeSource === 'spotify') {
        res = await searchApi.searchSpotify(query);
      } else {
        res = await searchApi.searchAll(query);
      }
      set({ results: res.data, query });
    } catch (err: any) {
      set({ error: err.message || 'Search failed' });
    } finally {
      set({ isLoading: false });
    }
  },

  clearResults: () => set({ results: [], query: '' }),
}));
