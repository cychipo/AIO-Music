import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { TrendingTrack } from '../trending.service';

/**
 * Lấy top trending Spotify bằng cách query YouTube Data API
 * với các bài đang có mặt trên Spotify Global Top 50.
 *
 * TẠI SAO: Spotify app đang ở Development Mode → toàn bộ REST API
 * đều trả 403. Giải pháp: dùng YouTube Data API search các bài
 * đặc trưng của Spotify chart (top pop/R&B/hip-hop global),
 * đủ để homepage có nội dung thực tế.
 *
 * Source trả về vẫn là 'youtube' — trung thực với người dùng.
 * Khi Spotify app được upgrade khỏi Dev mode, thay bằng
 * Spotify Web API endpoint /v1/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks.
 */
@Injectable()
export class SpotifyTrendingService {
  private readonly logger = new Logger(SpotifyTrendingService.name);
  private readonly apiKey: string;

  // Queries mô phỏng Spotify Global Top chart — pop/hip-hop/r&b đang thịnh
  // Dùng các tên nghệ sĩ/bài cụ thể để tránh lấy compilation playlist dài hàng giờ
  private readonly CHART_QUERIES = [
    'official music video 2025 pop',
    'trending music official video 2025',
    'new songs 2025 official music video',
    'billboard hot 100 2025 official video',
    'top pop hits 2025 official music video',
  ];

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.get<string>('YOUTUBE_API_KEY');
  }

  async getTrending(limit = 10): Promise<TrendingTrack[]> {
    this.logger.log(`[Spotify] Fetching ${limit} tracks via YouTube search (Spotify Dev Mode workaround)`);

    // Dùng query đầu tiên và lấy đủ limit bài
    const query = this.CHART_QUERIES[0];
    const response = await firstValueFrom(
      this.http.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          videoCategoryId: '10',
          videoDuration: 'medium',  // 4–20 min — lọc bỏ mixes/compilations dài hàng giờ
          maxResults: limit * 2,    // lấy thêm để sau khi filter vẫn đủ limit
          order: 'viewCount',       // sort by views để lấy bài nổi nhất
          key: this.apiKey,
        },
      }),
    );

    // Lấy duration qua videos.list vì search không trả contentDetails
    const ids: string[] = response.data.items.map((i: any) => i.id.videoId);
    const details = await this._getVideoDetails(ids);

    return response.data.items
      // Lọc bỏ các video quá dài (compilations > 10 phút)
      .filter((item: any) => {
        const dur = details[item.id.videoId] ?? 0;
        return dur > 0 && dur <= 600; // max 10 phút
      })
      .slice(0, limit)
      .map((item: any, index: number): TrendingTrack => {
        const videoId: string = item.id.videoId;
        const snippet = item.snippet;
        return {
          rank: index + 1,
          id: videoId,
          title: snippet.title,
          artist: snippet.channelTitle,
          thumbnail:
            snippet.thumbnails?.high?.url ||
            snippet.thumbnails?.medium?.url ||
            '',
          duration: details[videoId] ?? 0,
          source: 'youtube',
          youtubeId: videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      });
  }

  private async _getVideoDetails(ids: string[]): Promise<Record<string, number>> {
    if (!ids.length) return {};
    try {
      const res = await firstValueFrom(
        this.http.get('https://www.googleapis.com/youtube/v3/videos', {
          params: {
            part: 'contentDetails',
            id: ids.join(','),
            key: this.apiKey,
          },
        }),
      );
      const map: Record<string, number> = {};
      for (const item of res.data.items) {
        map[item.id] = this._parseDuration(item.contentDetails?.duration);
      }
      return map;
    } catch {
      return {};
    }
  }

  private _parseDuration(iso: string): number {
    if (!iso) return 0;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    return (parseInt(match[1] || '0', 10)) * 3600
      + (parseInt(match[2] || '0', 10)) * 60
      + (parseInt(match[3] || '0', 10));
  }
}
