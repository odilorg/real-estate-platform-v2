import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OtpService } from './otp.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { OtpPurpose } from '@repo/database';

describe('OtpService', () => {
  let service: OtpService;

  const mockPrismaService = {
    otpCode: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockSmsService = {
    sendOtp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SmsService,
          useValue: mockSmsService,
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtp', () => {
    const phone = '+998901234567';
    const purpose = OtpPurpose.REGISTRATION;

    it('should generate and send a 6-digit OTP code', async () => {
      mockPrismaService.otpCode.findFirst.mockResolvedValue(null);
      mockPrismaService.otpCode.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.otpCode.create.mockResolvedValue({
        id: 'otp-1',
        phone,
        code: '123456',
        purpose,
        expiresAt: new Date(Date.now() + 3 * 60 * 1000),
        attempts: 0,
        verified: false,
        createdAt: new Date(),
      });
      mockSmsService.sendOtp.mockResolvedValue(true);

      await service.sendOtp(phone, purpose);

      expect(mockPrismaService.otpCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phone,
          code: expect.stringMatching(/^\d{6}$/), // 6-digit code
          purpose,
          expiresAt: expect.any(Date),
        }),
      });
      expect(mockSmsService.sendOtp).toHaveBeenCalledWith(
        phone,
        expect.stringMatching(/^\d{6}$/),
      );
    });

    it('should set OTP expiry to 3 minutes', async () => {
      const now = Date.now();
      mockPrismaService.otpCode.findFirst.mockResolvedValue(null);
      mockPrismaService.otpCode.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.otpCode.create.mockImplementation(({ data }) => {
        const expiryTime = data.expiresAt.getTime() - now;
        expect(expiryTime).toBeGreaterThanOrEqual(3 * 60 * 1000 - 100); // ~3 minutes
        expect(expiryTime).toBeLessThanOrEqual(3 * 60 * 1000 + 100);
        return Promise.resolve({ ...data, id: 'otp-1' });
      });
      mockSmsService.sendOtp.mockResolvedValue(true);

      await service.sendOtp(phone, purpose);
    });

    it('should enforce rate limiting (1 request per 60 seconds)', async () => {
      const recentOtp = {
        id: 'otp-recent',
        phone,
        code: '123456',
        purpose,
        createdAt: new Date(Date.now() - 30000), // 30 seconds ago
        expiresAt: new Date(Date.now() + 150000),
        attempts: 0,
        verified: false,
      };
      mockPrismaService.otpCode.findFirst.mockResolvedValue(recentOtp);

      await expect(service.sendOtp(phone, purpose)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.sendOtp(phone, purpose)).rejects.toThrow(
        'Please wait before requesting another code',
      );

      expect(mockPrismaService.otpCode.create).not.toHaveBeenCalled();
      expect(mockSmsService.sendOtp).not.toHaveBeenCalled();
    });

    it('should allow new OTP request after rate limit window expires', async () => {
      // Old OTP exists but beyond rate limit window
      mockPrismaService.otpCode.findFirst.mockResolvedValue(null); // No recent OTP
      mockPrismaService.otpCode.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.otpCode.create.mockResolvedValue({
        id: 'otp-2',
        phone,
        code: '654321',
        purpose,
        expiresAt: new Date(Date.now() + 180000),
        attempts: 0,
        verified: false,
        createdAt: new Date(),
      });
      mockSmsService.sendOtp.mockResolvedValue(true);

      await service.sendOtp(phone, purpose);

      expect(mockPrismaService.otpCode.create).toHaveBeenCalled();
      expect(mockSmsService.sendOtp).toHaveBeenCalled();
    });

    it('should invalidate previous unverified OTPs before sending new one', async () => {
      mockPrismaService.otpCode.findFirst.mockResolvedValue(null);
      mockPrismaService.otpCode.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaService.otpCode.create.mockResolvedValue({
        id: 'otp-new',
        phone,
        code: '999999',
        purpose,
        expiresAt: new Date(Date.now() + 180000),
        attempts: 0,
        verified: false,
        createdAt: new Date(),
      });
      mockSmsService.sendOtp.mockResolvedValue(true);

      await service.sendOtp(phone, purpose);

      expect(mockPrismaService.otpCode.updateMany).toHaveBeenCalledWith({
        where: { phone, purpose, verified: false },
        data: { verified: true },
      });
    });

    it('should throw error if SMS sending fails', async () => {
      mockPrismaService.otpCode.findFirst.mockResolvedValue(null);
      mockPrismaService.otpCode.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.otpCode.create.mockResolvedValue({
        id: 'otp-1',
        phone,
        code: '123456',
        purpose,
        expiresAt: new Date(Date.now() + 180000),
        attempts: 0,
        verified: false,
        createdAt: new Date(),
      });
      mockSmsService.sendOtp.mockResolvedValue(false); // SMS sending fails

      await expect(service.sendOtp(phone, purpose)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.sendOtp(phone, purpose)).rejects.toThrow(
        'Failed to send verification code',
      );
    });

    it('should handle different OTP purposes independently', async () => {
      mockPrismaService.otpCode.findFirst.mockResolvedValue(null);
      mockPrismaService.otpCode.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.otpCode.create.mockResolvedValue({
        id: 'otp-1',
        phone,
        code: '123456',
        purpose: OtpPurpose.LOGIN,
        expiresAt: new Date(Date.now() + 180000),
        attempts: 0,
        verified: false,
        createdAt: new Date(),
      });
      mockSmsService.sendOtp.mockResolvedValue(true);

      // Should allow both REGISTRATION and LOGIN OTPs for same phone
      await service.sendOtp(phone, OtpPurpose.REGISTRATION);
      await service.sendOtp(phone, OtpPurpose.LOGIN);

      expect(mockPrismaService.otpCode.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('verifyOtp', () => {
    const phone = '+998901234567';
    const code = '123456';
    const purpose = OtpPurpose.LOGIN;

    it('should verify valid OTP code successfully', async () => {
      const otpRecord = {
        id: 'otp-1',
        phone,
        code,
        purpose,
        expiresAt: new Date(Date.now() + 60000), // 1 minute from now
        attempts: 0,
        verified: false,
        createdAt: new Date(),
      };
      mockPrismaService.otpCode.findFirst.mockResolvedValue(otpRecord);
      mockPrismaService.otpCode.update.mockResolvedValue({
        ...otpRecord,
        verified: true,
      });

      const result = await service.verifyOtp(phone, code, purpose);

      expect(result).toBe(true);
      expect(mockPrismaService.otpCode.update).toHaveBeenCalledTimes(2); // Once for attempts, once for verified
      expect(mockPrismaService.otpCode.update).toHaveBeenLastCalledWith({
        where: { id: otpRecord.id },
        data: { verified: true },
      });
    });

    it('should throw error if no OTP record found', async () => {
      mockPrismaService.otpCode.findFirst.mockResolvedValue(null);

      await expect(service.verifyOtp(phone, code, purpose)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyOtp(phone, code, purpose)).rejects.toThrow(
        'No verification code found',
      );
    });

    it('should throw error if OTP has expired', async () => {
      const expiredOtp = {
        id: 'otp-expired',
        phone,
        code,
        purpose,
        expiresAt: new Date(Date.now() - 60000), // 1 minute ago
        attempts: 0,
        verified: false,
        createdAt: new Date(),
      };
      mockPrismaService.otpCode.findFirst.mockResolvedValue(expiredOtp);

      await expect(service.verifyOtp(phone, code, purpose)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyOtp(phone, code, purpose)).rejects.toThrow(
        'Verification code expired',
      );
    });

    it('should enforce brute force protection (max 5 attempts)', async () => {
      const otpRecord = {
        id: 'otp-1',
        phone,
        code,
        purpose,
        expiresAt: new Date(Date.now() + 60000),
        attempts: 5, // Already at max attempts
        verified: false,
        createdAt: new Date(),
      };
      mockPrismaService.otpCode.findFirst.mockResolvedValue(otpRecord);

      await expect(service.verifyOtp(phone, code, purpose)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyOtp(phone, code, purpose)).rejects.toThrow(
        'Too many attempts. Request a new code.',
      );

      expect(mockPrismaService.otpCode.update).not.toHaveBeenCalled();
    });

    it('should increment attempts counter on each verification', async () => {
      const otpRecord = {
        id: 'otp-1',
        phone,
        code,
        purpose,
        expiresAt: new Date(Date.now() + 60000),
        attempts: 2,
        verified: false,
        createdAt: new Date(),
      };
      mockPrismaService.otpCode.findFirst.mockResolvedValue(otpRecord);
      mockPrismaService.otpCode.update.mockResolvedValue({
        ...otpRecord,
        attempts: 3,
      });

      await service.verifyOtp(phone, code, purpose);

      expect(mockPrismaService.otpCode.update).toHaveBeenCalledWith({
        where: { id: otpRecord.id },
        data: { attempts: 3 },
      });
    });

    it('should throw error for invalid OTP code', async () => {
      const otpRecord = {
        id: 'otp-1',
        phone,
        code: '123456',
        purpose,
        expiresAt: new Date(Date.now() + 60000),
        attempts: 0,
        verified: false,
        createdAt: new Date(),
      };
      mockPrismaService.otpCode.findFirst.mockResolvedValue(otpRecord);
      mockPrismaService.otpCode.update.mockResolvedValue({
        ...otpRecord,
        attempts: 1,
      });

      await expect(
        service.verifyOtp(phone, '999999', purpose),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.verifyOtp(phone, '999999', purpose),
      ).rejects.toThrow('Invalid verification code');

      // Should still increment attempts even for wrong code
      expect(mockPrismaService.otpCode.update).toHaveBeenCalledWith({
        where: { id: otpRecord.id },
        data: { attempts: 1 },
      });
    });

    it('should fetch most recent unverified OTP when multiple exist', async () => {
      const recentOtp = {
        id: 'otp-2',
        phone,
        code: '654321',
        purpose,
        expiresAt: new Date(Date.now() + 60000),
        attempts: 0,
        verified: false,
        createdAt: new Date(),
      };
      mockPrismaService.otpCode.findFirst.mockResolvedValue(recentOtp);
      mockPrismaService.otpCode.update.mockResolvedValue(recentOtp);

      await service.verifyOtp(phone, '654321', purpose);

      expect(mockPrismaService.otpCode.findFirst).toHaveBeenCalledWith({
        where: {
          phone,
          purpose,
          verified: false,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('cleanupExpiredOtps', () => {
    it('should delete all expired OTP codes', async () => {
      mockPrismaService.otpCode.deleteMany.mockResolvedValue({ count: 5 });

      await service.cleanupExpiredOtps();

      expect(mockPrismaService.otpCode.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: { lt: expect.any(Date) },
        },
      });
    });

    it('should log the number of deleted OTP codes', async () => {
      const loggerSpy = jest.spyOn((service as any).logger, 'log');
      mockPrismaService.otpCode.deleteMany.mockResolvedValue({ count: 10 });

      await service.cleanupExpiredOtps();

      expect(loggerSpy).toHaveBeenCalledWith(
        'Cleaned up 10 expired OTP codes',
      );
    });

    it('should handle cleanup when no expired OTPs exist', async () => {
      mockPrismaService.otpCode.deleteMany.mockResolvedValue({ count: 0 });

      await service.cleanupExpiredOtps();

      expect(mockPrismaService.otpCode.deleteMany).toHaveBeenCalled();
    });
  });
});
