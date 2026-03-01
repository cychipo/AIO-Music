import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Innertube } from 'youtubei.js';
import { SearchResult } from '../search.service';

/**
 * YouTube search bằng youtubei.js (InnerTube API — API nội bộ của YouTube app).
 *
 * Ưu điểm:
 *   - Không cần YOUTUBE_API_KEY → không bị hết quota
 *   - Ổn định hơn play-dl (scrape HTML → dễ bị break khi YouTube đổi layout)
 *   - Trả về duration, view count, thumbnail trực tiếp
 */
@Injectable()
export class YoutubeSearchService implements OnModuleInit {
  private readonly logger = new Logger(YoutubeSearchService.name);
  private yt: Innertube;

  async onModuleInit() {
    this.yt = await Innertube.create();
    this.logger.log('[YouTube] InnerTube client đã khởi tạo');
  }

  async search(query: string, limit = 10): Promise<SearchResult[]> {
    this.logger.log(`[YouTube] Searching "${query}" (limit: ${limit})`);

    try {
      const results = await this.yt.search(query, { type: 'video' });
      // results.videos trả về union type rộng, nhưng khi filter type='video'
      // thực tế luôn là Video — cast sang any để tránh TS union errors
      const videos = (results.videos as any[]).slice(0, limit);

      return videos.map((video: any) => ({
        id: video.id ?? '',
        title: video.title?.text ?? (video.title as unknown as string) ?? '',
        artist: video.author?.name ?? 'Unknown',
        thumbnail: video.thumbnails?.[0]?.url ?? '',
        duration: video.duration?.seconds ?? 0,
        source: 'youtube' as const,
        youtubeId: video.id ?? '',
        url: `https://www.youtube.com/watch?v=${video.id}`,
      }));
    } catch (error) {
      this.logger.error(
        `[YouTube] Search thất bại cho query "${query}": ${error.message}`,
      );
      return [];
    }
  }
}
