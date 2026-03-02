import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { SearchService } from "./search.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("search")
@ApiBearerAuth("JWT")
@Controller("search")
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Tìm kiếm đồng thời trên YouTube + Spotify + SoundCloud",
  })
  @ApiQuery({ name: "q", required: true, example: "shape of you" })
  @ApiQuery({ name: "limit", required: false, example: 10 })
  searchAll(@Query("q") query: string, @Query("limit") limit?: string) {
    return this.searchService.searchAll(query, limit ? +limit : 10);
  }

  @Get("youtube")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Tìm kiếm chỉ trên YouTube" })
  @ApiQuery({ name: "q", required: true, example: "shape of you" })
  @ApiQuery({ name: "limit", required: false, example: 10 })
  searchYoutube(@Query("q") query: string, @Query("limit") limit?: string) {
    return this.searchService.searchYoutube(query, limit ? +limit : 10);
  }

  @Get("spotify")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Tìm kiếm chỉ trên Spotify" })
  @ApiQuery({ name: "q", required: true, example: "shape of you" })
  @ApiQuery({ name: "limit", required: false, example: 10 })
  searchSpotify(@Query("q") query: string, @Query("limit") limit?: string) {
    return this.searchService.searchSpotify(query, limit ? +limit : 10);
  }

  @Get("soundcloud")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Tìm kiếm chỉ trên SoundCloud" })
  @ApiQuery({ name: "q", required: true, example: "shape of you" })
  @ApiQuery({ name: "limit", required: false, example: 10 })
  searchSoundcloud(@Query("q") query: string, @Query("limit") limit?: string) {
    return this.searchService.searchSoundcloud(query, limit ? +limit : 10);
  }
}
