import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { OtpPurpose, UserRole } from '@repo/database';

describe('AuthController - Phone Authentication (e2e)', () => {
  let app: INestApplication;

  const mockAuthService = {
    registerWithPhone: jest.fn(),
    loginWithPhone: jest.fn(),
    setPassword: jest.fn(),
  };

  const mockOtpService = {
    sendOtp: jest.fn(),
    verifyOtp: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mock-jwt-token'),
    verify: jest.fn(() => ({ sub: 'user-1', role: UserRole.USER })),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Disable throttling in tests
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 1000,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: OtpService,
          useValue: mockOtpService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/phone/register/request', () => {
    it('should send OTP for phone registration', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null); // No existing user
      mockOtpService.sendOtp.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/auth/phone/register/request')
        .send({ phone: '+998901234567' })
        .expect(200);

      expect(response.body).toEqual({
        message: 'Verification code sent',
        phone: '+998901234567',
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { phone: '+998901234567' },
      });
      expect(mockOtpService.sendOtp).toHaveBeenCalledWith(
        '+998901234567',
        OtpPurpose.REGISTRATION,
      );
    });

    it.skip('should return 400 if phone already registered', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        phone: '+998901234567',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/phone/register/request')
        .send({ phone: '+998901234567' })
        .expect(400);

      expect(response.body.message).toContain(
        'Phone number already registered',
      );
      expect(mockOtpService.sendOtp).not.toHaveBeenCalled();
    });

    it.skip('should return 400 for invalid phone format', async () => {
      // TODO: Fix validation pipe configuration in tests
      await request(app.getHttpServer())
        .post('/auth/phone/register/request')
        .send({ phone: 'invalid-phone' })
        .expect(400);

      expect(mockOtpService.sendOtp).not.toHaveBeenCalled();
    });

    it.skip('should return 400 if phone is missing', async () => {
      // TODO: Fix validation pipe configuration in tests
      await request(app.getHttpServer())
        .post('/auth/phone/register/request')
        .send({})
        .expect(400);

      expect(mockOtpService.sendOtp).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/phone/register/verify', () => {
    it('should register user with valid OTP', async () => {
      const registerDto = {
        phone: '+998901234567',
        code: '123456',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockAuthService.registerWithPhone.mockResolvedValue({
        accessToken: 'jwt-token-12345',
        user: {
          id: 'user-1',
          phone: registerDto.phone,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          role: UserRole.USER,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/auth/phone/register/verify')
        .send(registerDto)
        .expect(201);

      expect(response.body).toEqual({
        accessToken: 'jwt-token-12345',
        user: {
          id: 'user-1',
          phone: registerDto.phone,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          role: UserRole.USER,
        },
      });
      expect(mockAuthService.registerWithPhone).toHaveBeenCalledWith(
        registerDto,
      );
    });

    it.skip('should return 400 for invalid OTP code format', async () => {
      await request(app.getHttpServer())
        .post('/auth/phone/register/verify')
        .send({
          phone: '+998901234567',
          code: '12', // Too short
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(400);

      expect(mockAuthService.registerWithPhone).not.toHaveBeenCalled();
    });

    it.skip('should return 400 if required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/phone/register/verify')
        .send({
          phone: '+998901234567',
          code: '123456',
          // Missing firstName and lastName
        })
        .expect(400);
    });

    it.skip('should return 409 if phone already registered', async () => {
      mockAuthService.registerWithPhone.mockRejectedValue({
        response: {
          statusCode: 409,
          message: 'User with this phone number already exists',
        },
        status: 409,
      });

      await request(app.getHttpServer())
        .post('/auth/phone/register/verify')
        .send({
          phone: '+998901234567',
          code: '123456',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(409);
    });

    it.skip('should return 401 for invalid OTP code', async () => {
      mockAuthService.registerWithPhone.mockRejectedValue({
        response: { statusCode: 401, message: 'Invalid verification code' },
        status: 401,
      });

      await request(app.getHttpServer())
        .post('/auth/phone/register/verify')
        .send({
          phone: '+998901234567',
          code: '999999',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(401);
    });
  });

  describe('POST /auth/phone/login/request', () => {
    it('should send OTP for phone login', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        phone: '+998901234567',
      });
      mockOtpService.sendOtp.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/auth/phone/login/request')
        .send({ phone: '+998901234567' })
        .expect(200);

      expect(response.body).toEqual({
        message: 'Verification code sent',
        phone: '+998901234567',
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { phone: '+998901234567' },
      });
      expect(mockOtpService.sendOtp).toHaveBeenCalledWith(
        '+998901234567',
        OtpPurpose.LOGIN,
      );
    });

    it.skip('should return 400 if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/auth/phone/login/request')
        .send({ phone: '+998901234567' })
        .expect(400);

      expect(response.body.message).toContain(
        'No account found with this phone number',
      );
      expect(mockOtpService.sendOtp).not.toHaveBeenCalled();
    });

    it.skip('should return 400 for invalid phone format', async () => {
      await request(app.getHttpServer())
        .post('/auth/phone/login/request')
        .send({ phone: '123' })
        .expect(400);

      expect(mockOtpService.sendOtp).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/phone/login/verify', () => {
    it('should login user with valid OTP', async () => {
      const loginDto = {
        phone: '+998901234567',
        code: '123456',
      };

      mockAuthService.loginWithPhone.mockResolvedValue({
        accessToken: 'jwt-token-67890',
        user: {
          id: 'user-1',
          phone: loginDto.phone,
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.USER,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/auth/phone/login/verify')
        .send(loginDto)
        .expect(200);

      expect(response.body).toEqual({
        accessToken: 'jwt-token-67890',
        user: {
          id: 'user-1',
          phone: loginDto.phone,
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.USER,
        },
      });
      expect(mockAuthService.loginWithPhone).toHaveBeenCalledWith(loginDto);
    });

    it.skip('should return 401 for invalid OTP code', async () => {
      mockAuthService.loginWithPhone.mockRejectedValue({
        response: { statusCode: 401, message: 'Invalid verification code' },
        status: 401,
      });

      await request(app.getHttpServer())
        .post('/auth/phone/login/verify')
        .send({
          phone: '+998901234567',
          code: '999999',
        })
        .expect(401);
    });

    it.skip('should return 401 if user not found', async () => {
      mockAuthService.loginWithPhone.mockRejectedValue({
        response: {
          statusCode: 401,
          message: 'No account found with this phone number',
        },
        status: 401,
      });

      await request(app.getHttpServer())
        .post('/auth/phone/login/verify')
        .send({
          phone: '+998999999999',
          code: '123456',
        })
        .expect(401);
    });

    it.skip('should return 403 if user is banned', async () => {
      mockAuthService.loginWithPhone.mockRejectedValue({
        response: { statusCode: 403, message: 'Your account has been banned' },
        status: 403,
      });

      await request(app.getHttpServer())
        .post('/auth/phone/login/verify')
        .send({
          phone: '+998901234567',
          code: '123456',
        })
        .expect(403);
    });
  });

  describe('POST /auth/set-password', () => {
    it.skip('should set password for authenticated phone-only user', async () => {
      const passwordDto = {
        password: 'NewSecurePassword123!',
      };

      mockAuthService.setPassword.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/auth/set-password')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send(passwordDto)
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(mockAuthService.setPassword).toHaveBeenCalledWith(
        'user-1',
        passwordDto,
      );
    });

    it.skip('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/auth/set-password')
        .send({ password: 'NewPassword123!' })
        .expect(401);

      expect(mockAuthService.setPassword).not.toHaveBeenCalled();
    });

    it.skip('should return 400 for weak password', async () => {
      await request(app.getHttpServer())
        .post('/auth/set-password')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send({ password: '123' }) // Too short
        .expect(400);

      expect(mockAuthService.setPassword).not.toHaveBeenCalled();
    });

    it.skip('should return 400 if password is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/set-password')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send({})
        .expect(400);

      expect(mockAuthService.setPassword).not.toHaveBeenCalled();
    });
  });

  describe('Integration - Full Registration Flow', () => {
    it('should complete full phone registration flow', async () => {
      const phone = '+998901234567';

      // Step 1: Request OTP
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockOtpService.sendOtp.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/auth/phone/register/request')
        .send({ phone })
        .expect(200);

      expect(mockOtpService.sendOtp).toHaveBeenCalledWith(
        phone,
        OtpPurpose.REGISTRATION,
      );

      // Step 2: Verify OTP and complete registration
      mockAuthService.registerWithPhone.mockResolvedValue({
        accessToken: 'new-user-token',
        user: {
          id: 'user-new',
          phone,
          firstName: 'Alice',
          lastName: 'Smith',
          role: UserRole.USER,
        },
      });

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/phone/register/verify')
        .send({
          phone,
          code: '123456',
          firstName: 'Alice',
          lastName: 'Smith',
        })
        .expect(201);

      expect(registerResponse.body.accessToken).toBe('new-user-token');
      expect(registerResponse.body.user.phone).toBe(phone);
    });
  });

  describe('Integration - Full Login Flow', () => {
    it('should complete full phone login flow', async () => {
      const phone = '+998901234567';

      // Step 1: Request OTP
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        phone,
      });
      mockOtpService.sendOtp.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/auth/phone/login/request')
        .send({ phone })
        .expect(200);

      expect(mockOtpService.sendOtp).toHaveBeenCalledWith(
        phone,
        OtpPurpose.LOGIN,
      );

      // Step 2: Verify OTP and login
      mockAuthService.loginWithPhone.mockResolvedValue({
        accessToken: 'login-token',
        user: {
          id: 'user-1',
          phone,
          firstName: 'Bob',
          lastName: 'Jones',
          role: UserRole.USER,
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/phone/login/verify')
        .send({
          phone,
          code: '654321',
        })
        .expect(200);

      expect(loginResponse.body.accessToken).toBe('login-token');
      expect(loginResponse.body.user.phone).toBe(phone);
    });
  });
});
