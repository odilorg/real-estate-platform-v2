import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { UploadService } from './upload.service';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('fs');
jest.mock('path');

describe('UploadService', () => {
  let service: UploadService;
  let mockS3Client: jest.Mocked<S3Client>;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 1024, // 1MB
    buffer: Buffer.from('fake-image-data'),
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };

  describe('Local Storage Mode', () => {
    beforeEach(async () => {
      jest.clearAllMocks();

      const mockConfigService = {
        get: jest.fn((key: string, defaultValue?: string) => {
          const config: Record<string, string> = {
            R2_ACCESS_KEY_ID: 'your-r2-access-key', // Placeholder value
            R2_SECRET_ACCESS_KEY: 'your-r2-secret-key', // Placeholder value
            R2_BUCKET_NAME: 'test-bucket',
            API_URL: 'http://localhost:3001',
          };
          return config[key] || defaultValue;
        }),
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
      (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);
      (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UploadService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<UploadService>(UploadService);
    });

    describe('uploadFile', () => {
      it('should upload file to local storage successfully', async () => {
        const result = await service.uploadFile(mockFile, 'properties');

        expect(result).toHaveProperty('url');
        expect(result).toHaveProperty('key');
        expect(result.url).toContain('http://localhost:3001/uploads');
        expect(result.key).toContain('properties/');
        expect(result.key).toMatch(/\.jpg$/);
        expect(fs.writeFileSync).toHaveBeenCalled();
      });

      it('should create folder if it does not exist', async () => {
        (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

        await service.uploadFile(mockFile, 'new-folder');

        expect(fs.mkdirSync).toHaveBeenCalledWith(
          expect.stringContaining('new-folder'),
          { recursive: true },
        );
      });

      it('should reject invalid file types', async () => {
        const invalidFile = {
          ...mockFile,
          mimetype: 'application/pdf',
        };

        await expect(service.uploadFile(invalidFile)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.uploadFile(invalidFile)).rejects.toThrow(
          'Invalid file type',
        );
      });

      it('should accept JPEG images', async () => {
        const jpegFile = { ...mockFile, mimetype: 'image/jpeg' };
        const result = await service.uploadFile(jpegFile);
        expect(result).toHaveProperty('url');
      });

      it('should accept PNG images', async () => {
        const pngFile = {
          ...mockFile,
          mimetype: 'image/png',
          originalname: 'test.png',
        };
        const result = await service.uploadFile(pngFile);
        expect(result.key).toMatch(/\.png$/);
      });

      it('should accept WebP images', async () => {
        const webpFile = {
          ...mockFile,
          mimetype: 'image/webp',
          originalname: 'test.webp',
        };
        const result = await service.uploadFile(webpFile);
        expect(result.key).toMatch(/\.webp$/);
      });

      it('should reject files larger than 10MB', async () => {
        const largeFile = {
          ...mockFile,
          size: 11 * 1024 * 1024, // 11MB
        };

        await expect(service.uploadFile(largeFile)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.uploadFile(largeFile)).rejects.toThrow(
          'File size exceeds 10MB limit',
        );
      });

      it('should accept files exactly at 10MB limit', async () => {
        const maxSizeFile = {
          ...mockFile,
          size: 10 * 1024 * 1024, // 10MB exactly
        };

        const result = await service.uploadFile(maxSizeFile);
        expect(result).toHaveProperty('url');
      });

      it('should use default folder when not specified', async () => {
        const result = await service.uploadFile(mockFile);
        expect(result.key).toContain('properties/');
      });

      it('should use custom folder when specified', async () => {
        const result = await service.uploadFile(mockFile, 'avatars');
        expect(result.key).toContain('avatars/');
      });

      it('should generate unique keys for multiple uploads', async () => {
        const result1 = await service.uploadFile(mockFile);
        const result2 = await service.uploadFile(mockFile);

        expect(result1.key).not.toBe(result2.key);
      });
    });

    describe('uploadMultiple', () => {
      it('should upload multiple files successfully', async () => {
        const files = [mockFile, mockFile, mockFile];

        const results = await service.uploadMultiple(files);

        expect(results).toHaveLength(3);
        results.forEach((result) => {
          expect(result).toHaveProperty('url');
          expect(result).toHaveProperty('key');
        });
      });

      it('should reject more than 20 files', async () => {
        const files = Array(21).fill(mockFile);

        await expect(service.uploadMultiple(files)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.uploadMultiple(files)).rejects.toThrow(
          'Maximum 20 files allowed',
        );
      });

      it('should accept exactly 20 files', async () => {
        const files = Array(20).fill(mockFile);

        const results = await service.uploadMultiple(files);
        expect(results).toHaveLength(20);
      });

      it('should handle empty array', async () => {
        const results = await service.uploadMultiple([]);
        expect(results).toHaveLength(0);
      });

      it('should reject all files if one has invalid type', async () => {
        const files = [
          mockFile,
          { ...mockFile, mimetype: 'application/pdf' },
          mockFile,
        ];

        await expect(service.uploadMultiple(files)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('deleteFile', () => {
      it('should delete file from local storage', async () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);

        await service.deleteFile('properties/test-uuid.jpg');

        expect(fs.existsSync).toHaveBeenCalled();
        expect(fs.unlinkSync).toHaveBeenCalled();
      });

      it('should handle deletion of non-existent file gracefully', async () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);

        await expect(
          service.deleteFile('nonexistent.jpg'),
        ).resolves.not.toThrow();
        expect(fs.unlinkSync).not.toHaveBeenCalled();
      });
    });

    describe('deleteMultiple', () => {
      it('should delete multiple files', async () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        const keys = [
          'properties/file1.jpg',
          'properties/file2.jpg',
          'properties/file3.jpg',
        ];

        await service.deleteMultiple(keys);

        expect(fs.unlinkSync).toHaveBeenCalledTimes(3);
      });

      it('should handle empty array', async () => {
        await expect(service.deleteMultiple([])).resolves.not.toThrow();
      });
    });

    describe('getPresignedUploadUrl', () => {
      it('should throw error in local storage mode', async () => {
        await expect(service.getPresignedUploadUrl()).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.getPresignedUploadUrl()).rejects.toThrow(
          'Presigned URLs are not supported in local storage mode',
        );
      });
    });

    describe('extractKeyFromUrl', () => {
      it('should extract key from valid URL', () => {
        const url = 'http://localhost:3001/uploads/properties/test-uuid.jpg';
        const key = service.extractKeyFromUrl(url);
        expect(key).toBe('uploads/properties/test-uuid.jpg');
      });

      it('should handle URLs with query parameters', () => {
        const url = 'http://localhost:3001/uploads/file.jpg?v=123';
        const key = service.extractKeyFromUrl(url);
        expect(key).toBe('uploads/file.jpg');
      });

      it('should return null for invalid URLs', () => {
        const key = service.extractKeyFromUrl('not-a-valid-url');
        expect(key).toBeNull();
      });

      it('should handle empty string', () => {
        const key = service.extractKeyFromUrl('');
        expect(key).toBeNull();
      });
    });
  });

  describe('R2 Storage Mode', () => {
    beforeEach(async () => {
      jest.clearAllMocks();

      const mockConfigService = {
        get: jest.fn((key: string, defaultValue?: string) => {
          const config: Record<string, string> = {
            R2_ACCESS_KEY_ID: 'real-access-key',
            R2_SECRET_ACCESS_KEY: 'real-secret-key',
            R2_ACCOUNT_ID: 'test-account-id',
            R2_BUCKET_NAME: 'test-bucket',
            R2_PUBLIC_URL: 'https://test-bucket.r2.dev',
          };
          return config[key] || defaultValue;
        }),
      };

      mockS3Client = {
        send: jest.fn().mockResolvedValue({}),
      } as any;

      (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(
        () => mockS3Client,
      );
      (getSignedUrl as jest.Mock).mockResolvedValue(
        'https://signed-url.example.com',
      );

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UploadService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<UploadService>(UploadService);
    });

    describe('uploadFile', () => {
      it('should upload file to R2 storage successfully', async () => {
        const result = await service.uploadFile(mockFile, 'properties');

        expect(result).toHaveProperty('url');
        expect(result).toHaveProperty('key');
        expect(result.url).toContain('https://test-bucket.r2.dev');
        expect(result.key).toContain('properties/');
        expect(mockS3Client.send).toHaveBeenCalledWith(
          expect.any(PutObjectCommand),
        );
      });

      it('should send PutObjectCommand to S3', async () => {
        await service.uploadFile(mockFile);

        const callArg = (mockS3Client.send as jest.Mock).mock.calls[0][0];
        expect(callArg).toBeInstanceOf(PutObjectCommand);
        expect(mockS3Client.send).toHaveBeenCalledTimes(1);
      });
    });

    describe('deleteFile', () => {
      it('should delete file from R2 storage', async () => {
        await service.deleteFile('properties/test-uuid.jpg');

        expect(mockS3Client.send).toHaveBeenCalledWith(
          expect.any(DeleteObjectCommand),
        );
      });
    });

    describe('getPresignedUploadUrl', () => {
      it('should generate presigned URL successfully', async () => {
        const result = await service.getPresignedUploadUrl(
          'properties',
          'image/jpeg',
        );

        expect(result).toHaveProperty('uploadUrl');
        expect(result).toHaveProperty('key');
        expect(result).toHaveProperty('publicUrl');
        expect(result.uploadUrl).toBe('https://signed-url.example.com');
        expect(result.key).toContain('properties/');
        expect(result.publicUrl).toContain('https://test-bucket.r2.dev');
        expect(getSignedUrl).toHaveBeenCalledWith(
          mockS3Client,
          expect.any(PutObjectCommand),
          { expiresIn: 3600 },
        );
      });

      it('should reject invalid content types for presigned URL', async () => {
        await expect(
          service.getPresignedUploadUrl('properties', 'application/pdf'),
        ).rejects.toThrow(BadRequestException);
      });

      it('should accept PNG for presigned URL', async () => {
        const result = await service.getPresignedUploadUrl(
          'properties',
          'image/png',
        );
        expect(result.key).toMatch(/\.png$/);
      });

      it('should accept WebP for presigned URL', async () => {
        const result = await service.getPresignedUploadUrl(
          'properties',
          'image/webp',
        );
        expect(result.key).toMatch(/\.webp$/);
      });

      it('should use default folder and content type when not specified', async () => {
        const result = await service.getPresignedUploadUrl();
        expect(result.key).toContain('properties/');
        expect(result.key).toMatch(/\.jpeg$/);
      });
    });
  });
});
