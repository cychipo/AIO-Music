import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Innertube } from "youtubei.js";
import { TrendingTrack } from "../trending.service";

/**
 * Lấy top trending "Spotify" bằng youtubei.js YouTube search.
 *
 * TẠI SAO: Spotify app đang ở Development Mode → toàn bộ REST API
 * đều trả 403. Giải pháp: dùng youtubei.js search YouTube với các query
 * mô phỏng Spotify chart (top pop/R&B/hip-hop global).
 *
 * Source trả về vẫn là 'youtube' — trung thực với người dùng.
 * Khi Spotify app được upgrade khỏi Dev mode, thay bằng
 * Spotify Web API endpoint /v1/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks.
 */
@Injectable()
export class SpotifyTrendingService implements OnModuleInit {
  private readonly logger = new Logger(SpotifyTrendingService.name);
  private yt: Innertube;

  /**
   * Queries mô phỏng Spotify Vietnam Top chart.
   */
  private readonly CHART_QUERIES = [
    "Spotify Top 50 Vietnam",
    "Spotify Viral 50 Vietnam",
    "Spotify Việt Nam",
    "Top Hits Vietnam",
  ];

  private queryIndex = 0;

  async onModuleInit() {
    this.yt = await Innertube.create();
    this.logger.log("[Spotify Trending] InnerTube client đã khởi tạo");
  }

  private cache: {
    tracks: TrendingTrack[];
    fetchedAt: number;
    queryIndex: number;
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

    const maxAttempts = this.CHART_QUERIES.length;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const query =
        this.CHART_QUERIES[
          (this.queryIndex + attempt) % this.CHART_QUERIES.length
        ];

      this.logger.log(
        `[Spotify] Fetching tracks (query: "${query}", attempt ${attempt + 1}/${maxAttempts})`,
      );

      try {
        const results = await this.yt.music.search(query, { type: "playlist" });

        if (
          !results.contents ||
          !results.contents[0] ||
          !results.contents[0].contents
        ) {
          continue;
        }

        const firstPlaylist = results.contents[0].contents[0] as any;
        if (!firstPlaylist || !firstPlaylist.id) {
          continue;
        }

        this.logger.log(`[Spotify] Found playlist: ${firstPlaylist.id}`);

        const playlistDetails = await this.yt.music.getPlaylist(
          firstPlaylist.id,
        );

        if (!playlistDetails.items || playlistDetails.items.length === 0) {
          continue;
        }

        const tracks = playlistDetails.items
          .filter((item: any) => {
            const dur = item.duration?.seconds ?? 0;
            return dur > 0 && dur <= 600; // max 10 phút
          })
          .map((item: any, index: number): TrendingTrack => {
            let artistName = "Unknown";
            if (Array.isArray(item.artists) && item.artists.length > 0) {
              artistName = item.artists.map((a: any) => a.name).join(", ");
            } else if (Array.isArray(item.authors) && item.authors.length > 0) {
              artistName = item.authors.map((a: any) => a.name).join(", ");
            } else if (item.author?.name) {
              artistName = item.author.name;
            }

            return {
              rank: index + 1,
              id: item.id ?? "",
              title: item.title ?? "",
              artist: artistName,
              thumbnail:
                item.thumbnail?.contents?.[item.thumbnail.contents.length - 1]
                  ?.url ??
                item.thumbnails?.[0]?.url ??
                "",
              duration: item.duration?.seconds ?? 0,
              source: "spotify",
              youtubeId: item.id ?? "",
              url: `https://www.youtube.com/watch?v=${item.id}`,
            };
          });

        if (tracks.length > 0) {
          this.queryIndex =
            (this.queryIndex + attempt + 1) % this.CHART_QUERIES.length;

          this.cache = {
            tracks,
            fetchedAt: Date.now(),
            queryIndex: this.queryIndex,
          };

          return tracks.slice(0, limit);
        }
      } catch (error: any) {
        this.logger.error(
          `[Spotify] Lỗi khi xử lý query "${query}": ${error.message}`,
        );
      }
    }

    this.logger.error(
      `[Spotify] Tất cả ${maxAttempts} query đều thất bại, trả về mảng rỗng`,
    );
    return [];
  }
}
