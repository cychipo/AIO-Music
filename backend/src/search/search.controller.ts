import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  searchAll(@Query('q') query: string, @Query('limit') limit?: string) {
    return this.searchService.searchAll(query, limit ? +limit : 10);
  }

  @Get('youtube')
  @UseGuards(JwtAuthGuard)
  searchYoutube(@Query('q') query: string, @Query('limit') limit?: string) {
    return this.searchService.searchYoutube(query, limit ? +limit : 10);
  }

  @Get('spotify')
  @UseGuards(JwtAuthGuard)
  searchSpotify(@Query('q') query: string, @Query('limit') limit?: string) {
    return this.searchService.searchSpotify(query, limit ? +limit : 10);
  }
}
