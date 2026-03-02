import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, Profile } from "passport-facebook";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, "facebook") {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>("FACEBOOK_APP_ID")!,
      clientSecret: configService.get<string>("FACEBOOK_APP_SECRET")!,
      callbackURL: configService.get<string>("FACEBOOK_CALLBACK_URL")!,
      // Yêu cầu email — Facebook cần cấu hình trong App Dashboard
      profileFields: ["id", "emails", "name", "displayName", "photos"],
    });
  }

  /**
   * Passport gọi hàm này sau khi Facebook xác thực thành công.
   */
  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: Error | null, user?: any) => void,
  ): Promise<void> {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(
          new Error(
            "Facebook account không có email. Vui lòng dùng email khác.",
          ),
        );
      }

      const displayName =
        profile.displayName ||
        `${(profile as any).name?.givenName || ""} ${(profile as any).name?.familyName || ""}`.trim() ||
        email;

      const user = await this.authService.findOrCreateOAuthUser({
        email,
        displayName,
        avatar: profile.photos?.[0]?.value,
        provider: "facebook",
        providerId: profile.id,
      });

      done(null, user);
    } catch (err) {
      done(err as Error);
    }
  }
}
