import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Playlist, PlaylistDocument } from "../common/schemas/playlist.schema";
import {
  Track,
  TrackDocument,
  TrackSource,
} from "../common/schemas/track.schema";

/** Payload gửi lên khi thêm bài hát vào playlist */
export interface AddTrackDto {
  title: string;
  artist: string;
  album?: string;
  thumbnail?: string;
  duration?: number;
  sourceId: string; // YouTube video ID, Spotify track ID, ...
  source: TrackSource | string;
  youtubeId?: string;
  url?: string;
}

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
    @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
  ) {}

  // ── Playlist CRUD ───────────────────────────────────────────────────────────

  async findByOwner(userId: string): Promise<PlaylistDocument[]> {
    return this.playlistModel
      .find({ owner: new Types.ObjectId(userId) })
      .populate("tracks");
  }

  async findById(
    userId: string,
    playlistId: string,
  ): Promise<PlaylistDocument> {
    if (!Types.ObjectId.isValid(playlistId)) {
      throw new NotFoundException("Playlist not found");
    }
    const playlist = await this.playlistModel
      .findById(playlistId)
      .populate("tracks");
    if (!playlist) throw new NotFoundException("Playlist not found");
    if (String(playlist.owner) !== userId) throw new ForbiddenException();
    return playlist;
  }

  async findPublic(): Promise<PlaylistDocument[]> {
    return this.playlistModel
      .find({ isPublic: true })
      .populate("owner", "displayName avatar");
  }

  async create(
    userId: string,
    data: Partial<Playlist>,
  ): Promise<PlaylistDocument> {
    return this.playlistModel.create({
      ...data,
      owner: new Types.ObjectId(userId),
    });
  }

  /**
   * Thêm bài hát vào playlist.
   * trackData chứa thông tin đầy đủ của bài hát từ search result.
   * Nếu track chưa tồn tại trong DB → upsert theo { sourceId, source }.
   */
  async addTrack(
    userId: string,
    playlistId: string,
    trackData: AddTrackDto,
  ): Promise<PlaylistDocument> {
    await this.findOwned(userId, playlistId);

    // Tìm hoặc tạo Track document
    const track = await this.findOrCreateTrack(trackData);

    return this.playlistModel
      .findByIdAndUpdate(
        playlistId,
        { $addToSet: { tracks: track._id } },
        { new: true },
      )
      .populate("tracks");
  }

  /**
   * Xoá bài hát khỏi playlist.
   * trackId là Mongo ObjectId string của Track document.
   */
  async removeTrack(
    userId: string,
    playlistId: string,
    trackId: string,
  ): Promise<PlaylistDocument> {
    await this.findOwned(userId, playlistId);

    if (!Types.ObjectId.isValid(trackId)) {
      throw new NotFoundException("trackId không hợp lệ");
    }

    return this.playlistModel
      .findByIdAndUpdate(
        playlistId,
        { $pull: { tracks: new Types.ObjectId(trackId) } },
        { new: true },
      )
      .populate("tracks");
  }

  async delete(userId: string, playlistId: string): Promise<void> {
    await this.findOwned(userId, playlistId);
    await this.playlistModel.findByIdAndDelete(playlistId);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Upsert: tìm track theo { sourceId, source }, nếu chưa có thì tạo mới.
   * Đây là cách duy nhất để map search result → Track document trong DB.
   */
  async findOrCreateTrack(data: AddTrackDto): Promise<TrackDocument> {
    const filter = { sourceId: data.sourceId, source: data.source };
    const update = {
      // Luôn update metadata để fix trường hợp track cũ bị lưu thiếu data
      $set: {
        title: data.title,
        artist: data.artist,
        album: data.album ?? "",
        thumbnail: data.thumbnail ?? "",
        duration: data.duration ?? 0,
        youtubeId: data.youtubeId ?? "",
      },
      // Chỉ set các field cố định khi insert lần đầu
      $setOnInsert: {
        sourceId: data.sourceId,
        source: data.source,
        playCount: 0,
        tags: [],
      },
    };
    return this.trackModel.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
    });
  }

  private async findOwned(
    userId: string,
    playlistId: string,
  ): Promise<PlaylistDocument> {
    if (!Types.ObjectId.isValid(playlistId)) {
      throw new NotFoundException("Playlist not found");
    }
    const playlist = await this.playlistModel.findById(playlistId);
    if (!playlist) throw new NotFoundException("Playlist not found");
    if (String(playlist.owner) !== userId) throw new ForbiddenException();
    return playlist;
  }
}
