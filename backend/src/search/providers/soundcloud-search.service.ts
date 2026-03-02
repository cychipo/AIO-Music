import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as play from "play-dl";
import { SearchResult } from "../search.service";

/**
 * SoundCloud search bằng play-dl.
 *
 * SoundCloud v1 API đã đóng đăng ký client_id mới (luôn trả 401).
 * play-dl cung cấp getFreeClientID() để tự scrape client_id hợp lệ
 * từ trang web SoundCloud — ổn định hơn dùng client_id cố định trong .env.
 *
 * Nếu search fail, service sẽ tự refresh client_id và retry 1 lần.
 */
@Injectable()
export class SoundcloudSearchService implements OnModuleInit {
  private readonly logger = new Logger(SoundcloudSearchService.name);

  async onModuleInit() {
    await this._refreshClientId();
  }

  private async _refreshClientId(): Promise<void> {
    try {
      const id = await play.getFreeClientID();
      await play.setToken({ soundcloud: { client_id: id } });
      this.logger.log(
        `[SoundCloud Search] client_id refreshed: ${id.slice(0, 8)}...`,
      );
    } catch (err) {
      this.logger.warn(
        `[SoundCloud Search] Failed to refresh client_id: ${err.message}`,
      );
    }
  }

  async search(query: string, limit = 10): Promise<SearchResult[]> {
    try {
      const results = await play.search(query, {
        source: { soundcloud: "tracks" },
        limit,
      });
      return this._mapResults(results, limit);
    } catch (err) {
      // client_id có thể đã hết hạn — refresh rồi retry 1 lần
      this.logger.warn(
        `[SoundCloud Search] Failed, refreshing client_id: ${err.message}`,
      );
      await this._refreshClientId();

      const results = await play.search(query, {
        source: { soundcloud: "tracks" },
        limit,
      });
      return this._mapResults(results, limit);
    }
  }

  private _mapResults(results: any[], limit: number): SearchResult[] {
    return results.slice(0, limit).map((track) => ({
      id: String(track.id),
      title: track.name ?? track.title ?? "",
      artist: track.user?.name ?? track.user?.username ?? "Unknown",
      thumbnail: (track as any).thumbnail || (track as any).artwork_url || "",
      duration: track.durationInSec ?? 0,
      source: "soundcloud" as const,
      url: (track as any).url || track.permalink || "",
    }));
  }
}
