import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Innertube } from "youtubei.js";
import { TrendingTrack } from "../trending.service";

/**
 * Lấy top trending Music trên YouTube bằng youtubei.js (InnerTube API).
 *
 * Không cần YOUTUBE_API_KEY → không bị hết quota.
 * Vì InnerTube không expose mostPopular chart trực tiếp,
 * dùng search query + filter duration để mô phỏng trending.
 */
@Injectable()
export class YoutubeTrendingService implements OnModuleInit {
  private readonly logger = new Logger(YoutubeTrendingService.name);
  private yt: Innertube;

  /** Các query xoay vòng để trending đa dạng hơn */
  private readonly TRENDING_QUERIES = [
    "trending music video 2025",
    "new music video 2025 official",
    "vpop music video 2025",
    "best pop songs 2025",
    "kpop official music video",
  ];

  private queryIndex = 0;

  async onModuleInit() {
    this.yt = await Innertube.create();
    this.logger.log("[YouTube Trending] InnerTube client đã khởi tạo");
  }

  async getTrending(limit = 10, _regionCode = "VN"): Promise<TrendingTrack[]> {
    const maxAttempts = this.TRENDING_QUERIES.length;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const query =
        this.TRENDING_QUERIES[
          (this.queryIndex + attempt) % this.TRENDING_QUERIES.length
        ];

      this.logger.log(
        `[YouTube] Fetching top ${limit} trending (query: "${query}", attempt ${attempt + 1}/${maxAttempts})`,
      );

      try {
        const results = await this.yt.music.search(query, { type: "playlist" });

        if (
          !results.contents ||
          !results.contents[0] ||
          !results.contents[0].contents
        ) {
          this.logger.warn(
            `[YouTube] Không tìm thấy playlist cho query: "${query}"`,
          );
          continue;
        }

        const firstPlaylist = results.contents[0].contents[0] as any;
        if (!firstPlaylist || !firstPlaylist.id) {
          continue;
        }

        this.logger.log(
          `[YouTube] Found playlist: ${firstPlaylist.title} (${firstPlaylist.id})`,
        );

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
          .slice(0, limit)
          .map((item: any, index: number): TrendingTrack => {
            return {
              rank: index + 1,
              id: item.id ?? "",
              title: item.title ?? "",
              artist: Array.isArray(item.artists)
                ? item.artists.map((a: any) => a.name).join(", ")
                : Array.isArray(item.authors)
                  ? item.authors.map((a: any) => a.name).join(", ")
                  : item.author?.name || "Unknown",
              thumbnail:
                item.thumbnail?.contents?.[item.thumbnail.contents.length - 1]
                  ?.url ??
                item.thumbnails?.[0]?.url ??
                "",
              duration: item.duration?.seconds ?? 0,
              source: "youtube",
              youtubeId: item.id ?? "",
              viewCount: 0,
              url: `https://www.youtube.com/watch?v=${item.id}`,
            };
          });

        if (tracks.length > 0) {
          this.queryIndex =
            (this.queryIndex + attempt + 1) % this.TRENDING_QUERIES.length;
          return tracks;
        }

        this.logger.warn(
          `[YouTube] Playlist "${firstPlaylist.title}" trả về 0 track hợp lệ, thử query tiếp theo`,
        );
      } catch (error: any) {
        this.logger.error(
          `[YouTube] Lỗi khi xử lý query "${query}": ${error.message}`,
        );
      }
    }

    this.logger.error(
      `[YouTube] Tất cả ${maxAttempts} query đều thất bại, trả về mảng rỗng`,
    );
    return [];
  }
}
