import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadsService } from "./uploads.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";

@ApiTags("uploads")
@ApiBearerAuth("JWT")
@UseGuards(JwtAuthGuard)
@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("image")
  @ApiOperation({ summary: "Upload file ảnh lên Cloudflare R2" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException(
              "Định dạng ảnh không được hỗ trợ (chỉ chấp nhận JPEG, PNG, GIF, WEBP)",
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Không tìm thấy file để tải lên");
    }
    const url = await this.uploadsService.uploadFile(file, "images");
    return { message: "Tải ảnh lên thành công", data: { url } };
  }

  @Post("audio")
  @ApiOperation({ summary: "Upload file nhạc lên Cloudflare R2" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^(audio\/)/)) {
          return cb(
            new BadRequestException("Chỉ cho phép tải lên định dạng Audio"),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Không tìm thấy file để tải lên");
    }
    const url = await this.uploadsService.uploadFile(file, "audio");
    return { message: "Tải bài hát lên thành công", data: { url } };
  }
}
