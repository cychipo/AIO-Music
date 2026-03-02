import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as play from "play-dl";
import { TrendingTrack } from "../trending.service";

/**
 * Lấy top trending SoundCloud bằng play-dl.
 *
 * SoundCloud v1 API đã đóng đăng ký client_id mới (401/403).
 * play-dl cung cấp getFreeClientID() để tự scrape client_id hợp lệ
 * từ trang web SoundCloud — cách này ổn định hơn dùng client_id cố định.
 *
 * Vì getFreeClientID() gọi HTTP nên được khởi tạo trong OnModuleInit
 * (chạy 1 lần khi server start) và refresh định kỳ.
 */
@Injectable()
export class SoundcloudTrendingService implements OnModuleInit {
  private readonly logger = new Logger(SoundcloudTrendingService.name);

  async onModuleInit() {
    await this._refreshClientId();
  }

  private async _refreshClientId(): Promise<void> {
    try {
      const id = await play.getFreeClientID();
      await play.setToken({ soundcloud: { client_id: id } });
      this.logger.log(`[SoundCloud] client_id refreshed: ${id.slice(0, 8)}...`);
    } catch (err) {
      this.logger.warn(
        `[SoundCloud] Failed to refresh client_id: ${err.message}`,
      );
    }
  }

  private cache: {
    tracks: TrendingTrack[];
    fetchedAt: number;
  } | null = null;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  async getTrending(limit = 10): Promise<TrendingTrack[]> {
    // Return from cache if valid and has enough tracks (or bounded by max)
    if (
      this.cache &&
      Date.now() - this.cache.fetchedAt < this.CACHE_TTL &&
      this.cache.tracks.length >= Math.min(limit, 50)
    ) {
      return this.cache.tracks.slice(0, limit);
    }

    this.logger.log(`[SoundCloud] Fetching top trending via play-dl`);

    try {
      const results = await play.search("nhac tre viet nam", {
        source: { soundcloud: "tracks" },
        limit: Math.max(limit * 3, 50), // fetch enough to cache
      });

      const tracks = this._mapResults(results, Math.max(limit, 50));
      if (tracks.length > 0) {
        this.cache = {
          tracks,
          fetchedAt: Date.now(),
        };
      }
      return tracks.slice(0, limit);
    } catch (err: any) {
      // client_id có thể đã hết hạn — thử refresh rồi retry 1 lần
      this.logger.warn(
        `[SoundCloud] Search failed, refreshing client_id: ${err.message}`,
      );
      await this._refreshClientId();

      const results = await play.search("nhac tre viet nam", {
        source: { soundcloud: "tracks" },
        limit: Math.max(limit * 3, 50),
      });

      const tracks = this._mapResults(results, Math.max(limit, 50));
      if (tracks.length > 0) {
        this.cache = {
          tracks,
          fetchedAt: Date.now(),
        };
      }
      return tracks.slice(0, limit);
    }
  }

  /**
   * Map play-dl SoundCloud results → TrendingTrack[].
   * Filters out mixes/compilations longer than 10 minutes.
   */
  private _mapResults(results: any[], limit: number): TrendingTrack[] {
    return results
      .filter((track) => {
        const dur = track.durationInSec ?? 0;
        return dur > 0 && dur <= 600; // max 10 min — bỏ DJ sets / mixes
      })
      .slice(0, limit)
      .map(
        (track, index): TrendingTrack => ({
          rank: index + 1,
          id: String(track.id),
          title: track.name,
          artist: track.user?.name || "Unknown",
          thumbnail:
            (track as any).thumbnail || (track as any).artwork_url || "",
          duration: track.durationInSec ?? 0,
          source: "soundcloud",
          url: (track as any).url || track.permalink || "",
          playCount: 0,
        }),
      );
  }
}
