import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { User } from "../common/schemas/user.schema";
import { RefreshToken } from "../common/schemas/refresh-token.schema";
import { OAuthProfileDto } from "./dto/oauth-profile.dto";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeUserDoc(overrides: Partial<any> = {}) {
  const base = {
    _id: "user-id-123",
    email: "test@example.com",
    password: "hashed_password",
    displayName: "Test User",
    authProvider: "local",
    providerId: null,
    isActive: true,
    isPremium: false,
    likedTracks: [],
    save: jest.fn().mockResolvedValue(undefined),
    toJSON: jest.fn().mockReturnValue({
      _id: "user-id-123",
      email: "test@example.com",
      displayName: "Test User",
      authProvider: "local",
      isActive: true,
    }),
  };
  return { ...base, ...overrides };
}

function makeRefreshTokenDoc(overrides: Partial<any> = {}) {
  return {
    _id: "rt-id-1",
    userId: "user-id-123",
    token: "raw-refresh-token",
    revoked: false,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const googleProfile: OAuthProfileDto = {
  email: "google@example.com",
  displayName: "Google User",
  avatar: "https://photo.google.com/avatar.jpg",
  provider: "google",
  providerId: "google-sub-123",
};

// ─── AuthService Unit Tests ───────────────────────────────────────────────────

describe("AuthService", () => {
  let service: AuthService;
  let userModel: any;
  let refreshTokenModel: any;

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    refreshTokenModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: refreshTokenModel,
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue("mock-access-token") },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue("test-secret") },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── register ────────────────────────────────────────────────────────────────

  describe("register", () => {
    it("nên tạo user mới và trả về tokens khi email chưa tồn tại", async () => {
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockResolvedValue(makeUserDoc());
      refreshTokenModel.create.mockResolvedValue({});

      const result = await service.register({
        email: "test@example.com",
        password: "password123",
        displayName: "Test User",
      });

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe("mock-access-token");
      expect(result.refreshToken).toHaveLength(80); // 40 bytes hex
      expect(userModel.create).toHaveBeenCalledTimes(1);
    });

    it("nên ném ConflictException khi email đã tồn tại (bất kể provider)", async () => {
      // Email đã tồn tại với local account
      userModel.findOne.mockResolvedValue(makeUserDoc());

      await expect(
        service.register({
          email: "test@example.com",
          password: "pass123",
          displayName: "X",
        }),
      ).rejects.toThrow(ConflictException);

      expect(userModel.create).not.toHaveBeenCalled();
    });

    it("nên ném ConflictException khi email thuộc OAuth account", async () => {
      // Email đã tồn tại với OAuth account
      userModel.findOne.mockResolvedValue(
        makeUserDoc({ authProvider: "google", password: null }),
      );

      await expect(
        service.register({
          email: "test@example.com",
          password: "pass123",
          displayName: "X",
        }),
      ).rejects.toThrow(ConflictException);
    });

    it("nên hash password trước khi lưu", async () => {
      userModel.findOne.mockResolvedValue(null);
      const capturedCreate = jest.fn().mockResolvedValue(makeUserDoc());
      userModel.create = capturedCreate;
      refreshTokenModel.create.mockResolvedValue({});

      await service.register({
        email: "test@example.com",
        password: "plaintext123",
        displayName: "T",
      });

      const arg = capturedCreate.mock.calls[0][0];
      expect(arg.password).not.toBe("plaintext123");
      expect(await bcrypt.compare("plaintext123", arg.password)).toBe(true);
    });

    it("nên set authProvider = local khi register bằng email", async () => {
      userModel.findOne.mockResolvedValue(null);
      const capturedCreate = jest.fn().mockResolvedValue(makeUserDoc());
      userModel.create = capturedCreate;
      refreshTokenModel.create.mockResolvedValue({});

      await service.register({
        email: "test@example.com",
        password: "pass123",
        displayName: "T",
      });

      expect(capturedCreate.mock.calls[0][0].authProvider).toBe("local");
    });
  });

  // ── login ────────────────────────────────────────────────────────────────────

  describe("login", () => {
    it("nên trả về tokens khi credentials hợp lệ", async () => {
      const hash = await bcrypt.hash("password123", 10);
      userModel.findOne.mockResolvedValue(makeUserDoc({ password: hash }));
      refreshTokenModel.create.mockResolvedValue({});

      const result = await service.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.accessToken).toBe("mock-access-token");
      expect(result.refreshToken).toBeDefined();
    });

    it("nên ném UnauthorizedException với message gợi ý provider khi user đăng ký bằng OAuth", async () => {
      // OAuth user — password = null
      userModel.findOne.mockResolvedValue(
        makeUserDoc({ password: null, authProvider: "google" }),
      );

      await expect(
        service.login({ email: "test@example.com", password: "anypassword" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("nên ném UnauthorizedException khi password sai", async () => {
      const hash = await bcrypt.hash("correct", 10);
      userModel.findOne.mockResolvedValue(makeUserDoc({ password: hash }));

      await expect(
        service.login({ email: "test@example.com", password: "wrong" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("nên ném UnauthorizedException khi tài khoản bị vô hiệu hoá", async () => {
      const hash = await bcrypt.hash("password123", 10);
      userModel.findOne.mockResolvedValue(
        makeUserDoc({ password: hash, isActive: false }),
      );

      await expect(
        service.login({ email: "test@example.com", password: "password123" }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── findOrCreateOAuthUser ────────────────────────────────────────────────────

  describe("findOrCreateOAuthUser", () => {
    it("nên trả về user hiện có khi tìm thấy theo providerId", async () => {
      const existingUser = makeUserDoc({
        authProvider: "google",
        providerId: "google-sub-123",
      });
      // findOne lần 1 (theo providerId) → trả về user
      userModel.findOne.mockResolvedValueOnce(existingUser);

      const result = await service.findOrCreateOAuthUser(googleProfile);

      expect(result).toEqual(existingUser);
      expect(userModel.create).not.toHaveBeenCalled();
    });

    it("nên trả về user hiện có và link providerId khi email khớp nhưng chưa có providerId", async () => {
      const localUser = makeUserDoc({
        authProvider: "local",
        providerId: null,
      });
      // findOne lần 1 (theo providerId) → null
      userModel.findOne.mockResolvedValueOnce(null);
      // findOne lần 2 (theo email) → user local
      userModel.findOne.mockResolvedValueOnce(localUser);

      const result = await service.findOrCreateOAuthUser(googleProfile);

      expect(result).toEqual(localUser);
      // Đã gắn providerId
      expect(localUser.providerId).toBe("google-sub-123");
      expect(localUser.save).toHaveBeenCalled();
      expect(userModel.create).not.toHaveBeenCalled();
    });

    it("nên tạo tài khoản mới với authProvider=google khi email chưa tồn tại", async () => {
      userModel.findOne.mockResolvedValue(null);
      const newUser = makeUserDoc({
        authProvider: "google",
        providerId: "google-sub-123",
        password: null,
      });
      userModel.create.mockResolvedValue(newUser);

      const result = await service.findOrCreateOAuthUser(googleProfile);

      expect(result).toEqual(newUser);
      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "google@example.com",
          password: null,
          authProvider: "google",
          providerId: "google-sub-123",
        }),
      );
    });

    it("nên ném UnauthorizedException khi user bị vô hiệu hoá (tìm theo providerId)", async () => {
      userModel.findOne.mockResolvedValueOnce(
        makeUserDoc({
          authProvider: "google",
          providerId: "google-sub-123",
          isActive: false,
        }),
      );

      await expect(
        service.findOrCreateOAuthUser(googleProfile),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("nên ném UnauthorizedException khi user bị vô hiệu hoá (tìm theo email)", async () => {
      userModel.findOne.mockResolvedValueOnce(null);
      userModel.findOne.mockResolvedValueOnce(makeUserDoc({ isActive: false }));

      await expect(
        service.findOrCreateOAuthUser(googleProfile),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("nên normalize email về lowercase khi tạo OAuth user", async () => {
      userModel.findOne.mockResolvedValue(null);
      const capturedCreate = jest.fn().mockResolvedValue(makeUserDoc());
      userModel.create = capturedCreate;

      await service.findOrCreateOAuthUser({
        ...googleProfile,
        email: "Google@EXAMPLE.COM",
      });

      expect(capturedCreate.mock.calls[0][0].email).toBe("google@example.com");
    });
  });

  // ── refresh ──────────────────────────────────────────────────────────────────

  describe("refresh", () => {
    it("nên trả về token mới và revoke token cũ", async () => {
      const rtDoc = makeRefreshTokenDoc();
      userModel.findById.mockResolvedValue(makeUserDoc());
      refreshTokenModel.findOne.mockResolvedValue(rtDoc);
      refreshTokenModel.create.mockResolvedValue({});

      const result = await service.refresh("raw-refresh-token");

      expect(result.accessToken).toBe("mock-access-token");
      expect(rtDoc.revoked).toBe(true);
      expect(rtDoc.save).toHaveBeenCalled();
    });

    it("nên ném UnauthorizedException khi token không tồn tại", async () => {
      refreshTokenModel.findOne.mockResolvedValue(null);
      await expect(service.refresh("bad")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("nên ném UnauthorizedException khi token đã bị revoke", async () => {
      refreshTokenModel.findOne.mockResolvedValue(
        makeRefreshTokenDoc({ revoked: true }),
      );
      await expect(service.refresh("revoked")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("nên ném UnauthorizedException khi token hết hạn", async () => {
      refreshTokenModel.findOne.mockResolvedValue(
        makeRefreshTokenDoc({ expiresAt: new Date(Date.now() - 1000) }),
      );
      await expect(service.refresh("expired")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── logout ───────────────────────────────────────────────────────────────────

  describe("logout", () => {
    it("nên revoke refresh token", async () => {
      refreshTokenModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await service.logout("raw-refresh-token");

      expect(refreshTokenModel.updateOne).toHaveBeenCalledWith(
        { token: "raw-refresh-token" },
        { $set: { revoked: true } },
      );
    });

    it("nên idempotent (không throw) khi token không tồn tại", async () => {
      refreshTokenModel.updateOne.mockResolvedValue({ modifiedCount: 0 });
      await expect(service.logout("nonexistent")).resolves.not.toThrow();
    });
  });

  // ── validateUser ──────────────────────────────────────────────────────────────

  describe("validateUser", () => {
    it("nên trả về user khi credentials đúng", async () => {
      const hash = await bcrypt.hash("password123", 10);
      const user = makeUserDoc({ password: hash });
      userModel.findOne.mockResolvedValue(user);

      const result = await service.validateUser(
        "test@example.com",
        "password123",
      );
      expect(result).toEqual(user);
    });

    it("nên tìm kiếm theo email lowercase", async () => {
      const hash = await bcrypt.hash("pass", 10);
      userModel.findOne.mockResolvedValue(makeUserDoc({ password: hash }));

      await service.validateUser("TEST@EXAMPLE.COM", "pass");

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: "test@example.com",
      });
    });
  });

  // ── validateById ──────────────────────────────────────────────────────────────

  describe("validateById", () => {
    it("nên trả về user khi active", async () => {
      userModel.findById.mockResolvedValue(makeUserDoc());
      const result = await service.validateById("user-id-123");
      expect(result._id).toBe("user-id-123");
    });

    it("nên ném UnauthorizedException khi user không tồn tại", async () => {
      userModel.findById.mockResolvedValue(null);
      await expect(service.validateById("bad-id")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("nên ném UnauthorizedException khi user bị deactivate", async () => {
      userModel.findById.mockResolvedValue(makeUserDoc({ isActive: false }));
      await expect(service.validateById("user-id-123")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
