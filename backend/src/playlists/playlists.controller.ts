import {
  Controller, Get, Post, Delete, Patch,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../common/schemas/user.schema';

@Controller('playlists')
@UseGuards(JwtAuthGuard)
export class PlaylistsController {
  constructor(private playlistsService: PlaylistsService) {}

  @Get('my')
  findMine(@CurrentUser() user: UserDocument) {
    return this.playlistsService.findByOwner(String(user._id));
  }

  @Get('public')
  findPublic() {
    return this.playlistsService.findPublic();
  }

  @Post()
  create(@CurrentUser() user: UserDocument, @Body() body: any) {
    return this.playlistsService.create(String(user._id), body);
  }

  @Patch(':id/tracks/:trackId')
  addTrack(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Param('trackId') trackId: string,
  ) {
    return this.playlistsService.addTrack(String(user._id), id, trackId);
  }

  @Delete(':id/tracks/:trackId')
  removeTrack(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Param('trackId') trackId: string,
  ) {
    return this.playlistsService.removeTrack(String(user._id), id, trackId);
  }

  @Delete(':id')
  delete(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.playlistsService.delete(String(user._id), id);
  }
}
