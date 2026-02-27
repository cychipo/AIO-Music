import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TracksService } from './tracks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tracks')
@UseGuards(JwtAuthGuard)
export class TracksController {
  constructor(private tracksService: TracksService) {}

  @Get()
  findAll(@Query('limit') limit?: string, @Query('skip') skip?: string) {
    return this.tracksService.findAll(limit ? +limit : 20, skip ? +skip : 0);
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.tracksService.search(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tracksService.findById(id);
  }

  @Post(':id/play')
  incrementPlay(@Param('id') id: string) {
    return this.tracksService.incrementPlayCount(id);
  }
}
