import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SearchResult } from '../search.service';

@Injectable()
export class YoutubeSearchService {
  private readonly logger = new Logger(YoutubeSearchService.name);
  private readonly apiKey: string;

  constructor(
    private http: HttpService,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('YOUTUBE_API_KEY');
  }

  async search(query: string, limit = 10): Promise<SearchResult[]> {
    const response = await firstValueFrom(
      this.http.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          maxResults: limit,
          type: 'video',
          videoCategoryId: '10', // Music category
          key: this.apiKey,
        },
      }),
    );

    return response.data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url || '',
      duration: 0, // Requires separate API call for duration
      source: 'youtube' as const,
      youtubeId: item.id.videoId,
    }));
  }
}
