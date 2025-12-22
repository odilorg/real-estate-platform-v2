import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // For public routes, still try to authenticate but don't require it
    if (isPublic) {
      try {
        // Try to authenticate - this sets request.user if token is valid
        await super.canActivate(context);
      } catch {
        // Ignore auth errors for public routes - user will be null
      }
      return true;
    }

    // For protected routes, require authentication
    return super.canActivate(context) as Promise<boolean>;
  }

  // Don't throw error if no token found on public routes
  handleRequest(err: any, user: any, _info: any, context: ExecutionContext) {
    
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // For public routes, return user or null (don't throw)
    if (isPublic) {
      return user || null;
    }

    // For protected routes, throw UnauthorizedException if no user
    if (err || !user) {
      throw err || new UnauthorizedException('Unauthorized');
    }
    return user;
  }
}
