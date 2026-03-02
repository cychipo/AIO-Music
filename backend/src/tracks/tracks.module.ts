import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { TracksController } from "./tracks.controller";
import { TracksService } from "./tracks.service";
import { Track, TrackSchema } from "../common/schemas/track.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Track.name, schema: TrackSchema }]),
  ],
  controllers: [TracksController],
  providers: [TracksService],
  exports: [TracksService],
})
export class TracksModule {}
