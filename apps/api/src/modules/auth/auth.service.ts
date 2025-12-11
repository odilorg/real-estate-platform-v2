import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, OtpPurpose } from '@repo/database';
import * as bcrypt from 'bcrypt';
import {
  RegisterDto,
  LoginDto,
  PhoneRegisterVerifyDto,
  PhoneLoginVerifyDto,
  SetPasswordDto,
} from '@repo/shared';
import { PrismaService } from '../../common/prisma';
import { OtpService } from '../otp/otp.service';

export interface JwtPayload {
  sub: string;
  email?: string;
  phone?: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private otpService: OtpService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    return this.generateAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.banned) {
      throw new ForbiddenException(
        user.banReason || 'Your account has been banned',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAuthResponse(user);
  }

  async validateGoogleUser(profile: {
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthResponse> {
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (user && user.banned) {
      throw new ForbiddenException(
        user.banReason || 'Your account has been banned',
      );
    }

    if (!user) {
      // Create new user with OAuth (no password)
      // Use a random unguessable hash to prevent password login
      const randomHash = await bcrypt.hash(
        Math.random().toString(36) + Date.now().toString(36),
        10,
      );
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          passwordHash: randomHash, // OAuth users get random hash to prevent password login
          firstName: profile.firstName,
          lastName: profile.lastName,
          isOAuthUser: true,
        },
      });
    }

    return this.generateAuthResponse(user);
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  private generateAuthResponse(user: User): AuthResponse {
    const accessToken = this.generateToken(user);
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email || undefined,
        phone: user.phone || undefined,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    // For OAuth users setting their first password, skip current password verification
    // Otherwise, verify the current password
    if (!user.isOAuthUser) {
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return false;
      }
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        isOAuthUser: false, // Once password is set, they're no longer OAuth-only
      },
    });

    return true;
  }

  // Phone Authentication Methods

  async registerWithPhone(dto: PhoneRegisterVerifyDto): Promise<AuthResponse> {
    // Check if phone is already registered
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existingUser) {
      throw new ConflictException('User with this phone number already exists');
    }

    // Verify OTP
    const isOtpValid = await this.otpService.verifyOtp(
      dto.phone,
      dto.code,
      OtpPurpose.REGISTRATION,
    );

    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Create user without password (phone-only user)
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        phoneVerified: true,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash: null, // Phone-only users have no password initially
      },
    });

    return this.generateAuthResponse(user);
  }

  async loginWithPhone(dto: PhoneLoginVerifyDto): Promise<AuthResponse> {
    // Find user by phone
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      throw new UnauthorizedException(
        'No account found with this phone number',
      );
    }

    if (user.banned) {
      throw new ForbiddenException(
        user.banReason || 'Your account has been banned',
      );
    }

    // Verify OTP
    const isOtpValid = await this.otpService.verifyOtp(
      dto.phone,
      dto.code,
      OtpPurpose.LOGIN,
    );

    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Mark phone as verified if not already
    if (!user.phoneVerified) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });
    }

    return this.generateAuthResponse(user);
  }

  async setPassword(userId: string, dto: SetPasswordDto): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Update user with password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        isOAuthUser: false, // No longer OAuth-only if they set a password
      },
    });

    return true;
  }
}
