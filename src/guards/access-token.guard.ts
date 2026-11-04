import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../services/auth.service.js';
import type { UserResponseDto } from '../services/dto/auth/auth.response.dto.js';

export type AuthenticatedRequest = Request & { authUser: UserResponseDto };

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const match = /^Bearer ([^\s]+)$/i.exec(
      request.headers.authorization ?? '',
    );
    if (!match || match[1].length > 4096)
      throw new UnauthorizedException('Thiếu hoặc sai Access Token.');
    request.authUser = await this.auth.authenticate(match[1]);
    return true;
  }
}
