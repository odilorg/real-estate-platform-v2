import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose, UserRole } from '@repo/database';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mock-jwt-token'),
  };

  const mockOtpService = {
    verifyOtp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: OtpService, useValue: mockOtpService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = 'hashed-password';
      const createdUser = {
        id: '1',
        email: registerDto.email,
        passwordHash: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: 'USER' as const,
        isOAuthUser: false,
        banned: false,
        banReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        user: {
          id: createdUser.id,
          email: createdUser.email,
          firstName: createdUser.firstName,
          lastName: createdUser.lastName,
          role: createdUser.role,
        },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('should throw ConflictException if user already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: '1',
      email: loginDto.email,
      passwordHash: 'hashed-password',
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER' as const,
      isOAuthUser: false,
      banned: false,
      banReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully login with valid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException if user is banned', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        banned: true,
        banReason: 'Violation of terms',
      });

      await expect(service.login(loginDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateGoogleUser', () => {
    const googleProfile = {
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
    };

    it('should create new user for first-time Google login', async () => {
      const randomHash = 'random-hash';
      const createdUser = {
        id: '1',
        email: googleProfile.email,
        passwordHash: randomHash,
        firstName: googleProfile.firstName,
        lastName: googleProfile.lastName,
        role: 'USER' as const,
        isOAuthUser: true,
        banned: false,
        banReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(randomHash);
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.validateGoogleUser(googleProfile);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: googleProfile.email,
          passwordHash: randomHash,
          firstName: googleProfile.firstName,
          lastName: googleProfile.lastName,
          isOAuthUser: true,
        },
      });
    });

    it('should return existing user for repeat Google login', async () => {
      const existingUser = {
        id: '1',
        email: googleProfile.email,
        passwordHash: 'hash',
        firstName: googleProfile.firstName,
        lastName: googleProfile.lastName,
        role: 'USER' as const,
        isOAuthUser: true,
        banned: false,
        banReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      const result = await service.validateGoogleUser(googleProfile);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if OAuth user is banned', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: googleProfile.email,
        banned: true,
        banReason: 'Spam',
      });

      await expect(service.validateGoogleUser(googleProfile)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('changePassword', () => {
    const userId = '1';
    const currentPassword = 'oldPassword';
    const newPassword = 'newPassword';

    it('should change password for regular user', async () => {
      const user = {
        id: userId,
        isOAuthUser: false,
        passwordHash: 'old-hash',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      const result = await service.changePassword(
        userId,
        currentPassword,
        newPassword,
      );

      expect(result).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          passwordHash: 'new-hash',
          isOAuthUser: false,
        },
      });
    });

    it('should allow OAuth user to set first password without current password', async () => {
      const user = {
        id: userId,
        isOAuthUser: true,
        passwordHash: 'random-hash',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      const result = await service.changePassword(userId, '', newPassword);

      expect(result).toBe(true);
      expect(bcrypt.compare).not.toHaveBeenCalled(); // Should skip verification for OAuth users
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          passwordHash: 'new-hash',
          isOAuthUser: false, // No longer OAuth-only after setting password
        },
      });
    });

    it('should return false if current password is incorrect', async () => {
      const user = {
        id: userId,
        isOAuthUser: false,
        passwordHash: 'old-hash',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.changePassword(
        userId,
        currentPassword,
        newPassword,
      );

      expect(result).toBe(false);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should return false if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.changePassword(
        userId,
        currentPassword,
        newPassword,
      );

      expect(result).toBe(false);
    });
  });

  describe('registerWithPhone', () => {
    const dto = {
      phone: '+998901234567',
      code: '123456',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user with phone number successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-1',
        phone: dto.phone,
        phoneVerified: true,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.USER,
        passwordHash: null,
        email: null,
        banned: false,
        isOAuthUser: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.registerWithPhone(dto);

      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        user: {
          id: 'user-1',
          phone: dto.phone,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.USER,
        },
      });
      expect(mockOtpService.verifyOtp).toHaveBeenCalledWith(
        dto.phone,
        dto.code,
        OtpPurpose.REGISTRATION,
      );
    });

    it('should throw ConflictException if phone already registered', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        phone: dto.phone,
      });

      await expect(service.registerWithPhone(dto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.registerWithPhone(dto)).rejects.toThrow(
        'User with this phone number already exists',
      );
    });

    it('should throw UnauthorizedException if OTP verification fails', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockOtpService.verifyOtp.mockResolvedValue(false);

      await expect(service.registerWithPhone(dto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.registerWithPhone(dto)).rejects.toThrow(
        'Invalid verification code',
      );
    });

    it('should create user with phoneVerified set to true', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-1',
        phone: dto.phone,
        phoneVerified: true,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.USER,
        passwordHash: null,
        email: null,
        banned: false,
        isOAuthUser: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.registerWithPhone(dto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          phoneVerified: true,
        }),
      });
    });
  });

  describe('loginWithPhone', () => {
    const dto = {
      phone: '+998901234567',
      code: '123456',
    };

    it('should login user with phone successfully', async () => {
      const mockUser = {
        id: 'user-1',
        phone: dto.phone,
        phoneVerified: true,
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        banned: false,
        email: null,
        passwordHash: null,
        isOAuthUser: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockOtpService.verifyOtp.mockResolvedValue(true);

      const result = await service.loginWithPhone(dto);

      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        user: {
          id: 'user-1',
          phone: dto.phone,
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.USER,
        },
      });
      expect(mockOtpService.verifyOtp).toHaveBeenCalledWith(
        dto.phone,
        dto.code,
        OtpPurpose.LOGIN,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.loginWithPhone(dto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.loginWithPhone(dto)).rejects.toThrow(
        'No account found with this phone number',
      );
    });

    it('should throw ForbiddenException if user is banned', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        phone: dto.phone,
        banned: true,
        banReason: 'Violation of terms',
      });

      await expect(service.loginWithPhone(dto)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.loginWithPhone(dto)).rejects.toThrow(
        'Violation of terms',
      );
    });

    it('should mark phone as verified if not already verified', async () => {
      const mockUser = {
        id: 'user-1',
        phone: dto.phone,
        phoneVerified: false,
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        banned: false,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockOtpService.verifyOtp.mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        phoneVerified: true,
      });

      await service.loginWithPhone(dto);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { phoneVerified: true },
      });
    });
  });

  describe('setPassword', () => {
    const userId = 'user-1';
    const dto = {
      password: 'NewPassword123!',
    };

    it('should set password for phone-only user successfully', async () => {
      const mockUser = {
        id: userId,
        phone: '+998901234567',
        passwordHash: null,
        isOAuthUser: false,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        passwordHash: 'hashed-password',
      });

      const result = await service.setPassword(userId, dto);

      expect(result).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          passwordHash: 'hashed-password',
          isOAuthUser: false,
        },
      });
    });

    it('should throw BadRequestException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.setPassword(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.setPassword(userId, dto)).rejects.toThrow(
        'User not found',
      );
    });
  });
});
