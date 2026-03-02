import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PlaylistsService, AddTrackDto } from "./playlists.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserDocument } from "../common/schemas/user.schema";

@ApiTags("playlists")
@ApiBearerAuth("JWT")
@Controller("playlists")
@UseGuards(JwtAuthGuard)
export class PlaylistsController {
  constructor(private playlistsService: PlaylistsService) {}

  @Get("my")
  @ApiOperation({ summary: "Lấy danh sách playlist của bản thân" })
  findMine(@CurrentUser() user: UserDocument) {
    return this.playlistsService.findByOwner(String(user._id));
  }

  @Get("public")
  @ApiOperation({ summary: "Lấy danh sách playlist công khai" })
  findPublic() {
    return this.playlistsService.findPublic();
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết một playlist (có populate tracks)" })
  findOne(@CurrentUser() user: UserDocument, @Param("id") id: string) {
    return this.playlistsService.findById(String(user._id), id);
  }

  @Post()
  @ApiOperation({ summary: "Tạo playlist mới" })
  create(@CurrentUser() user: UserDocument, @Body() body: any) {
    return this.playlistsService.create(String(user._id), body);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật playlist" })
  update(
    @CurrentUser() user: UserDocument,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.playlistsService.update(String(user._id), id, body);
  }

  /**
   * Thêm bài hát vào playlist.
   * Body phải chứa đầy đủ thông tin track (title, artist, sourceId, source, ...).
   * Backend sẽ tự upsert Track document và dùng _id thật của nó.
   */
  @Patch(":id/tracks/:trackId")
  @ApiOperation({ summary: "Thêm bài hát vào playlist" })
  addTrack(
    @CurrentUser() user: UserDocument,
    @Param("id") id: string,
    @Param("trackId") _trackId: string, // giữ lại param cho tương thích URL, không dùng
    @Body() trackData: AddTrackDto,
  ) {
    return this.playlistsService.addTrack(String(user._id), id, trackData);
  }

  @Delete(":id/tracks/:trackId")
  @ApiOperation({ summary: "Xóa bài hát khỏi playlist" })
  removeTrack(
    @CurrentUser() user: UserDocument,
    @Param("id") id: string,
    @Param("trackId") trackId: string,
  ) {
    return this.playlistsService.removeTrack(String(user._id), id, trackId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa playlist" })
  delete(@CurrentUser() user: UserDocument, @Param("id") id: string) {
    return this.playlistsService.delete(String(user._id), id);
  }
}
