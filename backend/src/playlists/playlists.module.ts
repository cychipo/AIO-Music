import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PlaylistsController } from "./playlists.controller";
import { PlaylistsService } from "./playlists.service";
import { Playlist, PlaylistSchema } from "../common/schemas/playlist.schema";
import { Track, TrackSchema } from "../common/schemas/track.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Playlist.name, schema: PlaylistSchema },
      { name: Track.name, schema: TrackSchema },
    ]),
  ],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}
