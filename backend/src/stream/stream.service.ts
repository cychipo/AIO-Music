import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { spawn } from 'child_process';
import { Response } from 'express';

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);

  /**
   * Streams audio directly from YouTube via yt-dlp.
   * No temp files are created — output is piped directly into the HTTP Response.
   */
  async streamTrack(youtubeId: string, res: Response, quality = 'bestaudio'): Promise<void> {
    const url = `https://www.youtube.com/watch?v=${youtubeId}`;

    this.logger.log(`Streaming: ${url}`);

    // Set streaming headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const ytdlp = spawn('yt-dlp', [
      '-f', quality,
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '-o', '-',         // Output to stdout
      '--no-playlist',
      '--quiet',
      url,
    ]);

    ytdlp.stdout.pipe(res);

    ytdlp.stderr.on('data', (data) => {
      this.logger.warn(`yt-dlp stderr: ${data}`);
    });

    ytdlp.on('error', (err) => {
      this.logger.error(`yt-dlp process error: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Stream failed' });
      }
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        this.logger.warn(`yt-dlp exited with code ${code}`);
      }
      if (!res.writableEnded) res.end();
    });

    // If client disconnects, kill yt-dlp
    res.on('close', () => {
      ytdlp.kill('SIGTERM');
    });
  }

  /**
   * Get track metadata (title, duration, thumbnail) from YouTube via yt-dlp.
   */
  async getMetadata(youtubeId: string): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      const url = `https://www.youtube.com/watch?v=${youtubeId}`;
      let output = '';

      const ytdlp = spawn('yt-dlp', [
        '--dump-json',
        '--no-playlist',
        '--quiet',
        url,
      ]);

      ytdlp.stdout.on('data', (data) => {
        output += data.toString();
      });

      ytdlp.on('close', (code) => {
        if (code !== 0) {
          reject(new NotFoundException(`Track not found: ${youtubeId}`));
          return;
        }
        try {
          resolve(JSON.parse(output));
        } catch {
          reject(new Error('Failed to parse yt-dlp metadata'));
        }
      });
    });
  }
}
