import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadResult {
  url: string;
  key: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

@Injectable()
export class UploadService {
  private s3Client: S3Client | null = null;
  private bucket: string;
  private publicUrl: string;
  private useLocalStorage: boolean;
  private localStoragePath: string = '';

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    this.bucket = this.configService.get<string>(
      'R2_BUCKET_NAME',
      'realestate',
    );

    // Check if R2 credentials are configured (not placeholder values)
    this.useLocalStorage =
      !accessKeyId ||
      !secretAccessKey ||
      accessKeyId === 'your-r2-access-key' ||
      secretAccessKey === 'your-r2-secret-key';

    if (this.useLocalStorage) {
      // Use local file storage
      this.localStoragePath = path.join(process.cwd(), 'uploads');
      this.publicUrl =
        this.configService.get<string>('API_URL', 'http://localhost:3001') +
        '/uploads';

      // Create uploads directory if it doesn't exist
      if (!fs.existsSync(this.localStoragePath)) {
        fs.mkdirSync(this.localStoragePath, { recursive: true });
      }

      console.log(
        '[UploadService] Using local file storage at:',
        this.localStoragePath,
      );
    } else {
      // Use R2 storage
      const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
      this.publicUrl = this.configService.get<string>(
        'R2_PUBLIC_URL',
        `https://${this.bucket}.r2.dev`,
      );

      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: accessKeyId || '',
          secretAccessKey: secretAccessKey || '',
        },
      });

      console.log('[UploadService] Using Cloudflare R2 storage');
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'properties',
  ): Promise<UploadResult> {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit.');
    }

    const extension = file.originalname.split('.').pop();
    const key = `${folder}/${uuidv4()}.${extension}`;

    if (this.useLocalStorage) {
      // Save to local filesystem
      const folderPath = path.join(this.localStoragePath, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const filePath = path.join(this.localStoragePath, key);
      fs.writeFileSync(filePath, file.buffer);

      return {
        url: `${this.publicUrl}/${key}`,
        key,
      };
    } else {
      // Save to R2
      await this.s3Client!.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: 'public, max-age=31536000',
        }),
      );

      return {
        url: `${this.publicUrl}/${key}`,
        key,
      };
    }
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folder: string = 'properties',
  ): Promise<UploadResult[]> {
    const maxFiles = 20;
    if (files.length > maxFiles) {
      throw new BadRequestException(`Maximum ${maxFiles} files allowed.`);
    }

    const results = await Promise.all(
      files.map((file) => this.uploadFile(file, folder)),
    );
    return results;
  }

  async deleteFile(key: string): Promise<void> {
    if (this.useLocalStorage) {
      const filePath = path.join(this.localStoragePath, key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else {
      await this.s3Client!.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    }
  }

  async deleteMultiple(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.deleteFile(key)));
  }

  async getPresignedUploadUrl(
    folder: string = 'properties',
    contentType: string = 'image/jpeg',
  ): Promise<PresignedUrlResult> {
    if (this.useLocalStorage) {
      throw new BadRequestException(
        'Presigned URLs are not supported in local storage mode. Please use direct file upload instead.',
      );
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(contentType)) {
      throw new BadRequestException(
        'Invalid content type. Only JPEG, PNG, and WebP are allowed.',
      );
    }

    const extension = contentType.split('/')[1];
    const key = `${folder}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    });

    const uploadUrl = await getSignedUrl(this.s3Client!, command, {
      expiresIn: 3600, // 1 hour
    });

    return {
      uploadUrl,
      key,
      publicUrl: `${this.publicUrl}/${key}`,
    };
  }

  extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.slice(1); // Remove leading slash
    } catch {
      return null;
    }
  }
}
