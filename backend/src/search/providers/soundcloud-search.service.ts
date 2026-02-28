import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SearchResult } from '../search.service';

@Injectable()
export class SoundcloudSearchService {
  private readonly logger = new Logger(SoundcloudSearchService.name);

  constructor(
    private http: HttpService,
    private configService: ConfigService,
  ) {}

  async search(query: string, limit = 10): Promise<SearchResult[]> {
    const clientId = this.configService.get<string>('SOUNDCLOUD_CLIENT_ID');

    const response = await firstValueFrom(
      this.http.get('https://api.soundcloud.com/tracks', {
        params: {
          q: query,
          limit,
          client_id: clientId,
        },
      }),
    );

    return response.data.map((track: any) => ({
      id: String(track.id),
      title: track.title,
      artist: track.user?.username || 'Unknown',
      thumbnail: track.artwork_url || '',
      duration: Math.round(track.duration / 1000),
      source: 'soundcloud' as const,
      url: track.permalink_url || '',
    }));
  }
}
