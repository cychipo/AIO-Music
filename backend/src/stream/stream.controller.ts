import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { Response } from "express";
import { StreamService } from "./stream.service";

@ApiTags("stream")
@Controller("stream")
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  /**
   * GET /stream?url=<URL bài hát>
   *
   * Nhận URL từ query string, tự động nhận diện nền tảng
   * (Spotify / SoundCloud / TikTok) và pipe luồng audio về client.
   *
   * YouTube không cần qua đây — được xử lý trực tiếp bởi
   * YouTube IFrame Player API ở frontend (trừ search results dùng cho TikTok).
   */
  @Get()
  @ApiOperation({
    summary: "Stream âm thanh từ Spotify / SoundCloud / TikTok / YouTube",
    description:
      "Nhận URL bài hát, nhận diện nền tảng và pipe audio stream về browser. " +
      "YouTube được xử lý bởi IFrame API ở frontend (ngoại trừ search results cho TikTok).",
  })
  @ApiQuery({
    name: "url",
    required: true,
    example: "https://soundcloud.com/artist/track",
    description: "URL đầy đủ của bài hát (Spotify track, SoundCloud track, TikTok, hoặc YouTube search)",
  })
  @ApiResponse({ status: 200, description: "Audio stream (audio/mpeg)" })
  @ApiResponse({
    status: 400,
    description: "URL không hợp lệ hoặc nền tảng không được hỗ trợ",
  })
  @ApiResponse({ status: 500, description: "Lỗi nội bộ khi lấy stream" })
  async stream(@Query("url") url: string, @Res() res: Response): Promise<void> {
    if (!url) {
      throw new BadRequestException('Query param "url" là bắt buộc.');
    }

    const platform = this.streamService.detectPlatform(url);

    switch (platform) {
      case "youtube":
        // For YouTube watch URLs - use IFrame API (handled at frontend)
        if (url.includes("/watch?v=") || url.includes("youtu.be/")) {
          throw new BadRequestException(
            "YouTube không được stream qua backend. Sử dụng YouTube IFrame Player API ở frontend.",
          );
        }
        // For YouTube search results URL (TikTok fallback) - stream via backend
        await this.streamService.streamYouTube(url, res);
        break;

      case "spotify":
        await this.streamService.streamSpotify(url, res);
        break;

      case "soundcloud":
        await this.streamService.streamSoundCloud(url, res);
        break;

      case "tiktok":
        await this.streamService.streamTiktok(url, res);
        break;
    }
  }
}
