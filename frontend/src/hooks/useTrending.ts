import { useState, useEffect, useCallback, useRef } from "react";
import { trendingApi } from "../lib/apiClient";
import { TrendingData, TrendingTrack } from "../types";

interface UseTrendingReturn {
  data: TrendingData | null;
  isLoading: boolean;
  errors: { youtube?: string; spotify?: string; soundcloud?: string };
  refetch: () => void;
  lastFetchedAt: Date | null;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút — tránh spam API keys

// Module-level cache để persist giữa các lần unmount/remount component
let _cache: { data: TrendingData; fetchedAt: number } | null = null;

export function useTrending(limit = 10): UseTrendingReturn {
  const [data, setData] = useState<TrendingData | null>(_cache?.data ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(!_cache);
  const [errors, setErrors] = useState<UseTrendingReturn["errors"]>({});
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(
    _cache ? new Date(_cache.fetchedAt) : null,
  );

  const isMountedRef = useRef(true);

  const fetch = useCallback(async () => {
    // Dùng cache nếu còn trong TTL
    if (_cache && Date.now() - _cache.fetchedAt < CACHE_TTL_MS) {
      setData(_cache.data);
      setLastFetchedAt(new Date(_cache.fetchedAt));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await trendingApi.getAll(limit);
      const result: TrendingData = res.data;

      // Ghi cache
      _cache = { data: result, fetchedAt: Date.now() };

      if (!isMountedRef.current) return;

      setData(result);
      setLastFetchedAt(new Date());

      // Phát hiện platform nào trả về mảng rỗng — có thể lỗi API key
      const newErrors: UseTrendingReturn["errors"] = {};
      if (result.youtube.length === 0)
        newErrors.youtube = "No data — check YOUTUBE_API_KEY";
      if (result.spotify.length === 0)
        newErrors.spotify = "No data — check SPOTIFY credentials";
      if (result.soundcloud.length === 0)
        newErrors.soundcloud = "No data — check SOUNDCLOUD_CLIENT_ID";
      setErrors(newErrors);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setErrors({
        youtube: err.message,
        spotify: err.message,
        soundcloud: err.message,
      });
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    isMountedRef.current = true;
    fetch();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetch]);

  return { data, isLoading, errors, refetch: fetch, lastFetchedAt };
}

/**
 * Chuyển TrendingTrack thành SearchResult-compatible object
 * để playerStore.play() có thể xử lý được.
 */
export function trendingTrackToPlayable(track: TrendingTrack) {
  return {
    id: track.youtubeId || track.id,
    title: track.title,
    artist: track.artist,
    thumbnail: track.thumbnail,
    duration: track.duration,
    source: track.source,
    youtubeId: track.youtubeId,
    url: track.url,
  };
}

/** Format số giây sang m:ss */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Format view/play count: 1234567 → "1.2M" */
export function formatCount(n?: number): string {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// Cache lưu trữ trending cho từng platform
const _platformCache: Record<
  string,
  { data: TrendingTrack[]; fetchedAt: number }
> = {};

export function useTrendingPlatform(
  platform: "youtube" | "spotify" | "soundcloud",
  limit = 12,
) {
  const cacheKey = `${platform}-${limit}`;
  // Init data from cache if available
  const [data, setData] = useState<TrendingTrack[]>(
    _platformCache[cacheKey]?.data || [],
  );
  const [isLoading, setIsLoading] = useState(!_platformCache[cacheKey]);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (force = false) => {
      // Dùng cache nếu có và chưa hết hạn (dùng chung TTL 5 phút của toàn bộ file)
      // Nếu force = true (khi user chủ động bấm thử lại) thì bỏ qua cache
      if (
        !force &&
        _platformCache[cacheKey] &&
        Date.now() - _platformCache[cacheKey].fetchedAt < CACHE_TTL_MS
      ) {
        setData(_platformCache[cacheKey].data);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        let res;
        if (platform === "youtube") res = await trendingApi.getYoutube(limit);
        else if (platform === "spotify")
          res = await trendingApi.getSpotify(limit);
        else if (platform === "soundcloud")
          res = await trendingApi.getSoundCloud(limit);

        if (res && res.data) {
          _platformCache[cacheKey] = { data: res.data, fetchedAt: Date.now() };
          setData(res.data);
        }
      } catch (err: any) {
        setError(err.message || "Error fetching trending data");
      } finally {
        setIsLoading(false);
      }
    },
    [platform, limit, cacheKey],
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: () => fetch(true) };
}
