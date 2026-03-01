import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PlaylistsService, AddTrackDto } from './playlists.service';
import { Playlist } from '../common/schemas/playlist.schema';
import { Track, TrackSource } from '../common/schemas/track.schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OWNER_ID   = new Types.ObjectId().toHexString();
const OTHER_ID   = new Types.ObjectId().toHexString();
const PLAYLIST_ID = new Types.ObjectId().toHexString();
const TRACK_OID   = new Types.ObjectId();
const TRACK_ID    = TRACK_OID.toHexString();

/** Tạo playlist document giả */
function makePlaylist(overrides: Partial<any> = {}) {
  return {
    _id: new Types.ObjectId(PLAYLIST_ID),
    name: 'My Playlist',
    description: '',
    thumbnail: '',
    owner: new Types.ObjectId(OWNER_ID),
    tracks: [],
    isPublic: false,
    ...overrides,
  };
}

/** Tạo track document giả */
function makeTrack(overrides: Partial<any> = {}) {
  return {
    _id: TRACK_OID,
    title: 'Bài hát test',
    artist: 'Nghệ sĩ test',
    album: '',
    thumbnail: '',
    duration: 180,
    sourceId: 'dQw4w9WgXcQ',
    source: TrackSource.YOUTUBE,
    youtubeId: 'dQw4w9WgXcQ',
    playCount: 0,
    tags: [],
    ...overrides,
  };
}

/** Payload đầy đủ để thêm track */
const sampleTrackDto: AddTrackDto = {
  title: 'Bài hát test',
  artist: 'Nghệ sĩ test',
  album: 'Album test',
  thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  duration: 180,
  sourceId: 'dQw4w9WgXcQ',
  source: TrackSource.YOUTUBE,
  youtubeId: 'dQw4w9WgXcQ',
};

// ─── PlaylistsService Unit Tests ──────────────────────────────────────────────

describe('PlaylistsService', () => {
  let service: PlaylistsService;
  let playlistModel: any;
  let trackModel: any;

  beforeEach(async () => {
    // Mock model với các method thường dùng
    playlistModel = {
      find:            jest.fn(),
      findById:        jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create:          jest.fn(),
    };

    trackModel = {
      findOneAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaylistsService,
        { provide: getModelToken(Playlist.name), useValue: playlistModel },
        { provide: getModelToken(Track.name),    useValue: trackModel    },
      ],
    }).compile();

    service = module.get<PlaylistsService>(PlaylistsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── findByOwner ──────────────────────────────────────────────────────────────

  describe('findByOwner', () => {
    it('nên trả về danh sách playlist thuộc về user', async () => {
      const playlists = [makePlaylist()];
      playlistModel.find.mockReturnValue({ populate: jest.fn().mockResolvedValue(playlists) });

      const result = await service.findByOwner(OWNER_ID);

      expect(result).toEqual(playlists);
      expect(playlistModel.find).toHaveBeenCalledWith({
        owner: expect.any(Types.ObjectId),
      });
    });
  });

  // ── findPublic ───────────────────────────────────────────────────────────────

  describe('findPublic', () => {
    it('nên trả về danh sách playlist công khai', async () => {
      const playlists = [makePlaylist({ isPublic: true })];
      playlistModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(playlists),
      });

      const result = await service.findPublic();

      expect(result).toEqual(playlists);
      expect(playlistModel.find).toHaveBeenCalledWith({ isPublic: true });
    });
  });

  // ── create ───────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('nên tạo playlist mới với owner là userId', async () => {
      const playlist = makePlaylist();
      playlistModel.create.mockResolvedValue(playlist);

      const result = await service.create(OWNER_ID, { name: 'My Playlist' });

      expect(result).toEqual(playlist);
      expect(playlistModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Playlist',
          owner: expect.any(Types.ObjectId),
        }),
      );
    });
  });

  // ── findOrCreateTrack ────────────────────────────────────────────────────────

  describe('findOrCreateTrack', () => {
    it('nên upsert track theo { sourceId, source }', async () => {
      const track = makeTrack();
      trackModel.findOneAndUpdate.mockResolvedValue(track);

      const result = await service.findOrCreateTrack(sampleTrackDto);

      expect(result).toEqual(track);
      const [filter, update, opts] = trackModel.findOneAndUpdate.mock.calls[0];
      expect(filter).toEqual({ sourceId: 'dQw4w9WgXcQ', source: TrackSource.YOUTUBE });
      expect(update.$set).toMatchObject({ title: 'Bài hát test', artist: 'Nghệ sĩ test' });
      expect(update.$setOnInsert).toMatchObject({ sourceId: 'dQw4w9WgXcQ', source: TrackSource.YOUTUBE, playCount: 0 });
      expect(opts).toEqual({ upsert: true, new: true });
    });

    it('nên điền giá trị mặc định cho các field tùy chọn khi thiếu', async () => {
      const minimalDto: AddTrackDto = {
        title: 'Tối giản',
        artist: 'Artist',
        sourceId: 'abc123',
        source: TrackSource.SOUNDCLOUD,
      };
      trackModel.findOneAndUpdate.mockResolvedValue(makeTrack({ sourceId: 'abc123' }));

      await service.findOrCreateTrack(minimalDto);

      const callArg = trackModel.findOneAndUpdate.mock.calls[0][1].$set;
      expect(callArg.album).toBe('');
      expect(callArg.thumbnail).toBe('');
      expect(callArg.duration).toBe(0);
      expect(callArg.youtubeId).toBe('');
    });
  });

  // ── addTrack ─────────────────────────────────────────────────────────────────

  describe('addTrack', () => {
    it('nên upsert track rồi thêm _id vào playlist', async () => {
      const playlist = makePlaylist();
      const track    = makeTrack();

      // findOwned → findById
      playlistModel.findById.mockResolvedValue(playlist);
      // findOrCreateTrack → findOneAndUpdate
      trackModel.findOneAndUpdate.mockResolvedValue(track);
      // findByIdAndUpdate → populate
      const updatedPlaylist = { ...playlist, tracks: [track] };
      playlistModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedPlaylist),
      });

      const result = await service.addTrack(OWNER_ID, PLAYLIST_ID, sampleTrackDto);

      expect(result).toEqual(updatedPlaylist);
      expect(playlistModel.findByIdAndUpdate).toHaveBeenCalledWith(
        PLAYLIST_ID,
        { $addToSet: { tracks: track._id } },
        { new: true },
      );
    });

    it('nên ném NotFoundException khi playlistId không hợp lệ', async () => {
      await expect(
        service.addTrack(OWNER_ID, 'not-valid-id', sampleTrackDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('nên ném NotFoundException khi playlist không tồn tại', async () => {
      playlistModel.findById.mockResolvedValue(null);

      await expect(
        service.addTrack(OWNER_ID, PLAYLIST_ID, sampleTrackDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('nên ném ForbiddenException khi user không phải owner', async () => {
      playlistModel.findById.mockResolvedValue(makePlaylist());

      await expect(
        service.addTrack(OTHER_ID, PLAYLIST_ID, sampleTrackDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── removeTrack ──────────────────────────────────────────────────────────────

  describe('removeTrack', () => {
    it('nên xoá track khỏi playlist theo Mongo ObjectId', async () => {
      const playlist = makePlaylist({ tracks: [TRACK_OID] });
      playlistModel.findById.mockResolvedValue(playlist);

      const updatedPlaylist = { ...playlist, tracks: [] };
      playlistModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedPlaylist),
      });

      const result = await service.removeTrack(OWNER_ID, PLAYLIST_ID, TRACK_ID);

      expect(result).toEqual(updatedPlaylist);
      expect(playlistModel.findByIdAndUpdate).toHaveBeenCalledWith(
        PLAYLIST_ID,
        { $pull: { tracks: expect.any(Types.ObjectId) } },
        { new: true },
      );
    });

    it('nên ném NotFoundException khi trackId không phải ObjectId hợp lệ', async () => {
      const playlist = makePlaylist();
      playlistModel.findById.mockResolvedValue(playlist);

      await expect(
        service.removeTrack(OWNER_ID, PLAYLIST_ID, 'dQw4w9WgXcQ'),
      ).rejects.toThrow(NotFoundException);
    });

    it('nên ném NotFoundException khi playlistId không hợp lệ', async () => {
      await expect(
        service.removeTrack(OWNER_ID, 'bad-id', TRACK_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('nên ném NotFoundException khi playlist không tồn tại', async () => {
      playlistModel.findById.mockResolvedValue(null);

      await expect(
        service.removeTrack(OWNER_ID, PLAYLIST_ID, TRACK_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('nên ném ForbiddenException khi user không phải owner', async () => {
      playlistModel.findById.mockResolvedValue(makePlaylist());

      await expect(
        service.removeTrack(OTHER_ID, PLAYLIST_ID, TRACK_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── delete ───────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('nên xoá playlist thành công khi owner đúng', async () => {
      const playlist = makePlaylist();
      playlistModel.findById.mockResolvedValue(playlist);
      playlistModel.findByIdAndDelete.mockResolvedValue(playlist);

      await expect(service.delete(OWNER_ID, PLAYLIST_ID)).resolves.not.toThrow();
      expect(playlistModel.findByIdAndDelete).toHaveBeenCalledWith(PLAYLIST_ID);
    });

    it('nên ném NotFoundException khi playlistId không hợp lệ', async () => {
      await expect(service.delete(OWNER_ID, 'bad-id')).rejects.toThrow(NotFoundException);
    });

    it('nên ném NotFoundException khi playlist không tồn tại', async () => {
      playlistModel.findById.mockResolvedValue(null);
      await expect(service.delete(OWNER_ID, PLAYLIST_ID)).rejects.toThrow(NotFoundException);
    });

    it('nên ném ForbiddenException khi user không phải owner', async () => {
      playlistModel.findById.mockResolvedValue(makePlaylist());
      await expect(service.delete(OTHER_ID, PLAYLIST_ID)).rejects.toThrow(ForbiddenException);
    });
  });
});
