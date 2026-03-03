import { Injectable, Logger } from "@nestjs/common";
import { exec } from "child_process";
import { promisify } from "util";
import { SearchResult } from "../search.service";

const execAsync = promisify(exec);

@Injectable()
export class TiktokSearchService {
  private readonly logger = new Logger(TiktokSearchService.name);

  async search(query: string, limit = 10): Promise<SearchResult[]> {
    try {
      this.logger.log(`[TikTok] Searching with yt-dlp for: ${query}`);

      const results: SearchResult[] = [];

      // Use yt-dlp to search on YouTube for TikTok-related content
      try {
        const { stdout } = await execAsync(
          `python3 -m yt_dlp "ytsearch${limit}:${query} tiktok" --flat-playlist --no-download --dump-json 2>/dev/null`,
          { timeout: 30000 }
        );

        const jsonLines = stdout.trim().split("\n").filter(Boolean);
        
        for (const jsonLine of jsonLines) {
          try {
            const data = JSON.parse(jsonLine);
            
            const id = data.id;
            const title = data.title;
            
            if (id && title && title !== "[Deleted video]") {
              // Get best thumbnail
              let thumbnail = "";
              if (data.thumbnail) {
                thumbnail = data.thumbnail;
              } else if (data.thumbnails && Array.isArray(data.thumbnails)) {
                const thumbs = data.thumbnails.sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
                thumbnail = thumbs[0]?.url || "";
              }

              results.push({
                id,
                title,
                artist: data.uploader || "Unknown",
                thumbnail,
                duration: data.duration || 0,
                source: "tiktok",
                url: `https://www.youtube.com/watch?v=${id}`,
              });
            }
          } catch (parseError) {
            // Skip invalid JSON lines
          }
        }
      } catch (e: any) {
        this.logger.warn(`[TikTok] yt-dlp search failed: ${e.message}`);
      }

      if (results.length > 0) {
        return results.slice(0, limit);
      }

      return this.getFallbackSearch(query, limit);
    } catch (error: any) {
      this.logger.error(`[TikTok] Search error: ${error.message}`);
      return this.getFallbackSearch(query, limit);
    }
  }

  private getFallbackSearch(query: string, limit: number): SearchResult[] {
    const results: SearchResult[] = [];
    for (let i = 0; i < Math.min(limit, 3); i++) {
      results.push({
        id: `fallback-${i}`,
        title: `${query} - TikTok`,
        artist: "TikTok",
        thumbnail: "",
        duration: 0,
        source: "tiktok",
        url: "https://www.tiktok.com",
      });
    }
    return results;
  }
}
