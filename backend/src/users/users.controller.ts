import { Controller, Get, Patch, Body, UseGuards, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserDocument } from "../common/schemas/user.schema";

@ApiTags("users")
@ApiBearerAuth("JWT")
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Lấy thông tin người dùng hiện tại" })
  getMe(@CurrentUser() user: UserDocument) {
    return user;
  }

  @Patch("me")
  @ApiOperation({ summary: "Cập nhật profile" })
  updateProfile(
    @CurrentUser() user: UserDocument,
    @Body() updates: Partial<UserDocument>,
  ) {
    return this.usersService.updateProfile(String(user._id), updates);
  }

  @Patch("me/like/:trackId")
  @ApiOperation({ summary: "Like / Unlike một bài hát" })
  toggleLike(
    @CurrentUser() user: UserDocument,
    @Param("trackId") trackId: string,
  ) {
    return this.usersService.toggleLikeTrack(String(user._id), trackId);
  }
}
