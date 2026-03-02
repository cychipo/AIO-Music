import {
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as path from "path";
import * as crypto from "crypto";

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>("R2_ACCOUNT_ID");
    const accessKeyId = this.configService.get<string>("R2_ACCESS_KEY_ID");
    const secretAccessKey = this.configService.get<string>(
      "R2_SECRET_ACCESS_KEY",
    );

    this.bucketName = this.configService.get<string>("R2_BUCKET_NAME") || "";
    this.publicUrl = this.configService.get<string>("R2_PUBLIC_URL") || "";

    if (!accountId || !accessKeyId || !secretAccessKey) {
      this.logger.warn("Cloudflare R2 credentials are not fully configured.");
    }

    this.s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || "",
      },
      // Cloudflare R2 specific requirements
      forcePathStyle: true,
    });
  }

  /**
   * Upload a file to Cloudflare R2
   * @param file Expected to be from Express.Multer.File
   * @param folder Destination folder in the bucket
   * @returns Public URL of the uploaded file
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: "images" | "audio" | "misc" = "misc",
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException("Không có file được tải lên");
    }

    const fileExtension = path.extname(file.originalname).toLowerCase();
    const fileName = `${crypto.randomUUID()}${fileExtension}`;
    const key = `${folder}/${fileName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      const normalizedPublicUrl = this.publicUrl.replace(/\/$/, "");
      const finalUrl = `${normalizedPublicUrl}/${key}`;

      this.logger.log(`[Upload] Thành công: ${finalUrl}`);
      return finalUrl;
    } catch (error: any) {
      this.logger.error(`[Upload] Lỗi khi upload lên R2: ${error.message}`);
      throw new InternalServerErrorException("Lỗi máy chủ khi tải lên file");
    }
  }
}
