import {
  Inject,
  Injectable,
  type OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isEmail } from 'class-validator';
import nodemailer, { type Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import type { EmailSender, OtpEmailContext } from './email-sender.js';
import { GmailApiMailer, type GmailApiSettings } from './gmail-api-mailer.js';
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
  | ({ provider: 'gmail_api' } & GmailApiSettings)
);

/** Production Render Free dùng Gmail API qua HTTPS. Không log OTP/credential. */
@Injectable()
export class OtpEmailService implements EmailSender, OnModuleDestroy {
  private smtp?: Transporter<SMTPTransport.SentMessageInfo>;
  private gmail?: GmailApiMailer;
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  private settings(): MailSettings {
    const provider = this.config.get<string>('EMAIL_PROVIDER') || 'gmail_api';
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
      return { provider, from, clientId, clientSecret, refreshToken };
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
      const { subject, text, html, attachments } = createOtpEmail(
        otp,
        context.expiresInSeconds,
      );
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
          html,
          attachments,
        });
        const accepted = info.accepted?.some(
          (recipient) => recipient.toLowerCase() === email.toLowerCase(),
        );
        if (!accepted || info.rejected?.length)
          throw new Error('Recipient not accepted');
      } else if (settings.provider === 'gmail_api') {
        this.gmail ??= new GmailApiMailer(settings);
        await this.gmail.send(
          settings.from,
          email,
          subject,
          text,
          html,
          attachments,
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
            html,
            attachments: attachments.map((attachment) => ({
              filename: attachment.filename,
              content: attachment.content.toString('base64'),
              content_type: attachment.contentType,
              content_id: attachment.cid,
            })),
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
