import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { StreamService } from './stream.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('stream')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  /**
   * GET /api/v1/stream/:youtubeId
   * Streams audio for the given YouTube video ID.
   * Requires JWT authentication.
   */
  @Get(':youtubeId')
  @UseGuards(JwtAuthGuard)
  async stream(
    @Param('youtubeId') youtubeId: string,
    @Res() res: Response,
  ) {
    await this.streamService.streamTrack(youtubeId, res);
  }

  /**
   * GET /api/v1/stream/:youtubeId/metadata
   * Returns track metadata without streaming.
   */
  @Get(':youtubeId/metadata')
  async getMetadata(@Param('youtubeId') youtubeId: string) {
    return this.streamService.getMetadata(youtubeId);
  }
}
