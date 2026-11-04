import { Body, Controller,
  Get,
  Header,
  HttpCode,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service.js';
import { SendOtpRequestDto } from '../services/dto/auth/send-otp.request.dto.js';
import { VerifyOtpRequestDto } from '../services/dto/auth/verify-otp.request.dto.js';
import { RefreshTokenRequestDto } from '../services/dto/auth/refresh-token.request.dto.js';
import { authDto } from '../services/dto/auth/validation.js';
import {
  AccessTokenGuard,
  type AuthenticatedRequest,
} from '../guards/access-token.guard.js';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('otp/send')
  @HttpCode(202)
  @Header('Cache-Control', 'no-store')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  sendOtp(@Body(authDto(SendOtpRequestDto)) body: SendOtpRequestDto) {
    return this.auth.sendOtp(body.phone);
  }

  @Post('otp/verify')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  verifyOtp(@Body(authDto(VerifyOtpRequestDto)) body: VerifyOtpRequestDto) {
    return this.auth.verifyOtp(body.phone, body.otp);
  }

  @Post('refresh')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  refresh(@Body(authDto(RefreshTokenRequestDto)) body: RefreshTokenRequestDto) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  async logout(
    @Body(authDto(RefreshTokenRequestDto)) body: RefreshTokenRequestDto,
  ): Promise<void> {
    await this.auth.logout(body.refreshToken);
  }

  @Get('me')
  @Header('Cache-Control', 'no-store')
  @UseGuards(AccessTokenGuard)
  me(@Req() request: AuthenticatedRequest) {
    return request.authUser;
  }
}
