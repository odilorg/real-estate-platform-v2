import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let mockTransporter: any;

  const originalEnv = process.env;

  beforeEach(async () => {
    // Reset environment variables
    process.env = {
      ...originalEnv,
      EMAIL_FROM: 'test@example.com',
      EMAIL_FROM_NAME: 'Test Platform',
      SMTP_HOST: 'smtp.test.com',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'test@example.com',
      SMTP_PASSWORD: 'test-password',
      FRONTEND_URL: 'http://localhost:3000',
    };

    // Create mock transporter
    mockTransporter = {
      verify: jest.fn().mockResolvedValue(true),
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    };

    // Mock nodemailer.createTransport
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);

    // Wait for verifyConnection to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should create nodemailer transporter with correct config', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@example.com',
          pass: 'test-password',
        },
      });
    });

    it('should verify connection on initialization', async () => {
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should use default values when env vars are not set', async () => {
      process.env = {
        ...originalEnv,
      };
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_SECURE;
      delete process.env.EMAIL_FROM;

      jest.clearAllMocks();
      const mockTransporter2 = {
        verify: jest.fn().mockResolvedValue(true),
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
      };
      (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter2);

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService],
      }).compile();

      const newService = module.get<EmailService>(EmailService);

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: undefined,
          pass: undefined,
        },
      });

      expect(newService).toBeDefined();
    });

    it('should handle connection verification failure gracefully', async () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      mockTransporter.verify.mockRejectedValueOnce(new Error('Connection failed'));

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService],
      }).compile();

      const newService = module.get<EmailService>(EmailService);

      // Wait for verifyConnection to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(newService).toBeDefined();
      expect(loggerErrorSpy).toHaveBeenCalled();
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Emails will be logged to console instead of sending'
      );

      loggerErrorSpy.mockRestore();
      loggerWarnSpy.mockRestore();
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully with all options', async () => {
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text',
      };

      const result = await service.sendEmail(options);

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'Test Platform <test@example.com>',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text',
      });
    });

    it('should strip HTML tags to generate text when text is not provided', async () => {
      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Hello <strong>World</strong>!</p>',
      };

      await service.sendEmail(options);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'Test Platform <test@example.com>',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Hello <strong>World</strong>!</p>',
        text: 'Hello World!',
      });
    });

    it('should log to console when SMTP_USER is not configured', async () => {
      delete process.env.SMTP_USER;

      const loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService],
      }).compile();

      const newService = module.get<EmailService>(EmailService);

      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text',
      };

      const result = await newService.sendEmail(options);

      expect(result).toBe(true);
      expect(loggerLogSpy).toHaveBeenCalledWith('[EMAIL] To: recipient@example.com');
      expect(loggerLogSpy).toHaveBeenCalledWith('[EMAIL] Subject: Test Subject');
      expect(loggerLogSpy).toHaveBeenCalledWith('[EMAIL] Content: Test text');
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();

      loggerLogSpy.mockRestore();
    });

    it('should return false and log error when sending fails', async () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      mockTransporter.sendMail.mockRejectedValueOnce(new Error('Send failed'));

      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      const result = await service.sendEmail(options);

      expect(result).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send email to recipient@example.com:',
        expect.any(Error)
      );

      loggerErrorSpy.mockRestore();
    });

    it('should log success message when email is sent', async () => {
      const loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      mockTransporter.sendMail.mockResolvedValueOnce({ messageId: 'msg-12345' });

      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      await service.sendEmail(options);

      expect(loggerLogSpy).toHaveBeenCalledWith('Email sent: msg-12345');

      loggerLogSpy.mockRestore();
    });

    it('should handle invalid email addresses gracefully', async () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      mockTransporter.sendMail.mockRejectedValueOnce(new Error('Invalid recipient'));

      const options = {
        to: 'invalid-email',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      const result = await service.sendEmail(options);

      expect(result).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalled();

      loggerErrorSpy.mockRestore();
    });

    it('should handle network failures gracefully', async () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      mockTransporter.sendMail.mockRejectedValueOnce(new Error('Network error: ECONNREFUSED'));

      const options = {
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      };

      const result = await service.sendEmail(options);

      expect(result).toBe(false);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send email to recipient@example.com:',
        expect.objectContaining({ message: expect.stringContaining('Network error') })
      );

      loggerErrorSpy.mockRestore();
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct content', async () => {
      const result = await service.sendWelcomeEmail('user@example.com', 'John Doe');

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Welcome to Real Estate Platform!',
          html: expect.stringContaining('Welcome to Real Estate Platform!'),
        })
      );
    });

    it('should include user name in welcome email', async () => {
      await service.sendWelcomeEmail('user@example.com', 'Jane Smith');

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Hi Jane Smith,');
    });

    it('should include platform features in welcome email', async () => {
      await service.sendWelcomeEmail('user@example.com', 'John Doe');

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Browse thousands of property listings');
      expect(callArgs.html).toContain('Save your favorite properties');
      expect(callArgs.html).toContain('Create saved searches and get notified');
      expect(callArgs.html).toContain('Contact agents directly');
    });

    it('should return false if sending fails', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('Send failed'));

      const result = await service.sendWelcomeEmail('user@example.com', 'John Doe');

      expect(result).toBe(false);
    });
  });

  describe('sendPropertyMatchNotification', () => {
    const properties = [
      {
        id: 'prop-1',
        title: 'Luxury Apartment',
        price: 250000,
        city: 'Tashkent',
      },
      {
        id: 'prop-2',
        title: 'Modern Villa',
        price: 500000,
        city: 'Samarkand',
      },
    ];

    it('should send property match notification with correct content', async () => {
      const result = await service.sendPropertyMatchNotification(
        'user@example.com',
        'John Doe',
        'City Center Apartments',
        properties
      );

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: '2 New Properties Match "City Center Apartments"',
          html: expect.stringContaining('New Properties Match Your Search!'),
        })
      );
    });

    it('should include user name in notification', async () => {
      await service.sendPropertyMatchNotification(
        'user@example.com',
        'Jane Smith',
        'Test Search',
        properties
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Hi Jane Smith,');
    });

    it('should include property count and search name', async () => {
      await service.sendPropertyMatchNotification(
        'user@example.com',
        'John Doe',
        'Downtown Condos',
        properties
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('<strong>2</strong> new properties');
      expect(callArgs.html).toContain('<strong>Downtown Condos</strong>');
    });

    it('should include property details for each property', async () => {
      await service.sendPropertyMatchNotification(
        'user@example.com',
        'John Doe',
        'Test Search',
        properties
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Luxury Apartment');
      expect(callArgs.html).toContain('$250,000');
      expect(callArgs.html).toContain('Tashkent');
      expect(callArgs.html).toContain('Modern Villa');
      expect(callArgs.html).toContain('$500,000');
      expect(callArgs.html).toContain('Samarkand');
    });

    it('should include property links with correct URLs', async () => {
      await service.sendPropertyMatchNotification(
        'user@example.com',
        'John Doe',
        'Test Search',
        properties
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('http://localhost:3000/properties/prop-1');
      expect(callArgs.html).toContain('http://localhost:3000/properties/prop-2');
    });

    it('should use singular form for single property', async () => {
      const singleProperty = [properties[0]];

      await service.sendPropertyMatchNotification(
        'user@example.com',
        'John Doe',
        'Test Search',
        singleProperty
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.subject).toBe('1 New Property Match "Test Search"');
      expect(callArgs.html).toContain('<strong>1</strong> new property');
    });

    it('should include manage searches link', async () => {
      await service.sendPropertyMatchNotification(
        'user@example.com',
        'John Doe',
        'Test Search',
        properties
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('http://localhost:3000/saved-searches');
      expect(callArgs.html).toContain('Manage your saved searches');
    });

    it('should format prices with thousands separator', async () => {
      const propertiesWithHighPrice = [
        {
          id: 'prop-1',
          title: 'Luxury Estate',
          price: 1500000,
          city: 'Tashkent',
        },
      ];

      await service.sendPropertyMatchNotification(
        'user@example.com',
        'John Doe',
        'Test Search',
        propertiesWithHighPrice
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('$1,500,000');
    });
  });

  describe('sendNewMessageNotification', () => {
    it('should send new message notification with correct content', async () => {
      const result = await service.sendNewMessageNotification(
        'recipient@example.com',
        'John Doe',
        'Jane Smith',
        'Luxury Apartment in Tashkent',
        'Hello, I am interested in viewing this property'
      );

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'recipient@example.com',
          subject: 'New message from Jane Smith',
          html: expect.stringContaining('New Message from Jane Smith'),
        })
      );
    });

    it('should include recipient name', async () => {
      await service.sendNewMessageNotification(
        'recipient@example.com',
        'John Doe',
        'Jane Smith',
        'Test Property',
        'Test message'
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Hi John Doe,');
    });

    it('should include property title', async () => {
      await service.sendNewMessageNotification(
        'recipient@example.com',
        'John Doe',
        'Jane Smith',
        'Luxury Apartment in Tashkent',
        'Test message'
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('<strong>Luxury Apartment in Tashkent</strong>');
    });

    it('should include message preview', async () => {
      await service.sendNewMessageNotification(
        'recipient@example.com',
        'John Doe',
        'Jane Smith',
        'Test Property',
        'I would like to schedule a viewing'
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('"I would like to schedule a viewing"');
    });

    it('should include reply link to messages', async () => {
      await service.sendNewMessageNotification(
        'recipient@example.com',
        'John Doe',
        'Jane Smith',
        'Test Property',
        'Test message'
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('http://localhost:3000/messages');
      expect(callArgs.html).toContain('Reply to Message');
    });

    it('should include notification preferences link', async () => {
      await service.sendNewMessageNotification(
        'recipient@example.com',
        'John Doe',
        'Jane Smith',
        'Test Property',
        'Test message'
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('http://localhost:3000/settings/notifications');
      expect(callArgs.html).toContain('Manage notification preferences');
    });
  });

  describe('sendViewingRequestNotification', () => {
    it('should send viewing request notification with correct content', async () => {
      const result = await service.sendViewingRequestNotification(
        'owner@example.com',
        'John Doe',
        'Jane Smith',
        'Luxury Apartment',
        '2024-01-15',
        '14:00'
      );

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'owner@example.com',
          subject: 'Viewing request for Luxury Apartment',
          html: expect.stringContaining('New Viewing Request'),
        })
      );
    });

    it('should include owner name', async () => {
      await service.sendViewingRequestNotification(
        'owner@example.com',
        'John Doe',
        'Jane Smith',
        'Test Property',
        '2024-01-15',
        '14:00'
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Hi John Doe,');
    });

    it('should include requester name and property title', async () => {
      await service.sendViewingRequestNotification(
        'owner@example.com',
        'John Doe',
        'Jane Smith',
        'Luxury Apartment',
        '2024-01-15',
        '14:00'
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('<strong>Jane Smith</strong>');
      expect(callArgs.html).toContain('<strong>Luxury Apartment</strong>');
    });

    it('should include viewing date and time', async () => {
      await service.sendViewingRequestNotification(
        'owner@example.com',
        'John Doe',
        'Jane Smith',
        'Test Property',
        '2024-01-15',
        '14:00'
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('<strong>Date:</strong> 2024-01-15');
      expect(callArgs.html).toContain('<strong>Time:</strong> 14:00');
    });

    it('should include review request link', async () => {
      await service.sendViewingRequestNotification(
        'owner@example.com',
        'John Doe',
        'Jane Smith',
        'Test Property',
        '2024-01-15',
        '14:00'
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('http://localhost:3000/viewings');
      expect(callArgs.html).toContain('Review Request');
    });
  });

  describe('sendAgentVerificationEmail', () => {
    it('should send agent verification email with correct content', async () => {
      const result = await service.sendAgentVerificationEmail(
        'agent@example.com',
        'John Doe'
      );

      expect(result).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'agent@example.com',
          subject: 'Welcome to Real Estate Platform - Agent Account',
          html: expect.stringContaining("Congratulations! You're Now an Agent"),
        })
      );
    });

    it('should include agent name', async () => {
      await service.sendAgentVerificationEmail('agent@example.com', 'Jane Smith');

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Hi Jane Smith,');
    });

    it('should include agent features list', async () => {
      await service.sendAgentVerificationEmail('agent@example.com', 'John Doe');

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Manage your agent profile');
      expect(callArgs.html).toContain('Receive inquiries from potential clients');
      expect(callArgs.html).toContain('Track your property listings performance');
      expect(callArgs.html).toContain('Build your professional reputation');
    });

    it('should include next steps instructions', async () => {
      await service.sendAgentVerificationEmail('agent@example.com', 'John Doe');

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Complete your agent profile with photo and bio');
      expect(callArgs.html).toContain('Add your specializations and areas served');
      expect(callArgs.html).toContain('Start listing properties');
    });
  });

  describe('HTML stripping', () => {
    it('should strip simple HTML tags', async () => {
      const html = '<p>Hello World</p>';
      await service.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html,
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toBe('Hello World');
    });

    it('should strip nested HTML tags', async () => {
      const html = '<div><p>Hello <strong>World</strong>!</p></div>';
      await service.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html,
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toBe('Hello World!');
    });

    it('should handle HTML with attributes', async () => {
      const html = '<a href="http://example.com" style="color: blue;">Link</a>';
      await service.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html,
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toBe('Link');
    });

    it('should handle empty HTML', async () => {
      const html = '<div></div>';
      await service.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html,
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toBe('');
    });

    it('should handle HTML with line breaks', async () => {
      const html = '<p>Line 1</p>\n<p>Line 2</p>';
      await service.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html,
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.text).toBe('Line 1\nLine 2');
    });
  });

  describe('Configuration variations', () => {
    it('should use custom frontend URL from environment', async () => {
      process.env.FRONTEND_URL = 'https://production.example.com';

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService],
      }).compile();

      const newService = module.get<EmailService>(EmailService);

      await newService.sendPropertyMatchNotification(
        'user@example.com',
        'John Doe',
        'Test Search',
        [{ id: 'prop-1', title: 'Test', price: 100000, city: 'Tashkent' }]
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('https://production.example.com/properties/prop-1');
    });

    it('should use custom email from name', async () => {
      process.env.EMAIL_FROM_NAME = 'Custom Platform Name';

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService],
      }).compile();

      const newService = module.get<EmailService>(EmailService);

      await newService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.from).toContain('Custom Platform Name');
    });

    it('should handle secure SMTP connection', async () => {
      process.env.SMTP_SECURE = 'true';
      process.env.SMTP_PORT = '465';

      jest.clearAllMocks();
      const mockTransporter2 = {
        verify: jest.fn().mockResolvedValue(true),
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
      };
      (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter2);

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService],
      }).compile();

      const newService = module.get<EmailService>(EmailService);

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 465,
          secure: true,
        })
      );

      expect(newService).toBeDefined();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty property list in match notification', async () => {
      const result = await service.sendPropertyMatchNotification(
        'user@example.com',
        'John Doe',
        'Test Search',
        []
      );

      expect(result).toBe(true);
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('<strong>0</strong> new properties');
    });

    it('should handle long message previews', async () => {
      const longMessage = 'A'.repeat(500);

      const result = await service.sendNewMessageNotification(
        'recipient@example.com',
        'John Doe',
        'Jane Smith',
        'Test Property',
        longMessage
      );

      expect(result).toBe(true);
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(longMessage);
    });

    it('should handle special characters in names', async () => {
      await service.sendWelcomeEmail('user@example.com', "O'Connor & Sons");

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain("Hi O'Connor & Sons,");
    });

    it('should handle special characters in property titles', async () => {
      await service.sendNewMessageNotification(
        'recipient@example.com',
        'John Doe',
        'Jane Smith',
        'Apartment with "Luxury" & <Premium> Features',
        'Test message'
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      // Note: The service doesn't HTML-escape the title, so special characters appear as-is
      expect(callArgs.html).toContain('Apartment with "Luxury" & <Premium> Features');
    });

    it('should handle multiple concurrent email sends', async () => {
      const promises = [
        service.sendWelcomeEmail('user1@example.com', 'User 1'),
        service.sendWelcomeEmail('user2@example.com', 'User 2'),
        service.sendWelcomeEmail('user3@example.com', 'User 3'),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([true, true, true]);
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in concurrent sends', async () => {
      mockTransporter.sendMail
        .mockResolvedValueOnce({ messageId: 'msg-1' })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ messageId: 'msg-3' });

      const promises = [
        service.sendWelcomeEmail('user1@example.com', 'User 1'),
        service.sendWelcomeEmail('user2@example.com', 'User 2'),
        service.sendWelcomeEmail('user3@example.com', 'User 3'),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([true, false, true]);
    });
  });

  describe('Email content validation', () => {
    it('should ensure all template emails have proper structure', async () => {
      const emailFunctions = [
        () => service.sendWelcomeEmail('test@example.com', 'Test User'),
        () =>
          service.sendPropertyMatchNotification(
            'test@example.com',
            'Test User',
            'Test Search',
            [{ id: 'prop-1', title: 'Test', price: 100000, city: 'Tashkent' }]
          ),
        () =>
          service.sendNewMessageNotification(
            'test@example.com',
            'Recipient',
            'Sender',
            'Property',
            'Message'
          ),
        () =>
          service.sendViewingRequestNotification(
            'test@example.com',
            'Owner',
            'Requester',
            'Property',
            '2024-01-15',
            '14:00'
          ),
        () => service.sendAgentVerificationEmail('test@example.com', 'Agent Name'),
      ];

      for (const emailFunction of emailFunctions) {
        jest.clearAllMocks();
        await emailFunction();

        const callArgs = mockTransporter.sendMail.mock.calls[0][0];

        // All emails should have proper structure
        expect(callArgs.from).toBeTruthy();
        expect(callArgs.to).toBe('test@example.com');
        expect(callArgs.subject).toBeTruthy();
        expect(callArgs.html).toContain('font-family: Arial, sans-serif');
        expect(callArgs.text).toBeTruthy();
      }
    });

    it('should ensure all property notification links are valid', async () => {
      const properties = [
        { id: 'prop-1', title: 'Property 1', price: 100000, city: 'City1' },
        { id: 'prop-2', title: 'Property 2', price: 200000, city: 'City2' },
      ];

      await service.sendPropertyMatchNotification(
        'test@example.com',
        'User',
        'Search',
        properties
      );

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];

      // Check all property links are present
      properties.forEach((prop) => {
        expect(callArgs.html).toContain(`/properties/${prop.id}`);
      });
    });
  });
});
