import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TracksService } from './tracks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('tracks')
@ApiBearerAuth('JWT')
@Controller('tracks')
@UseGuards(JwtAuthGuard)
export class TracksController {
  constructor(private tracksService: TracksService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bài hát (phân trang)' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'skip', required: false, example: 0 })
  findAll(@Query('limit') limit?: string, @Query('skip') skip?: string) {
    return this.tracksService.findAll(limit ? +limit : 20, skip ? +skip : 0);
  }

  @Get('search')
  @ApiOperation({ summary: 'Tìm kiếm bài hát trong DB' })
  @ApiQuery({ name: 'q', required: true, example: 'sơn tùng' })
  search(@Query('q') query: string) {
    return this.tracksService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một bài hát theo ID' })
  findOne(@Param('id') id: string) {
    return this.tracksService.findById(id);
  }

  @Post(':id/play')
  @ApiOperation({ summary: 'Tăng lượt nghe cho bài hát' })
  incrementPlay(@Param('id') id: string) {
    return this.tracksService.incrementPlayCount(id);
  }
}
