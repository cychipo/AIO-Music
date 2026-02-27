import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../common/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async toggleLikeTrack(userId: string, trackId: string): Promise<UserDocument> {
    const user = await this.findById(userId);
    const liked = user.likedTracks.includes(trackId);
    const update = liked
      ? { $pull: { likedTracks: trackId } }
      : { $addToSet: { likedTracks: trackId } };

    return this.userModel.findByIdAndUpdate(userId, update, { new: true });
  }
}
