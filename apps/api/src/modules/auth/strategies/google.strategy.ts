import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private authSvc: AuthService;

  constructor(configService: ConfigService, authService: AuthService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'not-configured',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ||
        'http://localhost:3001/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
    this.authSvc = authService;
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { emails, name } = profile;

    const email = emails?.[0]?.value;
    if (!email) {
      return done(new Error('No email provided by Google'), undefined);
    }

    const authResponse = await this.authSvc.validateGoogleUser({
      email,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
    });

    done(null, authResponse);
  }
}
