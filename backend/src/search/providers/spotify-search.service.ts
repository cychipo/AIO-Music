import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SearchResult } from '../search.service';

interface SpotifyToken {
  access_token: string;
  expires_at: number;
}

@Injectable()
export class SpotifySearchService {
  private readonly logger = new Logger(SpotifySearchService.name);
  private token: SpotifyToken | null = null;

  constructor(
    private http: HttpService,
    private configService: ConfigService,
  ) {}

  /**
   * Gets or refreshes Spotify client credentials token.
   */
  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expires_at) {
      return this.token.access_token;
    }

    const clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    const clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET');
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await firstValueFrom(
      this.http.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    this.token = {
      access_token: response.data.access_token,
      expires_at: Date.now() + (response.data.expires_in - 60) * 1000,
    };

    return this.token.access_token;
  }

  async search(query: string, limit = 10): Promise<SearchResult[]> {
    const token = await this.getToken();

    const response = await firstValueFrom(
      this.http.get('https://api.spotify.com/v1/search', {
        params: { q: query, type: 'track', limit },
        headers: { Authorization: `Bearer ${token}` },
      }),
    );

    return response.data.tracks.items.map((track: any) => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      thumbnail: track.album.images?.[1]?.url || '',
      duration: Math.round(track.duration_ms / 1000),
      source: 'spotify' as const,
    }));
  }

  /**
   * Gets metadata for a single Spotify track (used for YouTube mapping).
   */
  async getTrackMetadata(trackId: string): Promise<Partial<SearchResult> | null> {
    try {
      const token = await this.getToken();
      const response = await firstValueFrom(
        this.http.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      const track = response.data;
      return {
        id: track.id,
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        thumbnail: track.album.images?.[1]?.url || '',
        duration: Math.round(track.duration_ms / 1000),
        source: 'spotify',
      };
    } catch {
      return null;
    }
  }
}
