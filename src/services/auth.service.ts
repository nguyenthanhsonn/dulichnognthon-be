import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  DataSource,
  IsNull,
  MoreThanOrEqual,
  type EntityManager,
} from 'typeorm';
import {
  User,
  OtpCode,
  AuthSession,
  type AccessClaims,
} from '../modules/auth.model.js';
import { AUTH_SETTINGS, type AuthSettings } from './auth.config.js';
import { EMAIL_SENDER, type EmailSender } from './email/email-sender.js';
import { normalizeEmail } from './dto/auth/email.js';
import type {
  SendOtpResponseDto,
  TokenResponseDto,
  UserResponseDto,
} from './dto/auth/auth.response.dto.js';

const invalidOtp = () =>
  new UnauthorizedException('OTP không hợp lệ, đã sử dụng hoặc hết hạn.');
const invalidSession = () =>
  new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

/** Khóa và cập nhật OTP/session trong transaction để chống request đồng thời. */
@Injectable()
export class AuthService {
  constructor(
    @Inject(DataSource) private readonly database: DataSource,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(AUTH_SETTINGS) private readonly settings: AuthSettings,
    @Inject(EMAIL_SENDER) private readonly mail: EmailSender,
  ) {}

  private async emailLock(tx: EntityManager, email: string): Promise<void> {
    // Khóa theo email hoạt động cả khi chưa có user và trên nhiều instance backend.
    await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
      `auth:email:${email}`,
    ]);
  }

  private async now(tx: EntityManager): Promise<Date> {
    const [clock] = await tx.query<{ now: Date }[]>(
      'SELECT clock_timestamp() AS now',
    );
    return clock.now;
  }

  private otpHash(id: string, email: string, code: string): string {
    // HMAC với secret riêng ngăn vét cạn 6 chữ số chỉ từ bản sao database.
    return createHmac('sha256', this.settings.otpSecret)
      .update(`otp:${id}:${email}:${code}`)
      .digest('hex');
  }

  private tokenHash(token: string): string {
    // Refresh token có 256 bit ngẫu nhiên, không dùng mã 6 chữ số làm token.
    return createHash('sha256').update(token).digest('hex');
  }

  private matches(left: string, right: string): boolean {
    const a = Buffer.from(left, 'hex');
    const b = Buffer.from(right, 'hex');
    return a.length === 32 && b.length === 32 && timingSafeEqual(a, b);
  }

  async sendOtp(email: string): Promise<SendOtpResponseDto> {
    return this.issueOtp(email, 'SEND');
  }

  async resendOtp(email: string): Promise<SendOtpResponseDto> {
    return this.issueOtp(email, 'RESEND');
  }

  private async issueOtp(
    email: string,
    requestType: 'SEND' | 'RESEND',
  ): Promise<SendOtpResponseDto> {
    email = normalizeEmail(email) as string;
    // Kiểm tra cấu hình trước khi tạo challenge, không báo gửi thành công giả.
    this.mail.assertAvailable();
    const otp = randomInt(0, 1000000).toString().padStart(6, '0');
    const { challenge, remainingResends } = await this.database.transaction(
      'READ COMMITTED',
      async (tx) => {
        await this.emailLock(tx, email);
        const now = await this.now(tx);
        const latest = await tx.findOne(OtpCode, {
          where: { email },
          order: { createdAt: 'DESC', id: 'DESC' },
        });
        // verifiedAt kết thúc phiên, consumedAt chỉ kết thúc một mã (đã gửi lại/sai/gửi lỗi).
        const activeFlow =
          latest?.flowId &&
          latest.flowExpiresAt &&
          latest.flowExpiresAt > now &&
          !latest.verifiedAt
            ? latest
            : null;
        if (requestType === 'SEND' && activeFlow) {
          throw new ConflictException(
            'Bạn đang có phiên xác thực OTP. Vui lòng dùng chức năng gửi lại mã.',
          );
        }
        if (requestType === 'RESEND' && !activeFlow) {
          throw new BadRequestException(
            'Không có phiên OTP đang chờ hoặc phiên đã kết thúc. Vui lòng gửi OTP mới.',
          );
        }
        const recentCount = await tx.countBy(OtpCode, {
          email,
          createdAt: MoreThanOrEqual(new Date(now.getTime() - 3600000)),
        });
        if (recentCount >= this.settings.otpMaxPerHour) {
          throw new HttpException(
            'Bạn đã đạt giới hạn gửi OTP trong một giờ. Vui lòng thử lại sau.',
            429,
          );
        }
        // Phiên đã xác thực được bắt đầu lại ngay; IP/quota email vẫn áp dụng.
        // Các lần resend và phiên bỏ dở vẫn phải chờ cooldown để tránh reset né giới hạn.
        if (latest && !latest.verifiedAt) {
          const wait = Math.ceil(
            this.settings.otpCooldownSeconds -
              (now.getTime() - latest.createdAt.getTime()) / 1000,
          );
          if (wait > 0)
            throw new HttpException(
              `Vui lòng chờ ${wait} giây trước khi yêu cầu OTP tiếp theo.`,
              429,
            );
        }
        const resends = activeFlow
          ? await tx.countBy(OtpCode, {
              email,
              flowId: activeFlow.flowId!,
              requestType: 'RESEND',
            })
          : 0;
        if (
          requestType === 'RESEND' &&
          resends >= this.settings.otpMaxResends
        ) {
          throw new HttpException(
            'Bạn đã dùng hết 3 lần gửi lại trong phiên xác thực này.',
            429,
          );
        }
        const flowId = activeFlow?.flowId ?? randomUUID();
        const flowExpiresAt =
          activeFlow?.flowExpiresAt ??
          new Date(now.getTime() + this.settings.otpFlowTtlSeconds * 1000);
        const user = await tx.findOneBy(User, { email });
        // Mã mới thay thế mọi mã trước đó; không tạo tài khoản ở bước gửi email.
        await tx.update(
          OtpCode,
          { email, consumedAt: IsNull() },
          { consumedAt: now },
        );
        const id = randomUUID();
        const challenge = await tx.save(
          OtpCode,
          tx.create(OtpCode, {
            id,
            email,
            requestType,
            flowId,
            flowExpiresAt,
            userId: user?.id ?? null,
            codeHash: this.otpHash(id, email, otp),
            createdAt: now,
            expiresAt: new Date(
              Math.min(
                now.getTime() + this.settings.otpTtlSeconds * 1000,
                flowExpiresAt.getTime(),
              ),
            ),
          }),
        );
        return {
          challenge,
          remainingResends:
            this.settings.otpMaxResends -
            resends -
            (requestType === 'RESEND' ? 1 : 0),
        };
      },
    );
    try {
      // Gọi email provider ngoài transaction để không giữ khóa khi chờ mạng.
      await this.mail.sendOtp(email, otp, {
        challengeId: challenge.id,
        expiresInSeconds: Math.ceil(
          (challenge.expiresAt.getTime() - challenge.createdAt.getTime()) /
            1000,
        ),
      });
    } catch (error) {
      await this.database
        .getRepository(OtpCode)
        .update(
          { id: challenge.id, consumedAt: IsNull() },
          { consumedAt: new Date() },
        );
      throw error;
    }
    // Không trả OTP ở bất kỳ môi trường nào, kể cả development.
    return {
      message: 'OTP đã được gửi.',
      expiresIn: Math.ceil(
        (challenge.expiresAt.getTime() - challenge.createdAt.getTime()) / 1000,
      ),
      retryAfter: this.settings.otpCooldownSeconds,
      remainingResends,
      flowExpiresIn: Math.ceil(
        (challenge.flowExpiresAt!.getTime() - challenge.createdAt.getTime()) /
          1000,
      ),
    };
  }

  async verifyOtp(email: string, otp: string): Promise<TokenResponseDto> {
    email = normalizeEmail(email) as string;
    const result = await this.database.transaction(
      'READ COMMITTED',
      async (tx) => {
        await this.emailLock(tx, email);
        const challenge = await tx.findOne(OtpCode, {
          where: { email },
          order: { createdAt: 'DESC', id: 'DESC' },
          lock: { mode: 'pessimistic_write' },
        });
        const now = await this.now(tx);
        if (
          !challenge ||
          challenge.consumedAt ||
          challenge.verifiedAt ||
          (challenge.flowId &&
            (!challenge.flowExpiresAt || challenge.flowExpiresAt <= now)) ||
          challenge.expiresAt <= now ||
          challenge.attemptCount >= this.settings.otpMaxAttempts
        )
          return null;
        if (
          !this.matches(
            challenge.codeHash,
            this.otpHash(challenge.id, email, otp),
          )
        ) {
          const attempts = challenge.attemptCount + 1;
          await tx.update(OtpCode, challenge.id, {
            attemptCount: attempts,
            consumedAt: attempts >= this.settings.otpMaxAttempts ? now : null,
          });
          // Không throw tại đây: số lần sai cần được commit trước khi trả lỗi.
          return null;
        }
        let user = await tx.findOne(User, {
          where: { email },
          lock: { mode: 'pessimistic_write' },
        });
        if (user?.isBlocked) return null;
        user ??= await tx.save(User, tx.create(User, { email }));
        // Đóng toàn bộ phiên, cho phép lần đăng nhập kế tiếp tạo phiên mới ngay.
        await tx.update(
          OtpCode,
          challenge.flowId
            ? { flowId: challenge.flowId }
            : { id: challenge.id },
          { verifiedAt: now },
        );
        await tx.update(OtpCode, challenge.id, {
          userId: user.id,
          consumedAt: now,
        });
        const id = randomUUID();
        const refreshToken = `${id}.${randomBytes(32).toString('base64url')}`;
        const session = await tx.save(
          AuthSession,
          tx.create(AuthSession, {
            id,
            userId: user.id,
            refreshTokenHash: this.tokenHash(refreshToken),
            createdAt: now,
            expiresAt: new Date(
              now.getTime() + this.settings.refreshTtlSeconds * 1000,
            ),
          }),
        );
        return this.tokens(user, session, refreshToken, now);
      },
    );
    if (!result) throw invalidOtp();
    return result;
  }

  async refresh(refreshToken: string): Promise<TokenResponseDto> {
    const id = this.refreshId(refreshToken);
    if (!id) throw invalidSession();
    const result = await this.database.transaction(
      'READ COMMITTED',
      async (tx) => {
        const session = await tx.findOne(AuthSession, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });
        const now = await this.now(tx);
        if (
          !session ||
          session.revokedAt ||
          session.expiresAt <= now ||
          !this.matches(session.refreshTokenHash, this.tokenHash(refreshToken))
        )
          return null;
        const user = await tx.findOne(User, {
          where: { id: session.userId },
          lock: { mode: 'pessimistic_read' },
        });
        if (!user || user.isBlocked) return null;
        const replacement = `${session.id}.${randomBytes(32).toString('base64url')}`;
        // Khóa session bảo đảm một refresh token chỉ rotate thành công một lần.
        await tx.update(AuthSession, session.id, {
          refreshTokenHash: this.tokenHash(replacement),
        });
        return this.tokens(user, session, replacement, now);
      },
    );
    if (!result) throw invalidSession();
    return result;
  }

  async logout(refreshToken: string): Promise<void> {
    const id = this.refreshId(refreshToken);
    if (!id) return;
    await this.database.transaction('READ COMMITTED', async (tx) => {
      const session = await tx.findOne(AuthSession, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (
        session &&
        !session.revokedAt &&
        this.matches(session.refreshTokenHash, this.tokenHash(refreshToken))
      ) {
        await tx.update(AuthSession, id, { revokedAt: await this.now(tx) });
      }
    });
  }

  private refreshId(token: string): string | null {
    const parts = token.split('.');
    return parts.length === 2 &&
      uuid.test(parts[0]) &&
      /^[A-Za-z0-9_-]{43}$/.test(parts[1])
      ? parts[0]
      : null;
  }

  private userResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async tokens(
    user: User,
    session: AuthSession,
    refreshToken: string,
    now: Date,
  ): Promise<TokenResponseDto> {
    const claims: AccessClaims = {
      sub: user.id,
      sid: session.id,
      type: 'access',
    };
    const accessToken = await this.jwt.signAsync(claims, {
      secret: this.settings.jwtSecret,
      algorithm: 'HS256',
      issuer: this.settings.issuer,
      audience: this.settings.audience,
      expiresIn: this.settings.accessTtlSeconds,
    });
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.settings.accessTtlSeconds,
      refreshExpiresIn: Math.max(
        0,
        Math.floor((session.expiresAt.getTime() - now.getTime()) / 1000),
      ),
      user: this.userResponse(user),
    };
  }

  async authenticate(accessToken: string): Promise<UserResponseDto> {
    let claims: AccessClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessClaims>(accessToken, {
        secret: this.settings.jwtSecret,
        algorithms: ['HS256'],
        issuer: this.settings.issuer,
        audience: this.settings.audience,
      });
      if (
        claims.type !== 'access' ||
        !uuid.test(claims.sub) ||
        !uuid.test(claims.sid)
      )
        throw invalidSession();
    } catch {
      throw invalidSession();
    }
    const session = await this.database.getRepository(AuthSession).findOne({
      where: { id: claims.sid, userId: claims.sub },
      relations: { user: true },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.isBlocked
    )
      throw invalidSession();
    return this.userResponse(session.user);
  }
}
