import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { OtpPurpose } from '@repo/database';

@Injectable()
export class OtpService {
  private logger = new Logger(OtpService.name);
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 3;
  private readonly MAX_ATTEMPTS = 5;
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute

  constructor(
    private prisma: PrismaService,
    private smsService: SmsService,
  ) {}

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(
    phone: string,
    purpose: OtpPurpose,
    userId?: string,
  ): Promise<void> {
    // Rate limiting check: prevent spam
    const recentOtp = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        purpose,
        createdAt: {
          gte: new Date(Date.now() - this.RATE_LIMIT_WINDOW),
        },
      },
    });

    if (recentOtp) {
      throw new BadRequestException(
        'Please wait before requesting another code',
      );
    }

    // Invalidate previous OTPs for this phone/purpose
    await this.prisma.otpCode.updateMany({
      where: { phone, purpose, verified: false },
      data: { verified: true }, // Mark as used to prevent reuse
    });

    // Generate and store new OTP
    const code = this.generateOtpCode();
    const expiresAt = new Date(
      Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000,
    );

    await this.prisma.otpCode.create({
      data: {
        phone,
        code,
        purpose,
        expiresAt,
        userId,
      },
    });

    // Send SMS
    const sent = await this.smsService.sendOtp(phone, code);
    if (!sent) {
      this.logger.error(`Failed to send OTP to ${phone}`);
      throw new BadRequestException('Failed to send verification code');
    }

    this.logger.log(`OTP sent to ${phone} for ${purpose}`);
  }

  async verifyOtp(
    phone: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<boolean> {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        purpose,
        verified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('No verification code found');
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException('Verification code expired');
    }

    // Check max attempts (brute force protection)
    if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
      throw new BadRequestException('Too many attempts. Request a new code.');
    }

    // Increment attempts
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 },
    });

    // Verify code
    if (otpRecord.code !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    // Mark as verified
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    return true;
  }

  // Cleanup expired OTPs (run as scheduled task)
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredOtps(): Promise<void> {
    const result = await this.prisma.otpCode.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    this.logger.log(`Cleaned up ${result.count} expired OTP codes`);
  }
}
