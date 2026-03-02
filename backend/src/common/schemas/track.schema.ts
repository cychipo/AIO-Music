import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type TrackDocument = Track & Document;

export enum TrackSource {
  YOUTUBE = "youtube",
  SPOTIFY = "spotify",
  SOUNDCLOUD = "soundcloud",
  TIKTOK = "tiktok",
}

@Schema({ timestamps: true })
export class Track {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  artist: string;

  @Prop({ default: "" })
  album: string;

  @Prop({ default: "" })
  thumbnail: string;

  @Prop({ default: 0 })
  duration: number; // seconds

  @Prop({ required: true })
  sourceId: string; // YouTube video ID, Spotify track ID, etc.

  @Prop({ required: true, enum: TrackSource })
  source: TrackSource;

  @Prop({ default: "" })
  youtubeId: string; // Always used for streaming

  @Prop({ default: 0 })
  playCount: number;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const TrackSchema = SchemaFactory.createForClass(Track);

TrackSchema.index({ title: "text", artist: "text" });
