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
);

/** SMTP cho local/hosting hỗ trợ; HTTPS Resend cho Render Free. Không log OTP/credential. */
@Injectable()
export class OtpEmailService implements EmailSender, OnModuleDestroy {
  private smtp?: Transporter<SMTPTransport.SentMessageInfo>;
  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  private settings(): MailSettings {
    const provider = this.config.get<string>('EMAIL_PROVIDER') || 'smtp';
    const from = this.config.get<string>('MAIL_FROM')?.trim();
    if (!from || !isEmail(from))
      throw new ServiceUnavailableException(
        'Chưa cấu hình địa chỉ gửi email hợp lệ.',
      );
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
    const subject = 'Mã xác thực đăng nhập | Du lịch Nông thôn';
    const minutes = Math.ceil(context.expiresInSeconds / 60);
    const text = `Mã xác thực đăng nhập Du lịch Nông thôn của bạn là ${otp}. Mã có hiệu lực trong ${minutes} phút. Không chia sẻ mã này. Nếu bạn không yêu cầu đăng nhập, hãy bỏ qua email.`;
    // OTP được sinh nội bộ gồm 6 chữ số; không đưa dữ liệu nhập từ người dùng vào HTML.
    if (!/^\d{6}$/.test(otp))
      throw new ServiceUnavailableException('Không thể tạo email xác thực.');
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#18352b"><h2>Du lịch Nông thôn</h2><p>Mã xác thực đăng nhập của bạn:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px">${otp}</p><p>Mã có hiệu lực trong ${minutes} phút. Không chia sẻ mã này.</p><p>Nếu bạn không yêu cầu đăng nhập, hãy bỏ qua email.</p></div>`;
    try {
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
        });
        const accepted = info.accepted?.some(
          (recipient) => recipient.toLowerCase() === email.toLowerCase(),
        );
        if (!accepted || info.rejected?.length)
          throw new Error('Recipient not accepted');
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
