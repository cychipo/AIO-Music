import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document;

/** Nguồn gốc tài khoản — local = đăng ký bằng email/password */
export type AuthProvider = "local" | "google" | "facebook";

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  /**
   * Nullable: user đăng ký qua OAuth không có password.
   * Không dùng `required: true` để tránh validation lỗi khi tạo OAuth user.
   */
  @Prop({ default: null })
  password: string | null;

  @Prop({ required: true, trim: true })
  displayName: string;

  @Prop({ default: "" })
  avatar: string;

  /**
   * Nguồn đăng ký: 'local' | 'google' | 'facebook'
   * Index để tìm kiếm nhanh khi tổ hợp email + provider.
   */
  @Prop({
    type: String,
    enum: ["local", "google", "facebook"],
    default: "local",
    index: true,
  })
  authProvider: AuthProvider;

  /**
   * ID của user trên provider bên ngoài (Google sub, Facebook id).
   * null nếu là local account.
   */
  @Prop({ default: null, index: true })
  providerId: string | null;

  @Prop({ type: [String], default: [] })
  likedTracks: string[];

  @Prop({ default: false })
  isPremium: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Compound index: tìm user theo email + provider hiệu quả
UserSchema.index({ email: 1, authProvider: 1 });

// Loại bỏ password khỏi JSON output — không bao giờ leak ra client
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};
