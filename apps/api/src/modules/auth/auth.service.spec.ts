import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
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
      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1', email: registerDto.email });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
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

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
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

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
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

      await expect(service.validateGoogleUser(googleProfile)).rejects.toThrow(ForbiddenException);
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

      const result = await service.changePassword(userId, currentPassword, newPassword);

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

      const result = await service.changePassword(userId, currentPassword, newPassword);

      expect(result).toBe(false);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should return false if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.changePassword(userId, currentPassword, newPassword);

      expect(result).toBe(false);
    });
  });
});
