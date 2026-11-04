import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '../database/database.module.js';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { AUTH_SETTINGS, getAuthSettings } from '../services/auth.config.js';
import { SMS_SENDER } from '../services/sms/sms-sender.js';
import { DisabledSmsService } from '../services/sms/disabled-sms.service.js';
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
    { provide: SMS_SENDER, useClass: DisabledSmsService },
  ],
  exports: [AuthService, AccessTokenGuard],
})
export class AuthModule {}
