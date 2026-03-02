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

  /** Các query xoay vòng để trending đa dạng hơn (Việt Nam) */
  private readonly TRENDING_QUERIES = [
    "Top 100 Songs Vietnam",
    "Best Vietnamese Songs 2026",
    "Top Vietnamese Music 2026",
    "Vpop 2026",
    "Nhạc trẻ hay nhất hiện nay",
  ];

  private queryIndex = 0;

  async onModuleInit() {
    this.yt = await Innertube.create();
    this.logger.log("[YouTube Trending] InnerTube client đã khởi tạo");
  }

  private cache: {
    tracks: TrendingTrack[];
    fetchedAt: number;
    queryIndex: number;
  } | null = null;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  async getTrending(limit = 10, _regionCode = "VN"): Promise<TrendingTrack[]> {
    // Return from cache if valid and has enough tracks (or bounded by max)
    if (
      this.cache &&
      Date.now() - this.cache.fetchedAt < this.CACHE_TTL &&
      this.cache.tracks.length >= Math.min(limit, 50)
    ) {
      return this.cache.tracks.slice(0, limit);
    }

    const maxAttempts = this.TRENDING_QUERIES.length;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const query =
        this.TRENDING_QUERIES[
          (this.queryIndex + attempt) % this.TRENDING_QUERIES.length
        ];

      this.logger.log(
        `[YouTube] Fetching top trending (query: "${query}", attempt ${attempt + 1}/${maxAttempts})`,
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

        this.logger.log(`[YouTube] Found playlist: ${firstPlaylist.id}`);

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

          this.cache = {
            tracks,
            fetchedAt: Date.now(),
            queryIndex: this.queryIndex,
          };

          return tracks.slice(0, limit);
        }
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
