import { Module } from "@nestjs/common";
import { TrendingController } from "./trending.controller";
import { TrendingService } from "./trending.service";
import { YoutubeTrendingService } from "./providers/youtube-trending.service";
import { SpotifyTrendingService } from "./providers/spotify-trending.service";
import { SoundcloudTrendingService } from "./providers/soundcloud-trending.service";
import { TiktokTrendingService } from "./providers/tiktok-trending.service";

@Module({
  controllers: [TrendingController],
  providers: [
    TrendingService,
    YoutubeTrendingService,
    SpotifyTrendingService,
    SoundcloudTrendingService,
    TiktokTrendingService,
  ],
  exports: [TrendingService],
})
export class TrendingModule {}
