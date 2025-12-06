import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from '@repo/shared';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '@repo/database';
import { z } from 'zod';

const UpdateProfileDto = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
});

const ChangePasswordDto = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Stricter rate limit for registration
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    // Validate with Zod
    const validated = RegisterDto.parse(dto);
    return this.authService.register(validated);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // Stricter rate limit for login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    // Validate with Zod
    const validated = LoginDto.parse(dto);
    return this.authService.login(validated);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as { accessToken: string };
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Set token in HTTP-only cookie instead of URL parameter
    res.cookie('auth_token', user.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    // Redirect without token in URL
    res.redirect(`${frontendUrl}/auth/callback`);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@CurrentUser() user: User, @Body() dto: z.infer<typeof UpdateProfileDto>) {
    const validated = UpdateProfileDto.parse(dto);
    return this.authService.updateProfile(user.id, validated);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@CurrentUser() user: User, @Body() dto: z.infer<typeof ChangePasswordDto>) {
    const validated = ChangePasswordDto.parse(dto);
    const success = await this.authService.changePassword(
      user.id,
      validated.currentPassword,
      validated.newPassword,
    );
    if (!success) {
      throw new BadRequestException('Current password is incorrect');
    }
    return { success: true };
  }
}
