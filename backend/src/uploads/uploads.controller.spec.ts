import { Test, TestingModule } from "@nestjs/testing";
import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";
import { BadRequestException } from "@nestjs/common";

describe("UploadsController", () => {
  let controller: UploadsController;
  let service: UploadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: UploadsService,
          useValue: {
            uploadFile: jest
              .fn()
              .mockResolvedValue("https://r2.dev/images/uuid.png"),
          },
        },
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
    service = module.get<UploadsService>(UploadsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("uploadImage", () => {
    it("should successfully upload an image and return URL", async () => {
      const mockFile = {
        originalname: "test.png",
        mimetype: "image/png",
        buffer: Buffer.from("test"),
      } as Express.Multer.File;

      const result = await controller.uploadImage(mockFile);

      expect(service.uploadFile).toHaveBeenCalledWith(mockFile, "images");
      expect(result).toEqual({
        message: "Tải ảnh lên thành công",
        data: { url: "https://r2.dev/images/uuid.png" },
      });
    });

    it("should throw BadRequestException if no file is provided", async () => {
      await expect(controller.uploadImage(undefined)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("uploadAudio", () => {
    it("should successfully upload an audio file and return URL", async () => {
      jest
        .spyOn(service, "uploadFile")
        .mockResolvedValueOnce("https://r2.dev/audio/uuid.mp3");

      const mockFile = {
        originalname: "song.mp3",
        mimetype: "audio/mpeg",
        buffer: Buffer.from("audio content"),
      } as Express.Multer.File;

      const result = await controller.uploadAudio(mockFile);

      expect(service.uploadFile).toHaveBeenCalledWith(mockFile, "audio");
      expect(result).toEqual({
        message: "Tải bài hát lên thành công",
        data: { url: "https://r2.dev/audio/uuid.mp3" },
      });
    });

    it("should throw BadRequestException if no file is provided", async () => {
      await expect(controller.uploadAudio(undefined)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
