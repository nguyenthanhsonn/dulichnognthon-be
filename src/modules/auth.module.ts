import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '../database/database.module.js';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { AUTH_SETTINGS, getAuthSettings } from '../services/auth.config.js';
import { EMAIL_SENDER } from '../services/email/email-sender.js';
import { OtpEmailService } from '../services/email/otp-email.service.js';
import { AccessTokenGuard } from '../guards/access-token.guard.js';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({}),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenGuard,
    {
      provide: AUTH_SETTINGS,
      inject: [ConfigService],
      useFactory: getAuthSettings,
    },
    { provide: EMAIL_SENDER, useClass: OtpEmailService },
  ],
  exports: [AuthService, AccessTokenGuard],
})
export class AuthModule {}
