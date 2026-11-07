import {
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
  | { provider: 'gmail_api'; accounts: ({ from: string } & GmailApiSettings)[] }
);

/** Production Render Free dùng Gmail API qua HTTPS. Không log OTP/credential. */
@Injectable()
export class OtpEmailService implements EmailSender, OnModuleDestroy {
  private readonly logger = new Logger(OtpEmailService.name);
  private smtp?: Transporter<SMTPTransport.SentMessageInfo>;
  private gmail?: {
    from: string;
    mailer: GmailApiMailer;
    availableAt: number;
  }[];
  private gmailIndex = 0;
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  private settings(): MailSettings {
    const provider = this.config.get<string>('EMAIL_PROVIDER') || 'gmail_api';
    const accountJson = this.config.get<string>('GMAIL_ACCOUNTS')?.trim();
    if (provider === 'gmail_api' && accountJson) {
      try {
        const values: unknown = JSON.parse(accountJson);
        if (!Array.isArray(values) || !values.length) throw new Error();
        const seen = new Set<string>();
        const accounts = values.map((value: unknown) => {
          if (!value || typeof value !== 'object') throw new Error();
          const account = value as Record<string, unknown>;
          const fields = [
            'from',
            'clientId',
            'clientSecret',
            'refreshToken',
          ] as const;
          for (const field of fields) {
            if (typeof account[field] !== 'string' || !account[field].trim())
              throw new Error();
          }
          const from = (account.from as string).trim();
          if (!isEmail(from) || seen.has(from.toLowerCase())) throw new Error();
          seen.add(from.toLowerCase());
          return {
            from,
            clientId: (account.clientId as string).trim(),
            clientSecret: (account.clientSecret as string).trim(),
            refreshToken: (account.refreshToken as string).trim(),
          };
        });
        return { provider, from: accounts[0].from, accounts };
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
        this.gmail ??= settings.accounts.map((account) => ({
          from: account.from,
          mailer: new GmailApiMailer(account),
          availableAt: 0,
        }));
        const start = this.gmailIndex;
        let sent = false;
        for (let offset = 0; offset < this.gmail.length; offset++) {
          const index = (start + offset) % this.gmail.length;
          const account = this.gmail[index];
          if (account.availableAt > Date.now()) continue;
          try {
            await account.mailer.send(account.from, email, subject, text);
            this.gmailIndex = index;
            sent = true;
            break;
          } catch (error) {
            if (error instanceof GmailDeliveryError) {
              this.logger.warn(
                `Gmail delivery failed account=${index + 1} challengeId=${context.challengeId} stage=${error.stage} status=${error.status ?? 'unknown'} reason=${error.reason}`,
              );
            }
            const cooldown =
              error instanceof GmailDeliveryError
                ? error.accountCooldownMs
                : undefined;
            if (cooldown === undefined) throw error;
            account.availableAt = Date.now() + cooldown;
          }
        }
        if (!sent) throw new Error('All Gmail accounts unavailable');
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
    } catch {
      // Không trả lỗi SMTP/API gốc vì có thể chứa email, OTP hoặc credential.
      throw new ServiceUnavailableException(
        'Không thể gửi email lúc này. Vui lòng thử lại sau.',
      );
    }
  }

  onModuleDestroy(): void {
    this.smtp?.close();
  }
}
