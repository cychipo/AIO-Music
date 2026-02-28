import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// ─── Stub Data ────────────────────────────────────────────────────────────────

const mockUser = {
  _id: 'user-id-123',
  email: 'test@example.com',
  displayName: 'Test User',
  authProvider: 'local',
};

const mockAuthResponse = {
  user: mockUser,
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

const mockTokens = {
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
};

// ─── AuthController Unit Tests ────────────────────────────────────────────────

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      loginWithOAuth: jest.fn(),
      validateUser: jest.fn(),
      validateById: jest.fn(),
      // Cần expose _issueTokens cho OAuth callback test
      _issueTokens: jest.fn().mockResolvedValue(mockTokens),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'FRONTEND_URL') return 'http://localhost:5173';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── register ──────────────────────────────────────────────────────────────────

  describe('POST /register', () => {
    const dto = { email: 'test@example.com', password: 'password123', displayName: 'Test User' };

    it('nên trả về user + tokens khi đăng ký thành công', async () => {
      authService.register.mockResolvedValue(mockAuthResponse as any);

      const result = await controller.register(dto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.register).toHaveBeenCalledWith(dto);
    });

    it('nên bubble up ConflictException khi email đã tồn tại', async () => {
      authService.register.mockRejectedValue(new ConflictException('Email này đã được sử dụng'));

      await expect(controller.register(dto)).rejects.toThrow(ConflictException);
    });

    it('nên bubble up ConflictException khi email thuộc OAuth account', async () => {
      authService.register.mockRejectedValue(
        new ConflictException('Email này đã được sử dụng'),
      );

      await expect(controller.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  // ── login ──────────────────────────────────────────────────────────────────────

  describe('POST /login', () => {
    const dto = { email: 'test@example.com', password: 'password123' };

    it('nên trả về user + tokens khi đăng nhập thành công', async () => {
      authService.login.mockResolvedValue(mockAuthResponse as any);

      const result = await controller.login(dto);

      expect(result).toEqual(mockAuthResponse);
    });

    it('nên bubble up UnauthorizedException khi credentials sai', async () => {
      authService.login.mockRejectedValue(new UnauthorizedException('Email hoặc mật khẩu không đúng'));

      await expect(controller.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('nên bubble up UnauthorizedException với thông báo gợi ý OAuth provider', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('Tài khoản này được đăng ký qua google. Vui lòng đăng nhập bằng google.'),
      );

      const err = await controller.login(dto).catch((e) => e);
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect(err.message).toContain('google');
    });
  });

  // ── refresh ────────────────────────────────────────────────────────────────────

  describe('POST /refresh', () => {
    it('nên trả về token mới', async () => {
      authService.refresh.mockResolvedValue(mockTokens);

      const result = await controller.refresh({ refreshToken: 'old-token' });

      expect(result).toEqual(mockTokens);
      expect(authService.refresh).toHaveBeenCalledWith('old-token');
    });

    it('nên bubble up UnauthorizedException', async () => {
      authService.refresh.mockRejectedValue(new UnauthorizedException());

      await expect(controller.refresh({ refreshToken: 'bad' })).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── logout ──────────────────────────────────────────────────────────────────────

  describe('POST /logout', () => {
    it('nên gọi logout và trả về undefined (204)', async () => {
      authService.logout.mockResolvedValue(undefined);

      const result = await controller.logout({ refreshToken: 'token' });

      expect(result).toBeUndefined();
      expect(authService.logout).toHaveBeenCalledWith('token');
    });

    it('nên idempotent khi token không tồn tại', async () => {
      authService.logout.mockResolvedValue(undefined);

      await expect(controller.logout({ refreshToken: 'nonexistent' })).resolves.not.toThrow();
    });
  });

  // ── me ──────────────────────────────────────────────────────────────────────────

  describe('GET /me', () => {
    it('nên trả về profile user (không có password)', () => {
      const req = {
        user: {
          ...mockUser,
          password: 'should-be-stripped',
          toJSON: jest.fn().mockReturnValue(mockUser),
        },
      };

      const result = controller.me(req);

      expect(result).toEqual(mockUser);
      expect((result as any).password).toBeUndefined();
    });

    it('nên trả về req.user trực tiếp nếu không có toJSON', () => {
      const result = controller.me({ user: mockUser });

      expect(result).toEqual(mockUser);
    });
  });

  // ── OAuth callback ─────────────────────────────────────────────────────────────

  describe('OAuth callbacks', () => {
    function makeMockRes() {
      return { redirect: jest.fn() };
    }

    it('googleCallback nên redirect về frontend với tokens trong query string', async () => {
      const res = makeMockRes();
      // Expose private method via bracket notation trong test
      (authService as any)['_issueTokens'] = jest.fn().mockResolvedValue(mockTokens);

      await controller.googleCallback({ user: mockUser }, res as any);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth/callback'),
      );
      const redirectUrl = res.redirect.mock.calls[0][0];
      expect(redirectUrl).toContain('accessToken=');
      expect(redirectUrl).toContain('refreshToken=');
    });

    it('facebookCallback nên redirect về frontend với tokens trong query string', async () => {
      const res = makeMockRes();
      (authService as any)['_issueTokens'] = jest.fn().mockResolvedValue(mockTokens);

      await controller.facebookCallback({ user: mockUser }, res as any);

      const redirectUrl = res.redirect.mock.calls[0][0];
      expect(redirectUrl).toContain('http://localhost:5173/auth/callback');
    });
  });
});
