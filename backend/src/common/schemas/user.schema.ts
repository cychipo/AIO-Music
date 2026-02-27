import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ type: [String], default: [] })
  likedTracks: string[];

  @Prop({ default: false })
  isPremium: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Remove password from JSON output
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};
