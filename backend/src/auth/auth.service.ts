import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { User, UserDocument } from "../common/schemas/user.schema";
import {
  RefreshToken,
  RefreshTokenDocument,
} from "../common/schemas/refresh-token.schema";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { OAuthProfileDto } from "./dto/oauth-profile.dto";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Omit<UserDocument, "password">;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ── register (email + password) ───────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.toLowerCase();

    // Kiểm tra email đã tồn tại chưa — bất kể provider nào
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new ConflictException("Email này đã được sử dụng");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      displayName: dto.displayName,
      authProvider: "local",
    });

    const tokens = await this._issueTokens(user);
    return { user: user.toJSON() as any, ...tokens };
  }

  // ── login (email + password) ──────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(dto.email, dto.password);
    const tokens = await this._issueTokens(user);
    return { user: user.toJSON() as any, ...tokens };
  }

  // ── loginWithOneTap — verify Google id_token từ GSI One Tap ─────────────

  async loginWithOneTap(credential: string): Promise<AuthResponse> {
    const clientId = this.configService.get<string>("GOOGLE_CLIENT_ID");
    if (!clientId)
      throw new UnauthorizedException("Google Client ID chưa được cấu hình");

    const oauthClient = new OAuth2Client(clientId);

    let payload: any;
    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException(
        "Google credential không hợp lệ hoặc đã hết hạn",
      );
    }

    if (!payload?.email) {
      throw new UnauthorizedException(
        "Không thể lấy email từ Google credential",
      );
    }

    const profile: OAuthProfileDto = {
      email: payload.email,
      displayName: payload.name || payload.email,
      avatar: payload.picture,
      provider: "google",
      providerId: payload.sub,
    };

    return this.loginWithOAuth(profile);
  }

  // ── loginWithOAuth — dùng sau khi Passport callback xác thực xong ─────────

  async loginWithOAuth(profile: OAuthProfileDto): Promise<AuthResponse> {
    const user = await this.findOrCreateOAuthUser(profile);
    const tokens = await this._issueTokens(user);
    return { user: user.toJSON() as any, ...tokens };
  }

  // ── findOrCreateOAuthUser ─────────────────────────────────────────────────
  /**
   * Logic:
   * 1. Tìm user theo providerId + provider → đã link, đăng nhập luôn.
   * 2. Tìm user theo email → email tồn tại (local hoặc provider khác):
   *    - Nếu là cùng provider → cập nhật providerId (edge case: user cũ không có providerId).
   *    - Nếu khác provider → KHÔNG tạo account mới, đăng nhập vào account hiện có
   *      (merge implicit: một email = một account duy nhất).
   * 3. Không có gì → tạo tài khoản mới với authProvider = provider.
   */
  async findOrCreateOAuthUser(profile: OAuthProfileDto): Promise<UserDocument> {
    const { email, displayName, avatar, provider, providerId } = profile;
    const normalizedEmail = email.toLowerCase();

    // 1. Tìm theo providerId trước (nhanh nhất, chính xác nhất)
    let user = await this.userModel.findOne({
      providerId,
      authProvider: provider,
    });
    if (user) {
      if (!user.isActive)
        throw new UnauthorizedException("Tài khoản đã bị vô hiệu hoá");
      return user;
    }

    // 2. Tìm theo email
    user = await this.userModel.findOne({ email: normalizedEmail });
    if (user) {
      if (!user.isActive)
        throw new UnauthorizedException("Tài khoản đã bị vô hiệu hoá");

      // Gắn providerId nếu chưa có (ví dụ: user đăng ký local rồi sau đó dùng Google
      // với cùng email → liên kết ngầm)
      if (!user.providerId) {
        user.providerId = providerId;
        // Không đổi authProvider để giữ thông tin gốc (local)
        if (avatar && !user.avatar) user.avatar = avatar;
        await user.save();
      }
      return user;
    }

    // 3. Tạo tài khoản mới — không có password (OAuth user)
    const newUser = await this.userModel.create({
      email: normalizedEmail,
      password: null,
      displayName,
      avatar: avatar ?? "",
      authProvider: provider,
      providerId,
    });

    return newUser;
  }

  // ── refresh ───────────────────────────────────────────────────────────────

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const stored = await this.refreshTokenModel.findOne({
      token: rawRefreshToken,
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException(
        "Refresh token không hợp lệ hoặc đã hết hạn",
      );
    }

    // Rotation — revoke token cũ ngay lập tức
    stored.revoked = true;
    await stored.save();

    const user = await this.userModel.findById(stored.userId);
    if (!user || !user.isActive)
      throw new UnauthorizedException("Tài khoản không hợp lệ");

    return this._issueTokens(user);
  }

  // ── logout ────────────────────────────────────────────────────────────────

  async logout(rawRefreshToken: string): Promise<void> {
    await this.refreshTokenModel.updateOne(
      { token: rawRefreshToken },
      { $set: { revoked: true } },
    );
  }

  // ── validateUser (dùng cho local strategy + login endpoint) ──────────────

  async validateUser(email: string, password: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user)
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");

    // OAuth user không có password — không thể đăng nhập bằng email/password
    if (!user.password) {
      throw new UnauthorizedException(
        `Tài khoản này được đăng ký qua ${user.authProvider}. Vui lòng đăng nhập bằng ${user.authProvider}.`,
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");

    if (!user.isActive)
      throw new UnauthorizedException("Tài khoản đã bị vô hiệu hoá");

    return user;
  }

  // ── validateById (dùng trong JWT strategy) ────────────────────────────────

  async validateById(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.isActive) throw new UnauthorizedException();
    return user;
  }

  // ── private helpers ───────────────────────────────────────────────────────

  generateAccessToken(user: UserDocument): string {
    return this.jwtService.sign({
      sub: user._id.toString(),
      email: user.email,
    });
  }

  private async _issueTokens(user: UserDocument): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(user);

    // Refresh token — opaque random string, 30 ngày TTL
    const rawToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.refreshTokenModel.create({
      userId: user._id,
      token: rawToken,
      expiresAt,
    });

    return { accessToken, refreshToken: rawToken };
  }
}
