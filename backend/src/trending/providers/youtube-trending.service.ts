import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { TrendingTrack } from '../trending.service';

/**
 * Lấy top trending Music trên YouTube bằng YouTube Data API v3.
 *
 * Endpoint: GET /youtube/v3/videos
 * Params:
 *   - chart=mostPopular      → bảng xếp hạng phổ biến nhất
 *   - videoCategoryId=10     → category "Music"
 *   - regionCode=VN          → thị trường (có thể override)
 *   - part=snippet,contentDetails,statistics → lấy title, thumbnail, duration, viewCount
 */
@Injectable()
export class YoutubeTrendingService {
  private readonly logger = new Logger(YoutubeTrendingService.name);
  private readonly apiKey: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('YOUTUBE_API_KEY');
  }

  async getTrending(limit = 10, regionCode = 'VN'): Promise<TrendingTrack[]> {
    this.logger.log(`[YouTube] Fetching top ${limit} trending music (region: ${regionCode})`);

    const response = await firstValueFrom(
      this.http.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet,contentDetails,statistics',
          chart: 'mostPopular',
          videoCategoryId: '10', // Music
          regionCode,
          maxResults: limit,
          key: this.apiKey,
        },
      }),
    );

    return response.data.items.map((item: any, index: number): TrendingTrack => {
      const snippet = item.snippet;
      const stats = item.statistics;

      return {
        rank: index + 1,
        id: item.id,
        title: snippet.title,
        artist: snippet.channelTitle,
        thumbnail:
          snippet.thumbnails?.maxres?.url ||
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          '',
        duration: this._parseDuration(item.contentDetails?.duration),
        source: 'youtube',
        youtubeId: item.id,
        viewCount: stats?.viewCount ? parseInt(stats.viewCount, 10) : 0,
        url: `https://www.youtube.com/watch?v=${item.id}`,
      };
    });
  }

  /**
   * Chuyển đổi ISO 8601 duration (PT4M13S) sang giây.
   */
  private _parseDuration(iso: string): number {
    if (!iso) return 0;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const h = parseInt(match[1] || '0', 10);
    const m = parseInt(match[2] || '0', 10);
    const s = parseInt(match[3] || '0', 10);
    return h * 3600 + m * 60 + s;
  }
}
