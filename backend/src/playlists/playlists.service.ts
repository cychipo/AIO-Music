import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Playlist, PlaylistDocument } from '../common/schemas/playlist.schema';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
  ) {}

  async findByOwner(userId: string): Promise<PlaylistDocument[]> {
    return this.playlistModel
      .find({ owner: new Types.ObjectId(userId) })
      .populate('tracks');
  }

  async findPublic(): Promise<PlaylistDocument[]> {
    return this.playlistModel.find({ isPublic: true }).populate('owner', 'displayName avatar');
  }

  async create(userId: string, data: Partial<Playlist>): Promise<PlaylistDocument> {
    return this.playlistModel.create({
      ...data,
      owner: new Types.ObjectId(userId),
    });
  }

  async addTrack(userId: string, playlistId: string, trackId: string): Promise<PlaylistDocument> {
    const playlist = await this.findOwned(userId, playlistId);
    return this.playlistModel.findByIdAndUpdate(
      playlistId,
      { $addToSet: { tracks: new Types.ObjectId(trackId) } },
      { new: true },
    );
  }

  async removeTrack(userId: string, playlistId: string, trackId: string): Promise<PlaylistDocument> {
    await this.findOwned(userId, playlistId);
    return this.playlistModel.findByIdAndUpdate(
      playlistId,
      { $pull: { tracks: new Types.ObjectId(trackId) } },
      { new: true },
    );
  }

  async delete(userId: string, playlistId: string): Promise<void> {
    await this.findOwned(userId, playlistId);
    await this.playlistModel.findByIdAndDelete(playlistId);
  }

  private async findOwned(userId: string, playlistId: string): Promise<PlaylistDocument> {
    const playlist = await this.playlistModel.findById(playlistId);
    if (!playlist) throw new NotFoundException('Playlist not found');
    if (String(playlist.owner) !== userId) throw new ForbiddenException();
    return playlist;
  }
}
