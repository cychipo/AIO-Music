import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlaylistDocument = Playlist & Document;

@Schema({ timestamps: true })
export class Playlist {
  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  thumbnail: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Track' }], default: [] })
  tracks: Types.ObjectId[];

  @Prop({ default: false })
  isPublic: boolean;
}

export const PlaylistSchema = SchemaFactory.createForClass(Playlist);
