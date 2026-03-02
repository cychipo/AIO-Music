import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { SearchResult } from "../search.service";
import { Innertube } from "youtubei.js";

interface SpotifyToken {
  access_token: string;
  expires_at: number;
}

/**
 * Lấy kết quả tìm kiếm Spotify qua Web API.
 * Spotify app đang ở Development Mode -> API Spotify chỉ trả về 403.
 * Giải pháp: dùng youtubei.js search YouTube mô phỏng kết quả của Spotify.
 * Source trả về là "spotify".
 */
@Injectable()
export class SpotifySearchService implements OnModuleInit {
  private readonly logger = new Logger(SpotifySearchService.name);
  private token: SpotifyToken | null = null;
  private yt: Innertube;

  constructor(
    private http: HttpService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.yt = await Innertube.create();
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expires_at) {
      return this.token.access_token;
    }

    const clientId = this.configService.get<string>("SPOTIFY_CLIENT_ID");
    const clientSecret = this.configService.get<string>(
      "SPOTIFY_CLIENT_SECRET",
    );
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );

    const response = await firstValueFrom(
      this.http.post(
        "https://accounts.spotify.com/api/token",
        "grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
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
    this.logger.log(
      `[Spotify] Searching tracks (query: "${query}") via youtube proxy with limit ${limit}`,
    );
    try {
      let results: any = await this.yt.music.search(`${query} audio`, {
        type: "song",
      });

      if (!results.contents) return [];

      let list = (results.contents[0] as any)?.contents || results.contents;

      while (list.length < limit && results.has_continuation) {
        results = await results.getContinuation();
        list = list.concat(results.contents || []);
      }

      const tracks = (list as any[])
        .filter((item: any) => {
          const dur = item.duration?.seconds ?? 0;
          return dur > 0 && dur <= 900; // max 15 minutes
        })
        .slice(0, limit)
        .map((item: any): SearchResult => {
          let artistName = "Unknown";
          if (Array.isArray(item.artists) && item.artists.length > 0) {
            artistName = item.artists.map((a: any) => a.name).join(", ");
          } else if (Array.isArray(item.authors) && item.authors.length > 0) {
            artistName = item.authors.map((a: any) => a.name).join(", ");
          } else if (item.author?.name) {
            artistName = item.author.name;
          }

          return {
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

      return tracks;
    } catch (error: any) {
      this.logger.error(`[Spotify] Search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Gets metadata for a single Spotify track (used for YouTube mapping).
   */
  async getTrackMetadata(trackId: string): Promise<SearchResult | null> {
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
        artist: track.artists.map((a: any) => a.name).join(", "),
        thumbnail: track.album.images?.[1]?.url || "",
        duration: Math.round(track.duration_ms / 1000),
        source: "spotify",
      };
    } catch {
      return null;
    }
  }
}
