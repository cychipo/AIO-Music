import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Track, TrackDocument } from "../common/schemas/track.schema";

@Injectable()
export class TracksService {
  constructor(
    @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
  ) {}

  async findAll(limit = 20, skip = 0): Promise<TrackDocument[]> {
    return this.trackModel
      .find()
      .limit(limit)
      .skip(skip)
      .sort({ playCount: -1 });
  }

  async findById(id: string): Promise<TrackDocument> {
    const track = await this.trackModel.findById(id);
    if (!track) throw new NotFoundException("Track not found");
    return track;
  }

  async create(data: Partial<Track>): Promise<TrackDocument> {
    return this.trackModel.create(data);
  }

  async incrementPlayCount(id: string): Promise<void> {
    await this.trackModel.findByIdAndUpdate(id, { $inc: { playCount: 1 } });
  }

  async search(query: string): Promise<TrackDocument[]> {
    return this.trackModel.find({ $text: { $search: query } }).limit(20);
  }
}
