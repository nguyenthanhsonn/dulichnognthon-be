import { setTimeout as delay } from 'node:timers/promises';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isEmail } from 'class-validator';
import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import type { EmailSender, OtpEmailContext } from './email-sender.js';
import {
  GmailApiMailer,
  GmailDeliveryError,
  type GmailApiSettings,
} from './gmail-api-mailer.js';
import { createOtpEmail } from './otp-email.template.js';

type GmailAccountSettings = GmailApiSettings & {
  from: string;
  checkQuotaBounces?: boolean;
};

type GmailAccount = {
  from: string;
  mailer: GmailApiMailer;
  exhaustedUntil: number;
  disabled: boolean;
  sentToday: number;
  dailyResetAt: number;
  inFlight: number;
  checkQuotaBounces?: boolean;
  nextBounceCheckAt: number;
  bounceCheck?: Promise<void>;
};

type MailSettings = { from: string } & (
  | {
      provider: 'smtp';
      host: string;
      port: number;
      secure: boolean;
      user: string;
      pass: string;
    }
  | { provider: 'resend'; apiKey: string }
  | {
      provider: 'gmail_api';
      accounts: GmailAccountSettings[];
      dailySoftLimit: number;
    }
);

const dayMs = 24 * 60 * 60 * 1000;
const pacificDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});
const pacificHour = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  hour: 'numeric',
  hourCycle: 'h23',
});

function nextPacificMidnight(now: number): number {
  const parts = pacificDate.formatToParts(now);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  // 08:00 UTC là 00:00 PST hoặc 01:00 PDT của ngày kế tiếp.
  const standardMidnight = Date.UTC(year, month - 1, day + 1, 8);
  return (
    standardMidnight - Number(pacificHour.format(standardMidnight)) * 3600000
  );
}

function refreshGmailDay(account: GmailAccount, now: number): void {
  if (account.dailyResetAt > now) return;
  account.dailyResetAt = nextPacificMidnight(now);
  account.sentToday = 0;
}

/** Production Render Free dùng Gmail API qua HTTPS. Không log OTP/credential. */
@Injectable()
export class OtpEmailService implements EmailSender, OnModuleDestroy {
  private readonly logger = new Logger(OtpEmailService.name);
  private smtp?: Transporter<SMTPTransport.SentMessageInfo>;
  private gmail?: GmailAccount[];
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  private settings(): MailSettings {
    const provider = this.config.get<string>('EMAIL_PROVIDER') || 'gmail_api';
    const dailySoftLimit = Number(
      this.config.get<string>('GMAIL_DAILY_SOFT_LIMIT')?.trim() || 450,
    );
    if (
      provider === 'gmail_api' &&
      (!Number.isSafeInteger(dailySoftLimit) || dailySoftLimit < 1)
    )
      throw new ServiceUnavailableException(
        'GMAIL_DAILY_SOFT_LIMIT không hợp lệ.',
      );
    const accountJson = this.config.get<string>('GMAIL_ACCOUNTS')?.trim();
    if (provider === 'gmail_api' && accountJson) {
      try {
        const values: unknown = JSON.parse(accountJson);
        if (!Array.isArray(values) || !values.length) throw new Error();
        const seen = new Set<string>();
        const accounts = values.map((value: unknown) => {
          if (!value || typeof value !== 'object') throw new Error();
          const account = value as Record<string, unknown>;
          const address = account.email ?? account.from;
          if (typeof address !== 'string') throw new Error();
          const fields = ['clientId', 'clientSecret', 'refreshToken'] as const;
          for (const field of fields) {
            if (typeof account[field] !== 'string' || !account[field].trim())
              throw new Error();
          }
          const { checkQuotaBounces } = account;
          if (
            checkQuotaBounces !== undefined &&
            typeof checkQuotaBounces !== 'boolean'
          )
            throw new Error();
          const from = address.trim();
          if (!isEmail(from) || seen.has(from.toLowerCase())) throw new Error();
          seen.add(from.toLowerCase());
          return {
            from,
            clientId: (account.clientId as string).trim(),
            clientSecret: (account.clientSecret as string).trim(),
            refreshToken: (account.refreshToken as string).trim(),
            checkQuotaBounces,
          };
        });
        return { provider, from: accounts[0].from, accounts, dailySoftLimit };
      } catch {
        throw new ServiceUnavailableException('GMAIL_ACCOUNTS không hợp lệ.');
      }
    }
    const from = this.config.get<string>('MAIL_FROM')?.trim();
    if (!from || !isEmail(from))
      throw new ServiceUnavailableException(
        'Chưa cấu hình địa chỉ gửi email hợp lệ.',
      );
    if (provider === 'gmail_api') {
      const clientId = this.config.get<string>('GMAIL_CLIENT_ID')?.trim();
      const clientSecret = this.config
        .get<string>('GMAIL_CLIENT_SECRET')
        ?.trim();
      const refreshToken = this.config
        .get<string>('GMAIL_REFRESH_TOKEN')
        ?.trim();
      if (!clientId || !clientSecret || !refreshToken)
        throw new ServiceUnavailableException(
          'Chưa cấu hình OAuth Gmail API hợp lệ.',
        );
      return {
        provider,
        from,
        accounts: [{ from, clientId, clientSecret, refreshToken }],
        dailySoftLimit,
      };
    }
    if (provider === 'resend') {
      const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
      if (!apiKey)
        throw new ServiceUnavailableException(
          'Chưa cấu hình dịch vụ gửi email.',
        );
      return { provider, from, apiKey };
    }
    if (provider !== 'smtp')
      throw new ServiceUnavailableException('EMAIL_PROVIDER không hợp lệ.');
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS');
    const port = Number(this.config.get<string>('SMTP_PORT') || 465);
    const secureValue =
      this.config.get<string>('SMTP_SECURE') || String(port === 465);
    if (
      !host ||
      !user ||
      !pass ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535 ||
      !['true', 'false'].includes(secureValue)
    ) {
      throw new ServiceUnavailableException('Chưa cấu hình SMTP hợp lệ.');
    }
    return {
      provider,
      from,
      host,
      port,
      user,
      pass,
      secure: secureValue === 'true',
    };
  }

  assertAvailable(): void {
    this.settings();
  }

  private async checkGmailQuotaBounce(
    account: GmailAccount,
    label: string,
    subject: string,
    challengeId: string,
  ): Promise<void> {
    if (!account.checkQuotaBounces || account.nextBounceCheckAt > Date.now())
      return;

    account.bounceCheck ??= account.mailer
      .quotaBounceUntil(subject)
      .then((until) => {
        if (until <= Date.now()) return;
        account.exhaustedUntil = Math.max(account.exhaustedUntil, until);
        this.logger.warn(
          `Gmail quota bounce detected ${label} challengeId=${challengeId} pausedUntil=${new Date(account.exhaustedUntil).toISOString()}`,
        );
      })
      .catch((error: unknown) => {
        const failure = error instanceof GmailDeliveryError ? error : undefined;
        this.logger.warn(
          `Gmail quota check failed ${label} challengeId=${challengeId} status=${failure?.status ?? 'unknown'} reason=${failure?.reason ?? 'unknown'}`,
        );
      })
      .finally(() => {
        account.nextBounceCheckAt = Date.now() + 60000;
        account.bounceCheck = undefined;
      });

    await account.bounceCheck;
  }

  async sendOtp(
    email: string,
    otp: string,
    context: OtpEmailContext,
  ): Promise<void> {
    const settings = this.settings();
    try {
      const { subject, text } = createOtpEmail(otp);
      if (settings.provider === 'smtp') {
        this.smtp ??= nodemailer.createTransport({
          host: settings.host,
          port: settings.port,
          secure: settings.secure,
          requireTLS: !settings.secure,
          auth: { user: settings.user, pass: settings.pass },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          disableFileAccess: true,
          disableUrlAccess: true,
          logger: false,
          debug: false,
        });
        const info = await this.smtp.sendMail({
          from: { name: 'Du lịch Nông thôn', address: settings.from },
          to: email,
          subject,
          text,
        });
        const accepted = info.accepted?.some(
          (recipient) => recipient.toLowerCase() === email.toLowerCase(),
        );
        if (!accepted || info.rejected?.length)
          throw new Error('Recipient not accepted');
      } else if (settings.provider === 'gmail_api') {
        await this.sendGmail(
          settings,
          email,
          subject,
          text,
          context.challengeId,
        );
      } else {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `otp/${context.challengeId}`,
          },
          body: JSON.stringify({
            from: `Du lịch Nông thôn <${settings.from}>`,
            to: [email],
            subject,
            text,
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
          await response.body?.cancel();
          throw new Error('Email HTTP request rejected');
        }
        const result: unknown = await response.json();
        if (
          !result ||
          typeof result !== 'object' ||
          !('id' in result) ||
          typeof result.id !== 'string' ||
          !result.id
        ) {
          throw new Error('Email request not accepted');
        }
      }
    } catch (error) {
      if (error instanceof GmailDeliveryError && error.kind === 'recipient')
        throw new BadRequestException('Địa chỉ email người nhận không hợp lệ.');
      // Không trả lỗi SMTP/API gốc vì có thể chứa email, OTP hoặc credential.
      throw new ServiceUnavailableException(
        'Không thể gửi email lúc này. Vui lòng thử lại sau.',
      );
    }
  }

  private async sendGmail(
    settings: Extract<MailSettings, { provider: 'gmail_api' }>,
    email: string,
    subject: string,
    text: string,
    challengeId: string,
  ): Promise<void> {
    this.gmail ??= settings.accounts.map((account) => ({
      from: account.from,
      mailer: new GmailApiMailer(account),
      exhaustedUntil: 0,
      disabled: false,
      sentToday: 0,
      dailyResetAt: 0,
      inFlight: 0,
      checkQuotaBounces: account.checkQuotaBounces,
      nextBounceCheckAt: 0,
    }));

    for (const [index, account] of this.gmail.entries()) {
      const label = `account=${index + 1} sender=${account.from[0]}***@${account.from.split('@').at(-1)}`;
      const accountLog = `${label} challengeId=${challengeId}`;
      const now = Date.now();
      refreshGmailDay(account, now);
      if (account.disabled || account.exhaustedUntil > now) continue;
      if (account.sentToday + account.inFlight >= settings.dailySoftLimit)
        continue;

      // Giữ một chỗ trước khi chờ mạng để các request đồng thời không vượt ngưỡng mềm.
      account.inFlight++;
      try {
        await this.checkGmailQuotaBounce(account, label, subject, challengeId);
        for (let attempt = 1; attempt <= 3; attempt++) {
          if (account.disabled || account.exhaustedUntil > Date.now()) break;
          try {
            const id = await account.mailer.send(
              account.from,
              email,
              subject,
              text,
            );
            const acceptedAt = Date.now();
            refreshGmailDay(account, acceptedAt);
            account.sentToday++;
            const messageId = /^[a-zA-Z0-9_-]{1,128}$/.test(id)
              ? id
              : '[redacted]';
            this.logger.log(
              `Gmail OTP accepted ${accountLog} attempt=${attempt} messageId=${messageId}`,
            );
            if (account.sentToday === settings.dailySoftLimit)
              this.logger.log(
                `Gmail account exhausted ${accountLog} reason=soft_limit until=${new Date(account.dailyResetAt).toISOString()}`,
              );
            return;
          } catch (error) {
            if (!(error instanceof GmailDeliveryError)) throw error;
            const now = Date.now();
            const retry = error.kind === 'transient' && attempt < 3;
            let action = 'stop';
            switch (error.kind) {
              case 'auth':
                account.disabled = true;
                action = 'disable_and_switch';
                break;
              case 'daily_quota':
              case 'rate_limit': {
                const until =
                  error.kind === 'daily_quota'
                    ? Math.max(
                        nextPacificMidnight(now),
                        now + (error.retryAfterMs ?? 0),
                      )
                    : now + (error.retryAfterMs ?? 60000);
                account.exhaustedUntil = Math.max(
                  account.exhaustedUntil,
                  Math.min(until, now + dayMs),
                );
                action = 'exhaust_and_switch';
                break;
              }
              case 'transient':
                action = retry ? 'retry' : 'switch';
                break;
            }
            this.logger.warn(
              `Gmail delivery failed ${accountLog} attempt=${attempt} stage=${error.stage} status=${error.status ?? 'unknown'} reason=${error.reason} action=${action}`,
            );
            if (action === 'stop') throw error;
            if (!retry) break;
            await delay(250 * 2 ** (attempt - 1));
          }
        }
      } finally {
        account.inFlight--;
      }
    }
    throw new Error('All Gmail accounts unavailable');
  }

  onModuleDestroy(): void {
    this.smtp?.close();
  }
}
