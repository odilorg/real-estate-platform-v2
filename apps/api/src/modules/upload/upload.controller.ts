import {
  Controller,
  Post,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  UploadService,
  UploadResult,
  PresignedUrlResult,
} from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.uploadService.uploadFile(file, folder || 'properties');
  }

  @Post('images')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    }),
  )
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    return this.uploadService.uploadMultiple(files, folder || 'properties');
  }

  @Post('presigned-url')
  async getPresignedUrl(
    @Body('contentType') contentType: string,
    @Body('folder') folder?: string,
  ): Promise<PresignedUrlResult> {
    if (!contentType) {
      throw new BadRequestException('Content type is required');
    }
    return this.uploadService.getPresignedUploadUrl(
      folder || 'properties',
      contentType,
    );
  }

  @Delete(':key')
  async deleteImage(@Param('key') key: string): Promise<{ success: boolean }> {
    await this.uploadService.deleteFile(decodeURIComponent(key));
    return { success: true };
  }

  @Post('delete-multiple')
  async deleteMultiple(
    @Body('keys') keys: string[],
  ): Promise<{ success: boolean }> {
    if (!keys || keys.length === 0) {
      throw new BadRequestException('No keys provided');
    }
    await this.uploadService.deleteMultiple(keys);
    return { success: true };
  }
}
