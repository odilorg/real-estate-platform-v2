import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class MediaService {
  private readonly uploadDir = path.join(process.cwd(), 'public', 'uploads');
  private readonly maxImageSize = 10 * 1024 * 1024; // 10MB
  private readonly maxVideoSize = 500 * 1024 * 1024; // 500MB
  private readonly allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly allowedVideoMimes = ['video/mp4', 'video/quicktime'];

  constructor(private prisma: PrismaService) {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (err) {
      console.error('Failed to create upload directory:', err);
    }
  }

  // ============= IMAGES =============

  async uploadImage(propertyId: string, file: Express.Multer.File, metadata: any) {
    // Validate property exists
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Validate file
    if (!this.allowedImageMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }

    if (file.size > this.maxImageSize) {
      throw new BadRequestException('Image size must not exceed 10MB');
    }

    // Save file
    const propertyDir = path.join(this.uploadDir, 'properties', propertyId, 'images');
    await fs.mkdir(propertyDir, { recursive: true });

    const filename = `${crypto.randomBytes(16).toString('hex')}-${Date.now()}${path.extname(file.originalname)}`;
    const filepath = path.join(propertyDir, filename);
    const relativePath = `/uploads/properties/${propertyId}/images/${filename}`;

    await fs.writeFile(filepath, file.buffer);

    // Generate thumbnail (simple approach: save reference for later processing)
    const thumbnailPath = relativePath.replace(`/${filename}`, `/thumb-${filename}`);

    // Get max order
    const maxOrder = await this.prisma.propertyImage.findFirst({
      where: { propertyId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    // Create database record
    const image = await this.prisma.propertyImage.create({
      data: {
        propertyId,
        url: relativePath,
        thumbnailUrl: thumbnailPath,
        caption: metadata.caption,
        roomType: metadata.roomType,
        fileSize: file.size,
        order: (maxOrder?.order ?? -1) + 1,
        isPrimary: metadata.isPrimary === true,
      },
    });

    // If this is the primary image, unset all others
    if (metadata.isPrimary === true) {
      await this.prisma.propertyImage.updateMany(
        {
          where: { propertyId, id: { not: image.id } },
          data: { isPrimary: false },
        },
      );
    }

    return image;
  }

  async getImages(propertyId: string, limit?: number, offset?: number) {
    const images = await this.prisma.propertyImage.findMany({
      where: { propertyId },
      orderBy: { order: 'asc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.propertyImage.count({
      where: { propertyId },
    });

    return { items: images, total };
  }

  async updateImage(propertyId: string, imageId: string, data: any) {
    // Verify ownership
    const image = await this.prisma.propertyImage.findFirst({
      where: { id: imageId, propertyId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    const updated = await this.prisma.propertyImage.update({
      where: { id: imageId },
      data: {
        caption: data.caption ?? image.caption,
        roomType: data.roomType ?? image.roomType,
        order: data.order ?? image.order,
      },
    });

    return updated;
  }

  async setPrimaryImage(propertyId: string, imageId: string) {
    const image = await this.prisma.propertyImage.findFirst({
      where: { id: imageId, propertyId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    // Unset other primary images
    await this.prisma.propertyImage.updateMany({
      where: { propertyId, id: { not: imageId } },
      data: { isPrimary: false },
    });

    // Set this as primary
    return await this.prisma.propertyImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });
  }

  async deleteImage(propertyId: string, imageId: string) {
    const image = await this.prisma.propertyImage.findFirst({
      where: { id: imageId, propertyId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    // Delete file from filesystem
    try {
      const filename = image.url.split('/').pop();
      if (filename) {
        const filepath = path.join(this.uploadDir, 'properties', propertyId, 'images', filename);
        await fs.unlink(filepath);
      }
    } catch (err) {
      console.error('Failed to delete image file:', err);
      // Continue anyway
    }

    return await this.prisma.propertyImage.delete({
      where: { id: imageId },
    });
  }

  async reorderImages(propertyId: string, imageOrders: Array<{ id: string; order: number }>) {
    // Verify all images belong to this property
    const images = await this.prisma.propertyImage.findMany({
      where: { propertyId, id: { in: imageOrders.map(io => io.id) } },
    });

    if (images.length !== imageOrders.length) {
      throw new BadRequestException('Some images not found');
    }

    // Update all
    const updated = await Promise.all(
      imageOrders.map(io =>
        this.prisma.propertyImage.update({
          where: { id: io.id },
          data: { order: io.order },
        }),
      ),
    );

    return updated;
  }

  // ============= VIDEOS =============

  async uploadVideo(propertyId: string, file: Express.Multer.File, metadata: any) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // For uploaded videos
    if (metadata.type === 'UPLOADED' || !metadata.type) {
      if (!this.allowedVideoMimes.includes(file.mimetype)) {
        throw new BadRequestException('Only MP4 and MOV videos are allowed');
      }

      if (file.size > this.maxVideoSize) {
        throw new BadRequestException('Video size must not exceed 500MB');
      }

      const propertyDir = path.join(this.uploadDir, 'properties', propertyId, 'videos');
      await fs.mkdir(propertyDir, { recursive: true });

      const filename = `${crypto.randomBytes(16).toString('hex')}-${Date.now()}${path.extname(file.originalname)}`;
      const filepath = path.join(propertyDir, filename);
      const relativePath = `/uploads/properties/${propertyId}/videos/${filename}`;

      await fs.writeFile(filepath, file.buffer);

      const maxOrder = await this.prisma.propertyVideo.findFirst({
        where: { propertyId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      return await this.prisma.propertyVideo.create({
        data: {
          propertyId,
          url: relativePath,
          title: metadata.title,
          type: 'UPLOADED',
          duration: metadata.duration,
          fileSize: file.size,
          order: (maxOrder?.order ?? -1) + 1,
        },
      });
    }

    // For external videos (YouTube/Vimeo)
    if (metadata.type === 'YOUTUBE' || metadata.type === 'VIMEO') {
      if (!metadata.url) {
        throw new BadRequestException('URL required for external videos');
      }

      const maxOrder = await this.prisma.propertyVideo.findFirst({
        where: { propertyId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      return await this.prisma.propertyVideo.create({
        data: {
          propertyId,
          url: metadata.url,
          title: metadata.title,
          type: metadata.type,
          duration: metadata.duration,
          order: (maxOrder?.order ?? -1) + 1,
        },
      });
    }

    throw new BadRequestException('Invalid video type');
  }

  async getVideos(propertyId: string) {
    return await this.prisma.propertyVideo.findMany({
      where: { propertyId },
      orderBy: { order: 'asc' },
    });
  }

  async updateVideo(propertyId: string, videoId: string, data: any) {
    const video = await this.prisma.propertyVideo.findFirst({
      where: { id: videoId, propertyId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return await this.prisma.propertyVideo.update({
      where: { id: videoId },
      data: {
        title: data.title ?? video.title,
        order: data.order ?? video.order,
      },
    });
  }

  async deleteVideo(propertyId: string, videoId: string) {
    const video = await this.prisma.propertyVideo.findFirst({
      where: { id: videoId, propertyId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Delete file if uploaded
    if (video.type === 'UPLOADED') {
      try {
        const filename = video.url.split('/').pop();
        if (filename) {
          const filepath = path.join(this.uploadDir, 'properties', propertyId, 'videos', filename);
          await fs.unlink(filepath);
        }
      } catch (err) {
        console.error('Failed to delete video file:', err);
      }
    }

    return await this.prisma.propertyVideo.delete({
      where: { id: videoId },
    });
  }

  async reorderVideos(propertyId: string, videoOrders: Array<{ id: string; order: number }>) {
    const videos = await this.prisma.propertyVideo.findMany({
      where: { propertyId, id: { in: videoOrders.map(vo => vo.id) } },
    });

    if (videos.length !== videoOrders.length) {
      throw new BadRequestException('Some videos not found');
    }

    const updated = await Promise.all(
      videoOrders.map(vo =>
        this.prisma.propertyVideo.update({
          where: { id: vo.id },
          data: { order: vo.order },
        }),
      ),
    );

    return updated;
  }

  async addExternalVideo(
    propertyId: string,
    data: { url: string; thumbnailUrl?: string; title?: string; type: 'YOUTUBE' | 'VIMEO' },
  ) {
    // Validate property exists
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (!data.url) {
      throw new BadRequestException('URL is required for external videos');
    }

    if (!['YOUTUBE', 'VIMEO'].includes(data.type)) {
      throw new BadRequestException('Type must be YOUTUBE or VIMEO');
    }

    // Get max order for videos
    const maxOrder = await this.prisma.propertyVideo.findFirst({
      where: { propertyId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    // Create the video record
    return await this.prisma.propertyVideo.create({
      data: {
        propertyId,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        title: data.title,
        type: data.type,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });
  }

  // ============= 360° TOURS =============

  async upload360Tour(propertyId: string, file: Express.Multer.File, metadata: any) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (!this.allowedImageMimes.includes(file.mimetype)) {
      throw new BadRequestException('Only panoramic images (JPEG, PNG, WebP) are allowed');
    }

    if (file.size > this.maxImageSize) {
      throw new BadRequestException('Image size must not exceed 10MB');
    }

    const propertyDir = path.join(this.uploadDir, 'properties', propertyId, 'tours');
    await fs.mkdir(propertyDir, { recursive: true });

    const filename = `${crypto.randomBytes(16).toString('hex')}-${Date.now()}${path.extname(file.originalname)}`;
    const filepath = path.join(propertyDir, filename);
    const relativePath = `/uploads/properties/${propertyId}/tours/${filename}`;

    await fs.writeFile(filepath, file.buffer);

    const maxOrder = await this.prisma.property360Tour.findFirst({
      where: { propertyId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return await this.prisma.property360Tour.create({
      data: {
        propertyId,
        url: relativePath,
        roomName: metadata.roomName,
        description: metadata.description,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });
  }

  async get360Tours(propertyId: string) {
    return await this.prisma.property360Tour.findMany({
      where: { propertyId },
      orderBy: { order: 'asc' },
    });
  }

  async update360Tour(propertyId: string, tourId: string, data: any) {
    const tour = await this.prisma.property360Tour.findFirst({
      where: { id: tourId, propertyId },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    return await this.prisma.property360Tour.update({
      where: { id: tourId },
      data: {
        roomName: data.roomName ?? tour.roomName,
        description: data.description ?? tour.description,
        order: data.order ?? tour.order,
      },
    });
  }

  async delete360Tour(propertyId: string, tourId: string) {
    const tour = await this.prisma.property360Tour.findFirst({
      where: { id: tourId, propertyId },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    try {
      const filename = tour.url.split('/').pop();
      if (filename) {
        const filepath = path.join(this.uploadDir, 'properties', propertyId, 'tours', filename);
        await fs.unlink(filepath);
      }
    } catch (err) {
      console.error('Failed to delete tour file:', err);
    }

    return await this.prisma.property360Tour.delete({
      where: { id: tourId },
    });
  }

  async reorder360Tours(propertyId: string, tourOrders: Array<{ id: string; order: number }>) {
    const tours = await this.prisma.property360Tour.findMany({
      where: { propertyId, id: { in: tourOrders.map(to => to.id) } },
    });

    if (tours.length !== tourOrders.length) {
      throw new BadRequestException('Some tours not found');
    }

    const updated = await Promise.all(
      tourOrders.map(to =>
        this.prisma.property360Tour.update({
          where: { id: to.id },
          data: { order: to.order },
        }),
      ),
    );

    return updated;
  }
}
