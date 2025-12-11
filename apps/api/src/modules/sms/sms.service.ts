import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsProvider {
  sendSms(phone: string, message: string): Promise<boolean>;
}

// Mock SMS Provider for testing
class MockSmsProvider implements SmsProvider {
  private logger = new Logger('MockSmsProvider');

  async sendSms(phone: string, message: string): Promise<boolean> {
    this.logger.log(`[MOCK SMS] To: ${phone}`);
    this.logger.log(`[MOCK SMS] Message: ${message}`);
    // In development, always succeed
    return true;
  }
}

// Eskiz SMS Provider (https://notify.eskiz.uz)
class EskizSmsProvider implements SmsProvider {
  private logger = new Logger('EskizSmsProvider');
  private token: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private readonly baseUrl = 'https://notify.eskiz.uz/api';

  constructor(
    private email: string,
    private secretKey: string,
  ) {}

  private async authenticate(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.email,
          password: this.secretKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.token = data.data.token;
      // Token typically expires in 30 days, but we'll refresh it proactively
      this.tokenExpiresAt = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000);
      this.logger.log('Eskiz SMS provider authenticated successfully');
    } catch (error) {
      this.logger.error('Failed to authenticate with Eskiz:', error);
      throw error;
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (
      !this.token ||
      !this.tokenExpiresAt ||
      new Date() >= this.tokenExpiresAt
    ) {
      await this.authenticate();
    }
  }

  async sendSms(phone: string, message: string): Promise<boolean> {
    try {
      await this.ensureAuthenticated();

      // Remove + from phone number if present (Eskiz expects format like 998901234567)
      const cleanPhone = phone.replace(/\+/g, '');

      const formData = new URLSearchParams();
      formData.append('mobile_phone', cleanPhone);
      formData.append('message', message);
      formData.append('from', '4546'); // Eskiz default sender

      const response = await fetch(`${this.baseUrl}/message/sms/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error('Eskiz API error:', errorData);
        return false;
      }

      await response.json(); // Consume response
      this.logger.log(`SMS sent successfully via Eskiz to ${phone}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS via Eskiz to ${phone}:`, error);
      return false;
    }
  }
}

@Injectable()
export class SmsService {
  private provider: SmsProvider;
  private logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {
    const smsProvider = this.configService.get('SMS_PROVIDER', 'mock');

    if (smsProvider === 'eskiz') {
      const email = this.configService.get('ESKIZ_EMAIL');
      const secretKey = this.configService.get('ESKIZ_SECRET_KEY');

      if (!email || !secretKey) {
        this.logger.error(
          'Eskiz credentials not configured. Falling back to mock provider.',
        );
        this.provider = new MockSmsProvider();
      } else {
        this.provider = new EskizSmsProvider(email, secretKey);
        this.logger.log('Using Eskiz SMS provider');
      }
    } else {
      this.provider = new MockSmsProvider();
      this.logger.warn('Using MOCK SMS provider - not for production!');
    }
  }

  async sendOtp(phone: string, code: string): Promise<boolean> {
    // Use Eskiz test message format when in test mode
    // For production, top up Eskiz balance to send custom messages
    const isEskizTestMode = this.configService.get('SMS_PROVIDER') === 'eskiz';
    const message = isEskizTestMode
      ? `Bu Eskiz dan test. Kod: ${code}`
      : `Your verification code: ${code}. Valid for 3 minutes. Do not share this code.`;

    try {
      return await this.provider.sendSms(phone, message);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${phone}:`, error);
      return false;
    }
  }

  // Easy to swap provider later by changing SMS_PROVIDER env variable
}
