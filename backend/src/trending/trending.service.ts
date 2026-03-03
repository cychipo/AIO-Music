import { Injectable, Logger } from "@nestjs/common";
import { forkJoin, from, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { YoutubeTrendingService } from "./providers/youtube-trending.service";
import { SpotifyTrendingService } from "./providers/spotify-trending.service";
import { SoundcloudTrendingService } from "./providers/soundcloud-trending.service";
import { TiktokTrendingService } from "./providers/tiktok-trending.service";

export interface TrendingTrack {
  rank: number;
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number; // seconds
  source: "youtube" | "spotify" | "soundcloud" | "tiktok";
  youtubeId?: string; // chỉ có với YouTube tracks
  previewUrl?: string; // chỉ có với Spotify tracks (30s preview)
  url: string; // link gốc đến platform
  viewCount?: number; // YouTube
  playCount?: number; // SoundCloud
}

export interface TrendingResponse {
  youtube: TrendingTrack[];
  spotify: TrendingTrack[];
  soundcloud: TrendingTrack[];
  tiktok: TrendingTrack[];
  fetchedAt: string; // ISO timestamp để client biết khi nào data được lấy
}

@Injectable()
export class TrendingService {
  private readonly logger = new Logger(TrendingService.name);

  constructor(
    private readonly youtubeTrending: YoutubeTrendingService,
    private readonly spotifyTrending: SpotifyTrendingService,
    private readonly soundcloudTrending: SoundcloudTrendingService,
    private readonly tiktokTrending: TiktokTrendingService,
  ) {}

  /**
   * Lấy trending song song từ cả 4 nền tảng.
   * Lỗi từng nguồn riêng lẻ được catch — không crash toàn bộ response.
   */
  async getAll(limit = 10): Promise<TrendingResponse> {
    this.logger.log(`Fetching trending top ${limit} from all platforms`);

    const results = await forkJoin({
      youtube: from(this.youtubeTrending.getTrending(limit)).pipe(
        catchError((err) => {
          this.logger.warn(`YouTube trending failed: ${err.message}`);
          return of([] as TrendingTrack[]);
        }),
      ),
      spotify: from(this.spotifyTrending.getTrending(limit)).pipe(
        catchError((err) => {
          this.logger.warn(`Spotify trending failed: ${err.message}`);
          return of([] as TrendingTrack[]);
        }),
      ),
      soundcloud: from(this.soundcloudTrending.getTrending(limit)).pipe(
        catchError((err) => {
          this.logger.warn(`SoundCloud trending failed: ${err.message}`);
          return of([] as TrendingTrack[]);
        }),
      ),
      tiktok: from(this.tiktokTrending.getTrending(limit)).pipe(
        catchError((err) => {
          this.logger.warn(`TikTok trending failed: ${err.message}`);
          return of([] as TrendingTrack[]);
        }),
      ),
    }).toPromise();

    return {
      youtube: results.youtube || [],
      spotify: results.spotify || [],
      soundcloud: results.soundcloud || [],
      tiktok: results.tiktok || [],
      fetchedAt: new Date().toISOString(),
    };
  }

  async getYoutube(limit = 10): Promise<TrendingTrack[]> {
    return this.youtubeTrending.getTrending(limit);
  }

  async getSpotify(limit = 10): Promise<TrendingTrack[]> {
    return this.spotifyTrending.getTrending(limit);
  }

  async getSoundCloud(limit = 10): Promise<TrendingTrack[]> {
    return this.soundcloudTrending.getTrending(limit);
  }

  async getTiktok(limit = 10, offset = 0): Promise<TrendingTrack[]> {
    return this.tiktokTrending.getTrending(limit, offset);
  }
}
