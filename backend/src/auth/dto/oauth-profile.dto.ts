import { AuthProvider } from "../../common/schemas/user.schema";

/**
 * Profile OAuth chuẩn hóa — được map từ Google / Facebook profile
 * trước khi truyền vào AuthService.findOrCreateOAuthUser().
 */
export interface OAuthProfileDto {
  /** Email từ provider — bắt buộc */
  email: string;
  /** Tên hiển thị */
  displayName: string;
  /** URL ảnh đại diện từ provider */
  avatar?: string;
  /** Provider: 'google' | 'facebook' */
  provider: AuthProvider;
  /** ID unique của user trên provider đó */
  providerId: string;
}
