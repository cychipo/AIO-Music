import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { StreamService } from './stream.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('stream')
@Controller('stream')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  /**
   * GET /stream?url=<URL bài hát>
   *
   * Nhận URL từ query string, tự động nhận diện nền tảng
   * (YouTube / Spotify / SoundCloud) và pipe luồng audio về client.
   *
   * Frontend chỉ cần gán:
   *   <audio src="/stream?url=https://youtu.be/...&token=..." />
   * hoặc gọi fetch() với Authorization header.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Stream âm thanh từ YouTube / Spotify / SoundCloud',
    description:
      'Nhận URL bài hát, nhận diện nền tảng và pipe audio stream về browser. ' +
      'Không lưu file tạm trên server.',
  })
  @ApiQuery({
    name: 'url',
    required: true,
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'URL đầy đủ của bài hát (YouTube, Spotify track, hoặc SoundCloud track)',
  })
  @ApiResponse({ status: 200, description: 'Audio stream (audio/webm hoặc audio/mpeg)' })
  @ApiResponse({ status: 400, description: 'URL không hợp lệ hoặc nền tảng không được hỗ trợ' })
  @ApiResponse({ status: 500, description: 'Lỗi nội bộ khi lấy stream' })
  async stream(
    @Query('url') url: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!url) {
      throw new BadRequestException('Query param "url" là bắt buộc.');
    }

    // Nhận diện nền tảng từ URL rồi gọi hàm tương ứng
    const platform = this.streamService.detectPlatform(url);

    switch (platform) {
      case 'youtube':
        await this.streamService.streamYouTube(url, res);
        break;

      case 'spotify':
        await this.streamService.streamSpotify(url, res);
        break;

      case 'soundcloud':
        await this.streamService.streamSoundCloud(url, res);
        break;
    }
  }
}
