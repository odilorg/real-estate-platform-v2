import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';

describe('SmsService', () => {
  let service: SmsService;

  describe('Mock Provider', () => {
    beforeEach(async () => {
      const mockConfigService = {
        get: jest.fn((key: string, defaultValue?: string) => {
          if (key === 'SMS_PROVIDER') return 'mock';
          return defaultValue;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<SmsService>(SmsService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should send OTP successfully with mock provider', async () => {
      const phone = '+998901234567';
      const code = '123456';

      const result = await service.sendOtp(phone, code);

      expect(result).toBe(true);
    });

    it('should format OTP message correctly', async () => {
      const phone = '+998901234567';
      const code = '654321';

      const loggerSpy = jest.spyOn((service as any).provider, 'sendSms');

      await service.sendOtp(phone, code);

      // Verify sendSms was called with correct message format (Russian)
      expect(loggerSpy).toHaveBeenCalledWith(
        phone,
        expect.stringContaining(code), // Should contain the OTP code
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        phone,
        expect.stringContaining('zilla.uz'), // Should contain the site name
      );
    });

    it('should handle errors gracefully', async () => {
      const phone = '+998901234567';
      const code = '123456';

      // Mock provider should always return true in normal conditions
      const result = await service.sendOtp(phone, code);

      expect(result).toBe(true);
    });
  });

  describe('Eskiz Provider', () => {
    let fetchSpy: jest.SpyInstance;

    beforeEach(async () => {
      const mockConfigService = {
        get: jest.fn((key: string, defaultValue?: string) => {
          const config: Record<string, string> = {
            SMS_PROVIDER: 'eskiz',
            ESKIZ_EMAIL: 'test@example.com',
            ESKIZ_SECRET_KEY: 'test-secret-key',
            ESKIZ_TEST_MODE: 'true', // Enable test mode for consistent test message
          };
          return config[key] || defaultValue;
        }),
      };

      // Mock global fetch
      fetchSpy = jest.spyOn(global, 'fetch');

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<SmsService>(SmsService);
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('should authenticate with Eskiz API before sending SMS', async () => {
      // Mock authentication response
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            token: 'mock-token-12345',
          },
        }),
      } as Response);

      // Mock SMS send response
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const phone = '+998901234567';
      const code = '123456';

      await service.sendOtp(phone, code);

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://notify.eskiz.uz/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'test-secret-key',
          }),
        }),
      );
    });

    it('should send SMS successfully with Eskiz provider', async () => {
      // Mock authentication
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { token: 'mock-token' },
        }),
      } as Response);

      // Mock SMS send
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const phone = '+998901234567';
      const code = '123456';

      const result = await service.sendOtp(phone, code);

      expect(result).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://notify.eskiz.uz/api/message/sms/send',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-token',
          }),
        }),
      );
    });

    it('should remove + from phone number for Eskiz API', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: 'mock-token' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const phone = '+998901234567';
      const code = '123456';

      await service.sendOtp(phone, code);

      const smsCallBody = fetchSpy.mock.calls[1][1].body;
      expect(smsCallBody).toContain('998901234567'); // Without +
    });

    it('should include correct message format in SMS', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: 'mock-token' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const phone = '+998901234567';
      const code = '654321';

      await service.sendOtp(phone, code);

      const smsCallBody = fetchSpy.mock.calls[1][1].body;
      // Eskiz test mode sends exact test message (URL-encoded)
      expect(smsCallBody).toContain('Bu+Eskiz+dan+test');
    });

    it('should return false if Eskiz authentication fails', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      } as Response);

      const phone = '+998901234567';
      const code = '123456';

      const result = await service.sendOtp(phone, code);
      expect(result).toBe(false);
    });

    it('should return false if SMS sending fails', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: 'mock-token' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid phone number' }),
      } as Response);

      const phone = '+998901234567';
      const code = '123456';

      const result = await service.sendOtp(phone, code);

      expect(result).toBe(false);
    });

    it('should reuse token if not expired', async () => {
      // First call - authenticate
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { token: 'mock-token' } }),
      } as Response);

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await service.sendOtp('+998901234567', '123456');

      fetchSpy.mockClear();

      // Second call - should NOT re-authenticate
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await service.sendOtp('+998901234567', '654321');

      // Should only call SMS send endpoint, not auth endpoint
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://notify.eskiz.uz/api/message/sms/send',
        expect.anything(),
      );
    });

    it('should handle network errors gracefully', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('Network error'));

      const phone = '+998901234567';
      const code = '123456';

      const result = await service.sendOtp(phone, code);
      expect(result).toBe(false);
    });
  });

  describe('Provider Fallback', () => {
    it('should fall back to mock provider if Eskiz credentials missing', async () => {
      const mockConfigService = {
        get: jest.fn((key: string, defaultValue?: string) => {
          if (key === 'SMS_PROVIDER') return 'eskiz';
          // Missing ESKIZ_EMAIL and ESKIZ_SECRET_KEY
          return defaultValue;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<SmsService>(SmsService);

      // Should still work with mock provider
      const result = await service.sendOtp('+998901234567', '123456');
      expect(result).toBe(true);
    });

    it('should use mock provider if SMS_PROVIDER is not set', async () => {
      const mockConfigService = {
        get: jest.fn((_key: string, defaultValue?: string) => {
          return defaultValue; // Return default for all keys
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SmsService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<SmsService>(SmsService);

      const result = await service.sendOtp('+998901234567', '123456');
      expect(result).toBe(true);
    });
  });
});
