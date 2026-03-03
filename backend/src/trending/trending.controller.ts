import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { TrendingService } from "./trending.service";

/**
 * Trending API — KHÔNG yêu cầu JWT.
 *
 * Lý do: Trang Home hiển thị trending cho cả khách (guest) lẫn user đã đăng nhập.
 * Rate limiting từ ThrottlerModule (100 req/min) đủ để bảo vệ quota API keys.
 */
@ApiTags("trending")
@Controller("trending")
export class TrendingController {
  constructor(private readonly trendingService: TrendingService) {}

  /**
   * GET /trending
   * Trả về top trending từ cả 4 nền tảng song song.
   */
  @Get()
  @ApiOperation({
    summary: "Lấy top trending từ YouTube, Spotify, SoundCloud và TikTok cùng lúc",
    description:
      "Gọi 4 platform song song (forkJoin). Nếu một platform lỗi, " +
      "các platform còn lại vẫn trả về bình thường.",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    example: 10,
    description: "Số bài mỗi platform (tối đa 50)",
  })
  @ApiResponse({
    status: 200,
    description: "{ youtube[], spotify[], soundcloud[], tiktok[], fetchedAt }",
  })
  getAll(@Query("limit") limit?: string) {
    const n = Math.min(parseInt(limit || "10", 10), 50);
    return this.trendingService.getAll(n);
  }

  /**
   * GET /trending/youtube
   */
  @Get("youtube")
  @ApiOperation({
    summary: "Top trending Music trên YouTube (mostPopular + category 10)",
  })
  @ApiQuery({ name: "limit", required: false, example: 10 })
  @ApiQuery({
    name: "region",
    required: false,
    example: "VN",
    description: "ISO 3166-1 alpha-2 country code",
  })
  getYoutube(@Query("limit") limit?: string, @Query("region") region?: string) {
    const n = Math.min(parseInt(limit || "10", 10), 50);
    return this.trendingService.getYoutube(n);
  }

  /**
   * GET /trending/spotify
   */
  @Get("spotify")
  @ApiOperation({ summary: "Top trending từ Spotify Global Top 50 playlist" })
  @ApiQuery({ name: "limit", required: false, example: 10 })
  getSpotify(@Query("limit") limit?: string) {
    const n = Math.min(parseInt(limit || "10", 10), 50);
    return this.trendingService.getSpotify(n);
  }

  /**
   * GET /trending/soundcloud
   */
  @Get("soundcloud")
  @ApiOperation({ summary: "Top trending Music trên SoundCloud Charts" })
  @ApiQuery({ name: "limit", required: false, example: 10 })
  getSoundCloud(@Query("limit") limit?: string) {
    const n = Math.min(parseInt(limit || "10", 10), 50);
    return this.trendingService.getSoundCloud(n);
  }

  /**
   * GET /trending/tiktok
   */
  @Get("tiktok")
  @ApiOperation({ summary: "Top trending Music trên TikTok" })
  @ApiQuery({ name: "limit", required: false, example: 10 })
  @ApiQuery({ name: "offset", required: false, example: 0 })
  getTiktok(@Query("limit") limit?: string, @Query("offset") offset?: string) {
    const n = Math.min(parseInt(limit || "10", 10), 50);
    const o = parseInt(offset || "0", 10);
    return this.trendingService.getTiktok(n, o);
  }
}
