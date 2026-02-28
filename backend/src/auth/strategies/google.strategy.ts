import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile'],
    });
  }

  /**
   * Passport gọi hàm này sau khi Google xác thực thành công.
   * Chúng ta map profile → OAuthProfileDto rồi giao cho AuthService xử lý.
   */
  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('Google account không có email'), undefined);
      }

      const user = await this.authService.findOrCreateOAuthUser({
        email,
        displayName: profile.displayName ?? email,
        avatar: profile.photos?.[0]?.value,
        provider: 'google',
        providerId: profile.id,
      });

      done(null, user);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
}
