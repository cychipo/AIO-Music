import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import * as play from "play-dl";
import * as ffmpeg from "fluent-ffmpeg";
import * as ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

export type StreamPlatform = "youtube" | "spotify" | "soundcloud";

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);

  constructor(private readonly config: ConfigService) {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
    this.logger.log(`[Stream] ffmpeg: ${ffmpegInstaller.path}`);
  }

  detectPlatform(url: string): StreamPlatform {
    if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
    if (/spotify\.com/.test(url)) return "spotify";
    if (/soundcloud\.com|api\.soundcloud\.com/.test(url)) return "soundcloud";
    throw new BadRequestException(
      `URL không được hỗ trợ: ${url}. Chỉ hỗ trợ Spotify, SoundCloud.`,
    );
  }

  // ---------------------------------------------------------------------------
  // SPOTIFY — tìm trên SoundCloud rồi stream
  // ---------------------------------------------------------------------------

  async streamSpotify(spotifyUrl: string, res: Response): Promise<void> {
    this.logger.log(`[Spotify] Xử lý URL: ${spotifyUrl}`);

    try {
      const spotifyInfo = await play.spotify(spotifyUrl);
      if (spotifyInfo.type !== "track") {
        throw new BadRequestException("Chỉ hỗ trợ Spotify track URL.");
      }

      const track = spotifyInfo as play.SpotifyTrack;
      const artistName = track.artists[0]?.name ?? "";
      const searchQuery = `${track.name} ${artistName}`.trim();

      this.logger.log(`[Spotify] Tìm kiếm SoundCloud: "${searchQuery}"`);

      const results = await play.search(searchQuery, {
        source: { soundcloud: "tracks" },
        limit: 1,
      });

      if (!results?.length) {
        throw new InternalServerErrorException(
          `Không tìm thấy "${searchQuery}" trên SoundCloud.`,
        );
      }

      const scUrl = (results[0] as any).url || (results[0] as any).permalink;
      if (!scUrl) {
        throw new InternalServerErrorException(
          "Không lấy được SoundCloud URL từ kết quả tìm kiếm.",
        );
      }

      await this.streamSoundCloud(scUrl, res);
    } catch (err) {
      this.logger.error(`[Spotify] Lỗi: ${err.message}`);
      if (!res.headersSent) {
        throw err instanceof BadRequestException ||
          err instanceof InternalServerErrorException
          ? err
          : new InternalServerErrorException(
              "Không thể stream từ Spotify: " + err.message,
            );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // SOUNDCLOUD — play-dl → FFmpeg → client (không cache)
  // ---------------------------------------------------------------------------

  async streamSoundCloud(soundcloudUrl: string, res: Response): Promise<void> {
    // Nếu chỉ nhận numeric ID, chuyển thành URL API
    const resolvedUrl = /^https?:\/\//.test(soundcloudUrl)
      ? soundcloudUrl
      : `https://api.soundcloud.com/tracks/${soundcloudUrl}`;

    this.logger.log(`[SoundCloud] Stream: ${resolvedUrl}`);

    try {
      const source = await play.stream(resolvedUrl);
      this._streamToClient(
        source.stream as NodeJS.ReadableStream,
        "sc",
        res,
        source.type,
        () => {
          (source.stream as any).destroy?.();
        },
      );
    } catch (err) {
      this.logger.error(`[SoundCloud] Lỗi: ${err.message}`);
      if (!res.headersSent) {
        throw new InternalServerErrorException(
          "Không thể stream từ SoundCloud: " + err.message,
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // FFmpeg: convert → pipe thẳng về client (không ghi disk)
  // ---------------------------------------------------------------------------

  private _streamToClient(
    inputStream: NodeJS.ReadableStream,
    sourceKey: string,
    res: Response,
    inputTypeStr?: string,
    killInputFn?: () => void,
  ): void {
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Accept-Ranges", "none");
    res.setHeader("Cache-Control", "no-cache, no-store");
    res.setHeader("Access-Control-Allow-Origin", "*");

    let command = ffmpeg(inputStream as import("stream").Readable);

    if (inputTypeStr?.includes("/")) {
      const inFmt = inputTypeStr.split("/")[0];
      if (inFmt && inFmt !== "audio") command = command.inputFormat(inFmt);
    } else if (inputTypeStr) {
      command = command.inputFormat(inputTypeStr);
    }

    command = command.format("mp3").audioBitrate("128k");

    // YouTube thường có âm lượng chuẩn thấp hơn SoundCloud — tăng 2.5x để cân bằng
    if (sourceKey === "yt") {
      command = command.audioFilters("volume=2.5");
    }

    command.on("error", (err) => {
      if (
        !err.message.includes("Output stream closed") &&
        !err.message.includes("SIGKILL")
      ) {
        this.logger.error(`[FFmpeg] ${sourceKey}: ${err.message}`);
      }
    });

    const ffStream = command.pipe();

    // Pipe duy nhất: thẳng về browser
    ffStream.pipe(res);

    // Khi client ngắt kết nối → kill FFmpeg + cleanup input
    res.on("close", () => {
      command.kill("SIGKILL");
      if (killInputFn) killInputFn();
    });
  }
}
