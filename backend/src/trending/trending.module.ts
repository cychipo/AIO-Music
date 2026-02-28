import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TrendingController } from './trending.controller';
import { TrendingService } from './trending.service';
import { YoutubeTrendingService } from './providers/youtube-trending.service';
import { SpotifyTrendingService } from './providers/spotify-trending.service';
import { SoundcloudTrendingService } from './providers/soundcloud-trending.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
  ],
  controllers: [TrendingController],
  providers: [
    TrendingService,
    YoutubeTrendingService,
    SpotifyTrendingService,
    SoundcloudTrendingService,
  ],
  exports: [TrendingService],
})
export class TrendingModule {}
