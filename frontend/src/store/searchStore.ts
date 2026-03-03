import { create } from "zustand";
import { SearchResult } from "../types";
import { searchApi } from "../lib/apiClient";

type Platform = "youtube" | "spotify" | "soundcloud" | "tiktok";

interface SearchStore {
  query: string;
  results: Record<Platform, SearchResult[]>;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  activeSource: Platform;
  searchLimit: Record<Platform, number>;
  hasMore: Record<Platform, boolean>;

  setQuery: (q: string) => void;
  setSource: (source: Platform) => void;
  search: (q?: string, isLoadMore?: boolean) => Promise<void>;
  loadMoreSearch: () => Promise<void>;
  clearResults: () => void;
}

const DEFAULT_LIMIT = 12;

export const useSearchStore = create<SearchStore>((set, get) => ({
  query: "",
  results: { youtube: [], spotify: [], soundcloud: [], tiktok: [] },
  isLoading: false,
  isLoadingMore: false,
  error: null,
  activeSource: "youtube",
  searchLimit: {
    youtube: DEFAULT_LIMIT,
    spotify: DEFAULT_LIMIT,
    soundcloud: DEFAULT_LIMIT,
    tiktok: DEFAULT_LIMIT,
  },
  hasMore: { youtube: true, spotify: true, soundcloud: true, tiktok: true },

  setQuery: (q) =>
    set({
      query: q,
      results: { youtube: [], spotify: [], soundcloud: [], tiktok: [] },
      searchLimit: {
        youtube: DEFAULT_LIMIT,
        spotify: DEFAULT_LIMIT,
        soundcloud: DEFAULT_LIMIT,
        tiktok: DEFAULT_LIMIT,
      },
      hasMore: { youtube: true, spotify: true, soundcloud: true, tiktok: true },
    }),
  setSource: (source) => set({ activeSource: source }),

  search: async (q, isLoadMore = false) => {
    const query = q ?? get().query;
    if (!query.trim()) return;

    const source = get().activeSource;
    if (isLoadMore && !get().hasMore[source]) return; // Stop fetching if we reached end

    const limit = isLoadMore
      ? get().searchLimit[source] + DEFAULT_LIMIT
      : DEFAULT_LIMIT;

    if (!isLoadMore) {
      set({
        isLoading: true,
        error: null,
        searchLimit: { ...get().searchLimit, [source]: DEFAULT_LIMIT },
        hasMore: { ...get().hasMore, [source]: true }, // Reset hasMore on new search
      });
    } else {
      set({
        isLoadingMore: true,
        error: null,
        searchLimit: { ...get().searchLimit, [source]: limit },
      });
    }

    try {
      let res;
      if (source === "youtube") {
        res = await searchApi.searchYoutube(query, limit);
      } else if (source === "spotify") {
        res = await searchApi.searchSpotify(query, limit);
      } else if (source === "soundcloud") {
        res = await searchApi.searchSoundCloud(query, limit);
      } else if (source === "tiktok") {
        res = await searchApi.searchTiktok(query, limit);
      } else {
        res = await searchApi.searchAll(query, limit);
      }

      const returnedData = res?.data || [];
      const previousData = get().results[source] || [];

      // Determine if there is more data depending on if the returned size is less than request size
      // Or if returned size equals previous size (meaning no new items were added)
      const isEnd =
        returnedData.length < limit ||
        (isLoadMore && returnedData.length === previousData.length);

      set((state) => ({
        results: { ...state.results, [source]: returnedData },
        query,
        hasMore: { ...state.hasMore, [source]: !isEnd },
      }));
    } catch (err: any) {
      set({ error: err.message || "Search failed" });
    } finally {
      if (!isLoadMore) set({ isLoading: false });
      else set({ isLoadingMore: false });
    }
  },

  loadMoreSearch: async () => {
    await get().search(undefined, true);
  },

  clearResults: () =>
    set({
      results: { youtube: [], spotify: [], soundcloud: [], tiktok: [] },
      query: "",
      searchLimit: {
        youtube: DEFAULT_LIMIT,
        spotify: DEFAULT_LIMIT,
        soundcloud: DEFAULT_LIMIT,
        tiktok: DEFAULT_LIMIT,
      },
      hasMore: { youtube: true, spotify: true, soundcloud: true, tiktok: true },
    }),
}));
