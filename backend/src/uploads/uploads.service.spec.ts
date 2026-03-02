import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { UploadsService } from "./uploads.service";
import {
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";

const mockS3Send = jest.fn();

// Mock S3Client
jest.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockS3Send,
    })),
    PutObjectCommand: jest.fn(),
  };
});

describe("UploadsService", () => {
  let service: UploadsService;
  let configService: ConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case "R2_ACCOUNT_ID":
                  return "test-account-id";
                case "R2_ACCESS_KEY_ID":
                  return "test-access-key";
                case "R2_SECRET_ACCESS_KEY":
                  return "test-secret-key";
                case "R2_BUCKET_NAME":
                  return "test-bucket";
                case "R2_PUBLIC_URL":
                  return "https://public.example.com";
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("uploadFile", () => {
    it("should successfully upload a file and return the public URL", async () => {
      mockS3Send.mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } });

      const mockFile = {
        originalname: "test-image.jpg",
        buffer: Buffer.from("test content"),
        mimetype: "image/jpeg",
      } as Express.Multer.File;

      const url = await service.uploadFile(mockFile, "images");
      expect(url).toMatch(
        /^https:\/\/public\.example\.com\/images\/[a-f0-9\-]+\.jpg$/,
      );
      expect(mockS3Send).toHaveBeenCalledTimes(1);
    });

    it("should upload a file and handle no trailing slash gracefully in public_url", async () => {
      // Modify mock for this test
      jest.spyOn(configService, "get").mockImplementation((key: string) => {
        if (key === "R2_PUBLIC_URL") return "https://public.example.com/"; // With explicit trailing slash
        return "test";
      });
      // Need to reinject or just test the logic directly since constructor is called once
      // We can recreate the service instance manually
      const customService = new UploadsService(configService);

      mockS3Send.mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } });

      const mockFile = {
        originalname: "test.mp3",
        buffer: Buffer.from("test content"),
        mimetype: "audio/mpeg",
      } as Express.Multer.File;

      const url = await customService.uploadFile(mockFile, "audio");
      // ensure we don't have double slash before "audio/"
      expect(url).toMatch(
        /^https:\/\/public\.example\.com\/audio\/[a-f0-9\-]+\.mp3$/,
      );
    });

    it("should throw BadRequestException if file is undefined", async () => {
      await expect(service.uploadFile(undefined as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw InternalServerErrorException if S3 fails", async () => {
      mockS3Send.mockRejectedValueOnce(new Error("S3 Upload Failed"));

      const mockFile = {
        originalname: "fail.png",
        buffer: Buffer.from("test"),
        mimetype: "image/png",
      } as Express.Multer.File;

      await expect(service.uploadFile(mockFile)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
