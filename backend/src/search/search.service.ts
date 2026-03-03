import { Injectable, Logger } from "@nestjs/common";
import { forkJoin, from, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { YoutubeSearchService } from "./providers/youtube-search.service";
import { SpotifySearchService } from "./providers/spotify-search.service";
import { SoundcloudSearchService } from "./providers/soundcloud-search.service";
import { TiktokSearchService } from "./providers/tiktok-search.service";

export interface SearchResult {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  source: "youtube" | "spotify" | "soundcloud" | "tiktok";
  youtubeId?: string; // Resolved for Spotify tracks
  url?: string; // Permalink (SoundCloud, etc.)
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private youtubeSearch: YoutubeSearchService,
    private spotifySearch: SpotifySearchService,
    private soundcloudSearch: SoundcloudSearchService,
    private tiktokSearch: TiktokSearchService,
  ) {}

  /**
   * Searches all sources concurrently using RxJS forkJoin.
   * Failures in individual sources are caught and return empty arrays.
   */
  async searchAll(query: string, limit = 10): Promise<SearchResult[]> {
    const results = await forkJoin({
      youtube: from(this.youtubeSearch.search(query, limit)).pipe(
        catchError((err) => {
          this.logger.warn(`YouTube search failed: ${err.message}`);
          return of([]);
        }),
      ),
      spotify: from(this.spotifySearch.search(query, limit)).pipe(
        catchError((err) => {
          this.logger.warn(`Spotify search failed: ${err.message}`);
          return of([]);
        }),
      ),
      soundcloud: from(this.soundcloudSearch.search(query, limit)).pipe(
        catchError((err) => {
          this.logger.warn(`SoundCloud search failed: ${err.message}`);
          return of([]);
        }),
      ),
      tiktok: from(this.tiktokSearch.search(query, limit)).pipe(
        catchError((err) => {
          this.logger.warn(`TikTok search failed: ${err.message}`);
          return of([]);
        }),
      ),
    }).toPromise();

    // Merge and deduplicate by title+artist
    const all = [
      ...(results.youtube || []),
      ...(results.spotify || []),
      ...(results.soundcloud || []),
      ...(results.tiktok || []),
    ];

    return all;
  }

  async searchYoutube(query: string, limit = 10): Promise<SearchResult[]> {
    return this.youtubeSearch.search(query, limit);
  }

  async searchSpotify(query: string, limit = 10): Promise<SearchResult[]> {
    return this.spotifySearch.search(query, limit);
  }

  async searchSoundcloud(query: string, limit = 10): Promise<SearchResult[]> {
    return this.soundcloudSearch.search(query, limit);
  }

  async searchTiktok(query: string, limit = 10): Promise<SearchResult[]> {
    return this.tiktokSearch.search(query, limit);
  }

  /**
   * Spotify Workaround: Get Spotify metadata then find matching YouTube stream.
   */
  async resolveSpotifyToYoutube(
    spotifyTrackId: string,
  ): Promise<SearchResult | null> {
    const meta = await this.spotifySearch.getTrackMetadata(spotifyTrackId);
    if (!meta) return null;

    const query = `${meta.title} ${meta.artist} official audio`;
    const youtubeResults = await this.youtubeSearch.search(query, 1);
    if (!youtubeResults.length) return null;

    return {
      id: meta.id,
      title: meta.title,
      artist: meta.artist,
      thumbnail: meta.thumbnail,
      duration: meta.duration,
      source: "spotify" as const,
      youtubeId: youtubeResults[0].id,
    };
  }
}
