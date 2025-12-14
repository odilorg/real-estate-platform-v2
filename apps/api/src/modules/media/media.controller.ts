import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { MediaService } from './media.service';
import {
  UploadPropertyImageDto,
  UploadPropertyVideoDto,
  Upload360TourDto,
} from '@repo/shared';

@Controller('properties/:propertyId/media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER', 'DEVELOPER_ADMIN', 'DEVELOPER_SALES_AGENT')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  // ============= IMAGES =============

  @Post('images/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('propertyId') propertyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadPropertyImageDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.mediaService.uploadImage(propertyId, file, dto);
  }

  @Get('images')
  async getImages(
    @Param('propertyId') propertyId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.mediaService.getImages(propertyId, limit ? parseInt(limit) : undefined, offset ? parseInt(offset) : undefined);
  }

  @Put('images/:imageId')
  async updateImage(
    @Param('propertyId') propertyId: string,
    @Param('imageId') imageId: string,
    @Body() dto: Partial<UploadPropertyImageDto>,
  ) {
    return this.mediaService.updateImage(propertyId, imageId, dto);
  }

  @Patch('images/:imageId/primary')
  async setPrimaryImage(
    @Param('propertyId') propertyId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.mediaService.setPrimaryImage(propertyId, imageId);
  }

  @Delete('images/:imageId')
  async deleteImage(
    @Param('propertyId') propertyId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.mediaService.deleteImage(propertyId, imageId);
  }

  @Patch('images/reorder')
  async reorderImages(
    @Param('propertyId') propertyId: string,
    @Body('orders') orders: Array<{ id: string; order: number }>,
  ) {
    return this.mediaService.reorderImages(propertyId, orders);
  }

  // ============= VIDEOS =============

  @Post('videos/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @Param('propertyId') propertyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadPropertyVideoDto,
  ) {
    // File is optional for external videos (YouTube/Vimeo)
    return this.mediaService.uploadVideo(propertyId, file, dto);
  }

  @Get('videos')
  async getVideos(@Param('propertyId') propertyId: string) {
    return this.mediaService.getVideos(propertyId);
  }

  @Put('videos/:videoId')
  async updateVideo(
    @Param('propertyId') propertyId: string,
    @Param('videoId') videoId: string,
    @Body() dto: Partial<UploadPropertyVideoDto>,
  ) {
    return this.mediaService.updateVideo(propertyId, videoId, dto);
  }

  @Delete('videos/:videoId')
  async deleteVideo(
    @Param('propertyId') propertyId: string,
    @Param('videoId') videoId: string,
  ) {
    return this.mediaService.deleteVideo(propertyId, videoId);
  }

  @Patch('videos/reorder')
  async reorderVideos(
    @Param('propertyId') propertyId: string,
    @Body('orders') orders: Array<{ id: string; order: number }>,
  ) {
    return this.mediaService.reorderVideos(propertyId, orders);
  }

  // ============= 360° TOURS =============

  @Post('tours/upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload360Tour(
    @Param('propertyId') propertyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: Upload360TourDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.mediaService.upload360Tour(propertyId, file, dto);
  }

  @Get('tours')
  async get360Tours(@Param('propertyId') propertyId: string) {
    return this.mediaService.get360Tours(propertyId);
  }

  @Put('tours/:tourId')
  async update360Tour(
    @Param('propertyId') propertyId: string,
    @Param('tourId') tourId: string,
    @Body() dto: Partial<Upload360TourDto>,
  ) {
    return this.mediaService.update360Tour(propertyId, tourId, dto);
  }

  @Delete('tours/:tourId')
  async delete360Tour(
    @Param('propertyId') propertyId: string,
    @Param('tourId') tourId: string,
  ) {
    return this.mediaService.delete360Tour(propertyId, tourId);
  }

  @Patch('tours/reorder')
  async reorder360Tours(
    @Param('propertyId') propertyId: string,
    @Body('orders') orders: Array<{ id: string; order: number }>,
  ) {
    return this.mediaService.reorder360Tours(propertyId, orders);
  }
}
