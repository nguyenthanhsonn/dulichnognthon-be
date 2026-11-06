import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { type DataSource } from 'typeorm';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import { AuthService } from '../auth.service.js';
import { getAuthSettings } from '../auth.config.js';
import { OtpEmailService } from './otp-email.service.js';

const smtp = {
  EMAIL_PROVIDER: 'smtp',
  MAIL_FROM: 'sender@example.com',
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: '465',
  SMTP_SECURE: 'true',
  SMTP_USER: 'sender@example.com',
  SMTP_PASS: 'private-app-password',
};
const resend = {
  EMAIL_PROVIDER: 'resend',
  MAIL_FROM: 'login@example.com',
  RESEND_API_KEY: 'private-api-key',
};
const gmail = {
  EMAIL_PROVIDER: 'gmail_api',
  MAIL_FROM: 'sender@gmail.com',
  GMAIL_CLIENT_ID: 'test-client.apps.googleusercontent.com',
  GMAIL_CLIENT_SECRET: 'private-client-secret',
  GMAIL_REFRESH_TOKEN: 'private-refresh-token',
};
const context = {
  challengeId: '00000000-0000-4000-8000-000000000001',
  expiresInSeconds: 300,
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('sends Gmail SMTP email with verified TLS, plain text and HTML without real network calls', async () => {
  const sendMail = vi
    .fn()
    .mockResolvedValue({ accepted: ['voter@example.com'], rejected: [] });
  const close = vi.fn();
  const create = vi
    .spyOn(nodemailer, 'createTransport')
    .mockReturnValue({ sendMail, close } as any);
  const service = new OtpEmailService(new ConfigService(smtp));
  await service.sendOtp('voter@example.com', '012345', context);
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: smtp.SMTP_USER, pass: smtp.SMTP_PASS },
      disableFileAccess: true,
      disableUrlAccess: true,
    }),
  );
  expect(sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: 'voter@example.com',
      text: '012345',
      html: expect.stringContaining('012345'),
    }),
  );
  service.onModuleDestroy();
  expect(close).toHaveBeenCalled();
});

it('requires STARTTLS on port 587', async () => {
  const create = vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
    sendMail: vi
      .fn()
      .mockResolvedValue({ accepted: ['voter@example.com'], rejected: [] }),
  } as any);
  await new OtpEmailService(
    new ConfigService({ ...smtp, SMTP_PORT: '587', SMTP_SECURE: 'false' }),
  ).sendOtp('voter@example.com', '123456', context);
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({ port: 587, secure: false, requireTLS: true }),
  );
});

it('sends Resend through HTTPS with an idempotency key for the challenge', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => ({ id: 'email-id' }) });
  vi.stubGlobal('fetch', fetchMock);
  await new OtpEmailService(new ConfigService(resend)).sendOtp(
    'voter@example.com',
    '123456',
    context,
  );
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe('https://api.resend.com/emails');
  expect(options.headers).toMatchObject({
    Authorization: 'Bearer private-api-key',
    'Idempotency-Key': `otp/${context.challengeId}`,
  });
  expect(JSON.parse(options.body)).toMatchObject({
    to: ['voter@example.com'],
    from: 'Du lịch Nông thôn <login@example.com>',
    text: '123456',
    html: expect.stringContaining('123456'),
  });
  expect(url).not.toContain('123456');
});

it.each([
  {},
  { ...smtp, SMTP_PASS: '' },
  { ...smtp, SMTP_SECURE: 'invalid' },
  { ...smtp, MAIL_FROM: 'not-email' },
  { ...resend, RESEND_API_KEY: '' },
  { ...resend, EMAIL_PROVIDER: 'unknown' },
  { ...gmail, GMAIL_CLIENT_ID: '' },
  { ...gmail, GMAIL_CLIENT_SECRET: '' },
  { ...gmail, GMAIL_REFRESH_TOKEN: '' },
])(
  'rejects invalid config before creating an OTP challenge (%j)',
  async (values) => {
    const transaction = vi.fn();
    const mail = new OtpEmailService(new ConfigService(values));
    const settings = getAuthSettings(
      new ConfigService({
        AUTH_JWT_SECRET: 'test-jwt-secret-at-least-32-characters',
        AUTH_OTP_SECRET: 'test-otp-secret-at-least-32-characters',
      }),
    );
    const auth = new AuthService(
      { transaction } as unknown as DataSource,
      new JwtService(),
      settings,
      mail,
    );
    await expect(auth.sendOtp('voter@example.com')).rejects.toMatchObject({
      status: 503,
    });
    expect(transaction).not.toHaveBeenCalled();
  },
);

it('sends Gmail API MIME through HTTPS with OAuth and never connects to SMTP', async () => {
  const smtpCreate = vi.spyOn(nodemailer, 'createTransport');
  const credentials = vi.spyOn(OAuth2Client.prototype, 'setCredentials');
  const requestMock = vi
    .fn()
    .mockResolvedValue({ data: { id: 'gmail-message-id' } });
  vi.spyOn(OAuth2Client.prototype, 'getAccessToken').mockImplementation(
    async function (this: OAuth2Client) {
      this.transporter.request = requestMock;
      return { token: 'private-access-token' };
    },
  );
  const service = new OtpEmailService(new ConfigService(gmail));
  await service.sendOtp('voter@example.com', '012345', context);
  expect(credentials).toHaveBeenCalledWith({
    refresh_token: gmail.GMAIL_REFRESH_TOKEN,
  });
  expect(smtpCreate).not.toHaveBeenCalled();
  expect(requestMock).toHaveBeenCalledTimes(1);
  const [options] = requestMock.mock.calls[0];
  expect(options.url).toBe(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
  );
  expect(options.retry).toBe(false);
  expect(options.headers.Authorization).toBe('Bearer private-access-token');
  const raw = options.data.raw;
  expect(raw).toMatch(/^[A-Za-z0-9_-]+$/);
  const mime = Buffer.from(raw, 'base64url').toString('utf8');
  expect(mime).toContain('To: voter@example.com');
  expect(mime).toContain('<sender@gmail.com>');
  expect(mime).toContain('multipart/alternative');
  expect(mime).not.toContain('Content-Disposition:');
  expect(mime).toContain('012345');
  expect(mime).not.toContain(gmail.GMAIL_REFRESH_TOKEN);
  expect(mime).not.toContain('private-access-token');
});

it('rejects a revoked Gmail OAuth grant without sending or exposing provider errors', async () => {
  vi.spyOn(OAuth2Client.prototype, 'getAccessToken').mockRejectedValue(
    new Error('invalid_grant private-refresh-token'),
  );
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  await expect(
    new OtpEmailService(new ConfigService(gmail)).sendOtp(
      'voter@example.com',
      '123456',
      context,
    ),
  ).rejects.toThrow('Không thể gửi email lúc này. Vui lòng thử lại sau.');
  expect(fetchMock).not.toHaveBeenCalled();
});

it.each([401, 403, 429, 'malformed', 'timeout'])(
  'rejects Gmail errors without automatically retrying email delivery (%s)',
  async (failure) => {
    const requestMock = vi.fn();
    if (failure === 'malformed')
      requestMock.mockResolvedValue({ data: { error: 'rejected' } });
    else requestMock.mockRejectedValue({ response: { status: failure } });
    vi.spyOn(OAuth2Client.prototype, 'getAccessToken').mockImplementation(
      async function (this: OAuth2Client) {
        this.transporter.request = requestMock;
        return { token: 'private-access-token' };
      },
    );
    await expect(
      new OtpEmailService(new ConfigService(gmail)).sendOtp(
        'voter@example.com',
        '123456',
        context,
      ),
    ).rejects.toThrow('Không thể gửi email');
    expect(requestMock).toHaveBeenCalledTimes(1);
  },
);

it('rejects SMTP failures and rejected recipients without leaking the provider error', async () => {
  vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
    sendMail: vi
      .fn()
      .mockRejectedValue(new Error('private-app-password 123456')),
  } as any);
  await expect(
    new OtpEmailService(new ConfigService(smtp)).sendOtp(
      'voter@example.com',
      '123456',
      context,
    ),
  ).rejects.toThrow('Không thể gửi email');
});

it('does not report success when SMTP rejects the recipient', async () => {
  vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
    sendMail: vi
      .fn()
      .mockResolvedValue({ accepted: [], rejected: ['voter@example.com'] }),
  } as any);
  await expect(
    new OtpEmailService(new ConfigService(smtp)).sendOtp(
      'voter@example.com',
      '123456',
      context,
    ),
  ).rejects.toThrow('Không thể gửi email');
});

it.each([
  { ok: false, body: { cancel: vi.fn() } },
  { ok: true, json: async () => ({ error: 'rejected' }) },
])(
  'rejects email HTTP errors or malformed acceptance (%j)',
  async (response) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    await expect(
      new OtpEmailService(new ConfigService(resend)).sendOtp(
        'voter@example.com',
        '123456',
        context,
      ),
    ).rejects.toThrow('Không thể gửi email');
  },
);
