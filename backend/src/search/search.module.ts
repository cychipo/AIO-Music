import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { YoutubeSearchService } from './providers/youtube-search.service';
import { SpotifySearchService } from './providers/spotify-search.service';
import { SoundcloudSearchService } from './providers/soundcloud-search.service';

@Module({
  imports: [HttpModule],
  controllers: [SearchController],
  providers: [
    SearchService,
    YoutubeSearchService,
    SpotifySearchService,
    SoundcloudSearchService,
  ],
  exports: [SearchService],
})
export class SearchModule {}
