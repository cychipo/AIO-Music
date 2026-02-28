import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import * as play from 'play-dl';

/**
 * Các nền tảng được hỗ trợ để streaming.
 */
export type StreamPlatform = 'youtube' | 'spotify' | 'soundcloud';

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);

  /**
   * Nhận diện nền tảng từ URL.
   */
  detectPlatform(url: string): StreamPlatform {
    if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
    if (/spotify\.com/.test(url)) return 'spotify';
    if (/soundcloud\.com/.test(url)) return 'soundcloud';
    throw new BadRequestException(
      `URL không được hỗ trợ: ${url}. Chỉ hỗ trợ YouTube, Spotify, SoundCloud.`,
    );
  }

  // ---------------------------------------------------------------------------
  // YOUTUBE
  // ---------------------------------------------------------------------------

  /**
   * Lấy luồng âm thanh audio-only từ YouTube bằng play-dl.
   * Hỗ trợ cả URL đầy đủ (https://www.youtube.com/watch?v=...) và Video ID.
   *
   * @param urlOrId - URL YouTube hoặc Video ID
   * @param res     - Express Response để pipe luồng vào
   */
  async streamYouTube(urlOrId: string, res: Response): Promise<void> {
    // Chuẩn hóa thành URL đầy đủ nếu chỉ truyền vào video ID
    const url = urlOrId.startsWith('http')
      ? urlOrId
      : `https://www.youtube.com/watch?v=${urlOrId}`;

    this.logger.log(`[YouTube] Streaming: ${url}`);

    try {
      // play.stream() trả về { stream, type }
      // highWaterMark: kích thước buffer (bytes). 5 * 1024 * 1024 = 5MB
      const source = await play.stream(url, {
        quality: 2,           // 0=lowest, 2=highest quality audio
        discordPlayerCompatibility: false,
      });

      this._pipeStream(source.stream, res, source.type);
    } catch (err) {
      this.logger.error(`[YouTube] Lỗi khi lấy stream: ${err.message}`);
      if (!res.headersSent) {
        throw new InternalServerErrorException('Không thể stream từ YouTube: ' + err.message);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // SPOTIFY (Workaround qua YouTube)
  // ---------------------------------------------------------------------------

  /**
   * Workaround cho Spotify:
   *  1. Dùng play-dl để bóc tách thông tin bài hát từ URL Spotify (tên + ca sĩ).
   *  2. Tự động tìm kiếm bài đó trên YouTube bằng play-dl search.
   *  3. Lấy luồng âm thanh từ kết quả YouTube tìm được.
   *
   * LƯU Ý: play-dl cần được authorize với Spotify client credentials để
   * đọc metadata Spotify. Gọi play.setToken() trong module initialization
   * hoặc dùng biến môi trường SP_DC cookie (xem README của play-dl).
   *
   * @param spotifyUrl - URL bài hát Spotify
   * @param res        - Express Response để pipe luồng vào
   */
  async streamSpotify(spotifyUrl: string, res: Response): Promise<void> {
    this.logger.log(`[Spotify] Xử lý URL: ${spotifyUrl}`);

    try {
      // Bước 1: Lấy metadata từ Spotify
      const spotifyInfo = await play.spotify(spotifyUrl);

      if (spotifyInfo.type !== 'track') {
        throw new BadRequestException('Chỉ hỗ trợ Spotify track URL (không hỗ trợ album/playlist).');
      }

      const track = spotifyInfo as play.SpotifyTrack;
      const artistName = track.artists[0]?.name ?? '';
      const searchQuery = `${track.name} ${artistName}`.trim();

      this.logger.log(`[Spotify] Tìm kiếm trên YouTube: "${searchQuery}"`);

      // Bước 2: Tìm trên YouTube
      const results = await play.search(searchQuery, { source: { youtube: 'video' }, limit: 1 });

      if (!results || results.length === 0) {
        throw new InternalServerErrorException(
          `Không tìm thấy bài "${searchQuery}" trên YouTube.`,
        );
      }

      const ytUrl = results[0].url;
      this.logger.log(`[Spotify] Tìm thấy YouTube match: ${ytUrl}`);

      // Bước 3: Stream từ YouTube
      await this.streamYouTube(ytUrl, res);
    } catch (err) {
      this.logger.error(`[Spotify] Lỗi: ${err.message}`);
      if (!res.headersSent) {
        throw err instanceof BadRequestException || err instanceof InternalServerErrorException
          ? err
          : new InternalServerErrorException('Không thể stream từ Spotify: ' + err.message);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // SOUNDCLOUD
  // ---------------------------------------------------------------------------

  /**
   * Lấy luồng âm thanh từ SoundCloud bằng play-dl.
   *
   * @param soundcloudUrl - URL track SoundCloud
   * @param res           - Express Response để pipe luồng vào
   */
  async streamSoundCloud(soundcloudUrl: string, res: Response): Promise<void> {
    this.logger.log(`[SoundCloud] Streaming: ${soundcloudUrl}`);

    try {
      const source = await play.stream(soundcloudUrl);
      this._pipeStream(source.stream, res, source.type);
    } catch (err) {
      this.logger.error(`[SoundCloud] Lỗi khi lấy stream: ${err.message}`);
      if (!res.headersSent) {
        throw new InternalServerErrorException('Không thể stream từ SoundCloud: ' + err.message);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPER: Pipe stream vào Response với đúng HTTP Headers
  // ---------------------------------------------------------------------------

  /**
   * Thiết lập HTTP Headers chuẩn cho audio streaming và pipe luồng vào Response.
   *
   * Giải thích từng header:
   *  - Content-Type: audio/webm  → Định dạng container phổ biến nhất mà play-dl trả về
   *                                (opus/webm cho YouTube, opus/ogg cho SoundCloud).
   *                                Thẻ <audio> hiện đại đều đọc được định dạng này.
   *  - Transfer-Encoding: chunked → Báo cho browser biết dữ liệu sẽ đến từng mảnh,
   *                                 không có Content-Length cố định — phù hợp cho streaming.
   *  - Accept-Ranges: none        → Tắt tính năng "seek" (tua) vì đây là live stream pipe,
   *                                 không có file tĩnh để seek. Đặt là "bytes" nếu bạn
   *                                 muốn hỗ trợ seek (cần logic phức tạp hơn).
   *  - Cache-Control: no-cache    → Không cho CDN/proxy cache luồng này.
   *  - X-Content-Type-Options: nosniff → Bảo mật: buộc browser tin Content-Type đã khai báo.
   *
   * @param stream  - Readable stream từ play-dl
   * @param res     - Express Response object
   * @param type    - Loại stream (ví dụ: 'audio/webm;codecs=opus', 'audio/mpeg')
   */
  private _pipeStream(
    stream: NodeJS.ReadableStream,
    res: Response,
    type: string,
  ): void {
    // Xác định Content-Type: ưu tiên dùng type play-dl trả về,
    // fallback về audio/webm nếu không nhận dạng được.
    const contentType = type && type.startsWith('audio/') ? type : 'audio/webm;codecs=opus';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Accept-Ranges', 'none');
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Cho phép thẻ <audio> trên bất kỳ origin nào đọc stream này
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Bơm luồng dữ liệu thẳng vào HTTP Response — không ghi file tạm
    stream.pipe(res);

    stream.on('error', (err) => {
      this.logger.error(`Stream error: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Stream bị ngắt do lỗi' });
      } else if (!res.writableEnded) {
        res.end();
      }
    });

    // Dọn dẹp khi client ngắt kết nối sớm
    res.on('close', () => {
      // NodeJS ReadableStream không có .destroy() trong interface cơ bản,
      // nhưng tất cả play-dl streams thực tế đều là PassThrough/Transform
      // nên ta cast để gọi destroy().
      (stream as any).destroy?.();
    });
  }

  // ---------------------------------------------------------------------------
  // TIKTOK — Gợi ý xử lý ngoại lệ
  // ---------------------------------------------------------------------------

  /**
   * HƯỚNG DẪN: Stream TikTok (play-dl không hỗ trợ TikTok)
   *
   * Bởi vì play-dl không có khả năng xử lý TikTok, khuyến nghị dùng
   * thư viện `@tobyg74/tiktok-api-dl` hoặc `tiktok-scraper` (Node.js):
   *
   * Cài đặt:
   *   yarn add @tobyg74/tiktok-api-dl
   *
   * Ví dụ endpoint riêng biệt (trong TiktokController):
   *
   *   import Tiktok from '@tobyg74/tiktok-api-dl';
   *
   *   @Get('tiktok')
   *   async streamTiktok(@Query('url') url: string, @Res() res: Response) {
   *     const result = await Tiktok.Downloader(url, { version: 'v3' });
   *     if (result.status !== 'success') throw new NotFoundException();
   *
   *     // result.result.music chứa URL MP3 trực tiếp
   *     const audioUrl = result.result.music;
   *     const response = await fetch(audioUrl);
   *
   *     res.setHeader('Content-Type', 'audio/mpeg');
   *     res.setHeader('Transfer-Encoding', 'chunked');
   *     // Pipe response body từ fetch vào HTTP Response
   *     Readable.fromWeb(response.body as any).pipe(res);
   *   }
   *
   * Lưu ý: Giải pháp này cần tách thành TiktokModule/TiktokController/TiktokService
   * độc lập để dễ bảo trì và mở rộng.
   */
}
