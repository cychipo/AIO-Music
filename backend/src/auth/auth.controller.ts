import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiProperty,
} from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserDocument } from '../common/schemas/user.schema';

class RefreshDto {
  @ApiProperty({ description: 'Refresh token nhận được lúc login/register' })
  @IsString()
  refreshToken: string;
}

class LogoutDto {
  @ApiProperty({ description: 'Refresh token cần revoke' })
  @IsString()
  refreshToken: string;
}

class GoogleOneTapDto {
  @ApiProperty({ description: 'Google id_token (credential) từ GSI One Tap' })
  @IsString()
  credential: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  // ── POST /api/v1/auth/register ────────────────────────────────────────────
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới bằng email/password' })
  @ApiResponse({ status: 201, description: 'Trả về user + accessToken + refreshToken' })
  @ApiResponse({ status: 409, description: 'Email đã được sử dụng' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ── POST /api/v1/auth/login ───────────────────────────────────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập bằng email/password' })
  @ApiResponse({ status: 200, description: 'Trả về user + accessToken + refreshToken' })
  @ApiResponse({ status: 401, description: 'Sai email/password hoặc tài khoản OAuth' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ── POST /api/v1/auth/refresh ─────────────────────────────────────────────
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy access token mới bằng refresh token (rotation)' })
  @ApiResponse({ status: 200, description: 'Trả về accessToken + refreshToken mới' })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ hoặc hết hạn' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  // ── POST /api/v1/auth/logout ──────────────────────────────────────────────
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Đăng xuất, revoke refresh token' })
  @ApiResponse({ status: 204, description: 'Đăng xuất thành công' })
  async logout(@Body() dto: LogoutDto) {
    await this.authService.logout(dto.refreshToken);
  }

  // ── GET /api/v1/auth/me ───────────────────────────────────────────────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin user đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Profile user (không có password)' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  me(@Request() req: any) {
    const user = req.user as UserDocument;
    return user.toJSON ? user.toJSON() : user;
  }

  // ── POST /api/v1/auth/google/one-tap ─────────────────────────────────────
  @Post('google/one-tap')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập bằng Google One Tap (id_token từ GSI)' })
  @ApiResponse({ status: 200, description: 'Trả về user + accessToken + refreshToken' })
  @ApiResponse({ status: 401, description: 'Credential không hợp lệ' })
  googleOneTap(@Body() dto: GoogleOneTapDto) {
    return this.authService.loginWithOneTap(dto.credential);
  }

  // ── GET /api/v1/auth/google ───────────────────────────────────────────────
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint() // Không hiện trong Swagger (redirect flow)
  // Passport tự redirect sang Google — không cần body
  googleLogin() {
    // Passport intercept trước khi vào đây
  }

  // ── GET /api/v1/auth/google/callback ─────────────────────────────────────
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
  async googleCallback(@Request() req: any, @Res() res: Response) {
    return this._handleOAuthCallback(req.user as UserDocument, res);
  }

  // ── GET /api/v1/auth/facebook ─────────────────────────────────────────────
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiExcludeEndpoint()
  facebookLogin() {
    // Passport intercept trước khi vào đây
  }

  // ── GET /api/v1/auth/facebook/callback ───────────────────────────────────
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @ApiExcludeEndpoint()
  async facebookCallback(@Request() req: any, @Res() res: Response) {
    return this._handleOAuthCallback(req.user as UserDocument, res);
  }

  // ── private ───────────────────────────────────────────────────────────────

  /**
   * Sau khi Passport xác thực OAuth thành công, issue token pair rồi
   * redirect về frontend kèm tokens trong query string.
   *
   * Frontend sẽ đọc ?accessToken=...&refreshToken=... và lưu vào localStorage.
   *
   * Production note: dùng fragment (#) hoặc một-lần-dùng state token
   * thay vì query string để tránh lộ token trong server logs.
   */
  private async _handleOAuthCallback(user: UserDocument, res: Response) {
    const tokens = await this.authService['_issueTokens'](user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    const redirectUrl = new URL('/auth/callback', frontendUrl);
    redirectUrl.searchParams.set('accessToken', tokens.accessToken);
    redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);

    return res.redirect(redirectUrl.toString());
  }
}
