import { Injectable, Logger } from "@nestjs/common";
import { exec } from "child_process";
import { promisify } from "util";
import { TrendingTrack } from "../trending.service";

const execAsync = promisify(exec);

@Injectable()
export class TiktokTrendingService {
  private readonly logger = new Logger(TiktokTrendingService.name);

  private cache: {
    tracks: TrendingTrack[];
    fetchedAt: number;
  } | null = null;
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour - cache lâu hơn để giảm API calls

  async getTrending(limit = 10, offset = 0): Promise<TrendingTrack[]> {
    // Return from cache if valid
    if (
      this.cache &&
      this.cache.tracks.length > 0 &&
      Date.now() - this.cache.fetchedAt < this.CACHE_TTL
    ) {
      // Check if we have enough data from cache
      if (offset + limit <= this.cache.tracks.length) {
        return this.cache.tracks.slice(offset, offset + limit).map((track, index) => ({
          ...track,
          rank: index + 1,
        }));
      }
    }

    try {
      this.logger.log(`[TikTok] Fetching trending using yt-dlp with limit=${limit}, offset=${offset}`);

      // Only fetch new data if cache is empty or expired
      if (!this.cache || Date.now() - this.cache.fetchedAt >= this.CACHE_TTL) {
        const allTracks: TrendingTrack[] = [];
        const seenIds = new Set<string>();

        try {
          // Fetch more items to cache (100 instead of 50)
          const fetchLimit = 100;
          const searchQueries = [
            "tiktok viral music 2024",
            "tiktok songs 2024 viral",
            "best tiktok music 2024",
            "trending tiktok 2024",
          ];

          for (const searchQuery of searchQueries) {
            if (allTracks.length >= fetchLimit) break;

            try {
              const { stdout: ytStdout } = await execAsync(
                `python3 -m yt_dlp "ytsearch${fetchLimit}:${searchQuery}" --flat-playlist --no-download --dump-json 2>/dev/null`,
                { timeout: 60000 }
              );

              const jsonLines = ytStdout.trim().split("\n").filter(Boolean);
              
              for (const jsonLine of jsonLines) {
                if (allTracks.length >= fetchLimit) break;

                try {
                  const data = JSON.parse(jsonLine);
                  const id = data.id;
                  const title = data.title;
                  
                  if (!id || !title || title === "[Deleted video]") continue;
                  if (seenIds.has(id)) continue;
                  seenIds.add(id);

                  let thumbnail = "";
                  if (data.thumbnail) {
                    thumbnail = data.thumbnail;
                  } else if (data.thumbnails && Array.isArray(data.thumbnails)) {
                    const thumbs = data.thumbnails.sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
                    thumbnail = thumbs[0]?.url || "";
                  }

                  allTracks.push({
                    rank: allTracks.length + 1,
                    id,
                    title,
                    artist: data.uploader || "Unknown",
                    thumbnail,
                    duration: data.duration || 0,
                    source: "tiktok",
                    url: `https://www.youtube.com/watch?v=${id}`,
                  });
                } catch (parseError) {
                  // Skip invalid JSON lines
                }
              }
            } catch (e: any) {
              this.logger.warn(`[TikTok] yt-dlp failed for query "${searchQuery}": ${e.message}`);
            }
          }
        } catch (e: any) {
          this.logger.warn(`[TikTok] YouTube search via yt-dlp failed: ${e.message}`);
        }

        this.cache = {
          tracks: allTracks,
          fetchedAt: Date.now(),
        };
      }

      // Return data from cache with offset
      if (this.cache.tracks.length > 0) {
        const tracks = this.cache.tracks.slice(offset, offset + limit);
        return tracks.map((track, index) => ({
          ...track,
          rank: index + 1,
        }));
      }

      return this.getFallbackTrending(limit);
    } catch (error: any) {
      this.logger.error(`[TikTok] Error fetching trending: ${error.message}`);
      return this.getFallbackTrending(limit);
    }
  }

  private getFallbackTrending(limit: number): TrendingTrack[] {
    const fallbackTracks: TrendingTrack[] = [
      { rank: 1, id: "fallback-1", title: "Trending on TikTok", artist: "Various Artists", thumbnail: "", duration: 0, source: "tiktok", url: "https://www.tiktok.com" },
      { rank: 2, id: "fallback-2", title: "Viral Hits Vietnam", artist: "TikTok Vietnam", thumbnail: "", duration: 0, source: "tiktok", url: "https://www.tiktok.com" },
      { rank: 3, id: "fallback-3", title: "Music Trends", artist: "TikTok", thumbnail: "", duration: 0, source: "tiktok", url: "https://www.tiktok.com" },
    ];
    return fallbackTracks.slice(0, limit);
  }
}
