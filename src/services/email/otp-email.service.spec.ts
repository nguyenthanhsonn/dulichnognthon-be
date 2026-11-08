import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
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

it('sends Gmail SMTP email with verified TLS, plain text without real network calls', async () => {
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
    .mockResolvedValue({ status: 200, data: { id: 'gmail-message-id' } });
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
  expect(mime).toContain('Content-Type: text/plain');
  expect(mime).not.toContain('text/html');
  expect(mime).not.toContain('Content-Disposition:');
  expect(mime.split('\r\n\r\n')[1]?.trim()).toBe('012345');
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

it.each([401, 403, 429, 'missing-id', 'wrong-status'])(
  'rejects Gmail errors without automatically retrying email delivery (%s)',
  async (failure) => {
    const requestMock = vi.fn();
    if (failure === 'missing-id')
      requestMock.mockResolvedValue({ status: 200, data: {} });
    else if (failure === 'wrong-status')
      requestMock.mockResolvedValue({
        status: 201,
        data: { id: 'unexpected' },
      });
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

const gmailAccounts = [
  {
    from: 'primary@gmail.com',
    clientId: 'primary-client',
    clientSecret: 'primary-secret',
    refreshToken: 'primary-token',
  },
  {
    from: 'backup@gmail.com',
    clientId: 'backup-client',
    clientSecret: 'backup-secret',
    refreshToken: 'backup-token',
  },
];
const gmailPool = {
  EMAIL_PROVIDER: 'gmail_api',
  GMAIL_ACCOUNTS: JSON.stringify(gmailAccounts),
};
const gmailPoolWithBounceCheck = {
  ...gmailPool,
  GMAIL_ACCOUNTS: JSON.stringify([
    { ...gmailAccounts[0], checkQuotaBounces: true },
    gmailAccounts[1],
  ]),
};

function mockGmailRequests(request: ReturnType<typeof vi.fn>) {
  vi.spyOn(OAuth2Client.prototype, 'getAccessToken').mockImplementation(
    async function (this: OAuth2Client) {
      this.transporter.request = request;
      return { token: String(this.credentials.refresh_token) };
    },
  );
}

const quotaNotice = {
  snippet: 'Bạn đã đạt đến giới hạn gửi thư. Thư của bạn chưa được gửi. 123456',
  payload: {
    headers: [
      {
        name: 'From',
        value: 'Mail Delivery Subsystem <mailer-daemon@googlemail.com>',
      },
    ],
  },
};

it('skips a Gmail account after a later quota notice and shares the check across concurrent requests', async () => {
  const startedAt = 1800000000000;
  const now = vi.spyOn(Date, 'now').mockReturnValue(startedAt);
  const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  const request = vi
    .fn()
    .mockResolvedValueOnce({ data: {} })
    .mockResolvedValueOnce({ status: 200, data: { id: 'accepted-by-primary' } })
    .mockResolvedValueOnce({ data: { messages: [{ id: 'quota-notice' }] } })
    .mockResolvedValueOnce({
      data: { ...quotaNotice, internalDate: String(startedAt + 1000) },
    })
    .mockResolvedValue({ status: 200, data: { id: 'accepted-by-backup' } });
  mockGmailRequests(request);
  const service = new OtpEmailService(
    new ConfigService(gmailPoolWithBounceCheck),
  );

  await service.sendOtp('voter@example.com', '123456', context);
  now.mockReturnValue(startedAt + 60000);
  await Promise.all([
    service.sendOtp('voter@example.com', '234567', context),
    service.sendOtp('another@example.com', '345678', context),
  ]);
  await service.sendOtp('voter@example.com', '456789', context);

  expect(request.mock.calls.map(([options]) => options.method)).toEqual([
    'GET',
    'POST',
    'GET',
    'GET',
    'POST',
    'POST',
    'POST',
  ]);
  expect(
    request.mock.calls
      .filter(([options]) => options.method === 'POST')
      .map(([options]) => options.headers.Authorization),
  ).toEqual([
    'Bearer primary-token',
    'Bearer backup-token',
    'Bearer backup-token',
    'Bearer backup-token',
  ]);
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining('Gmail quota bounce detected account=1'),
  );
  expect(log).toHaveBeenCalledWith(
    expect.stringContaining(
      'Gmail OTP accepted account=2 sender=b***@gmail.com',
    ),
  );
  expect(JSON.stringify(warn.mock.calls)).not.toContain('123456');
});

it('ignores an expired quota notice, a different sender, and a non-quota bounce', async () => {
  const now = 1800000000000;
  vi.spyOn(Date, 'now').mockReturnValue(now);
  const request = vi
    .fn()
    .mockResolvedValueOnce({
      data: { messages: [{ id: 'old' }, { id: 'sender' }, { id: 'blocked' }] },
    })
    .mockResolvedValueOnce({
      data: { ...quotaNotice, internalDate: String(now - 86400000) },
    })
    .mockResolvedValueOnce({
      data: {
        ...quotaNotice,
        internalDate: String(now),
        payload: { headers: [{ name: 'From', value: 'other@example.com' }] },
      },
    })
    .mockResolvedValueOnce({
      data: {
        ...quotaNotice,
        internalDate: String(now),
        snippet: 'Thư đã bị chặn.',
      },
    })
    .mockResolvedValueOnce({
      status: 200,
      data: { id: 'accepted-by-primary' },
    });
  mockGmailRequests(request);

  await new OtpEmailService(
    new ConfigService(gmailPoolWithBounceCheck),
  ).sendOtp('voter@example.com', '123456', context);

  expect(request.mock.lastCall?.[0]).toMatchObject({
    method: 'POST',
    headers: { Authorization: 'Bearer primary-token' },
  });
});

it('keeps sending and throttles mailbox checks if OAuth cannot read the mailbox', async () => {
  const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  const request = vi
    .fn()
    .mockRejectedValueOnce({
      response: {
        status: 403,
        data: { error: { errors: [{ reason: 'insufficientPermissions' }] } },
      },
    })
    .mockResolvedValue({ status: 200, data: { id: 'accepted-by-primary' } });
  mockGmailRequests(request);
  const service = new OtpEmailService(
    new ConfigService(gmailPoolWithBounceCheck),
  );

  await service.sendOtp('voter@example.com', '123456', context);
  await service.sendOtp('voter@example.com', '234567', context);

  expect(request.mock.calls.map(([options]) => options.method)).toEqual([
    'GET',
    'POST',
    'POST',
  ]);
  expect(warn).toHaveBeenCalledExactlyOnceWith(
    expect.stringContaining('status=403 reason=insufficientPermissions'),
  );
});

it.each([
  { status: 429 },
  {
    status: 403,
    data: { error: { errors: [{ reason: 'userRateLimitExceeded' }] } },
  },
])(
  'switches Gmail accounts on quota rejection and keeps using the backup (%j)',
  async (response) => {
    const request = vi
      .fn()
      .mockRejectedValueOnce({ response })
      .mockResolvedValue({ status: 200, data: { id: 'sent' } });
    mockGmailRequests(request);
    const service = new OtpEmailService(new ConfigService(gmailPool));
    await service.sendOtp('voter@example.com', '012345', context);
    await service.sendOtp('voter@example.com', '654321', context);
    expect(
      request.mock.calls.map(([options]) => options.headers.Authorization),
    ).toEqual([
      'Bearer primary-token',
      'Bearer backup-token',
      'Bearer backup-token',
    ]);
    const mime = Buffer.from(
      request.mock.calls[1][0].data.raw,
      'base64url',
    ).toString('utf8');
    expect(mime).toContain('<backup@gmail.com>');
    expect(mime.split('\r\n\r\n')[1]?.trim()).toBe('012345');
  },
);

it('skips exhausted accounts until Retry-After expires, then recovers', async () => {
  const now = vi.spyOn(Date, 'now').mockReturnValue(1000000);
  const request = vi.fn().mockRejectedValue({
    response: { status: 429, headers: { get: () => '120' } },
  });
  mockGmailRequests(request);
  const service = new OtpEmailService(new ConfigService(gmailPool));
  await expect(
    service.sendOtp('voter@example.com', '123456', context),
  ).rejects.toThrow('Không thể gửi email');
  expect(request).toHaveBeenCalledTimes(2);
  now.mockReturnValue(1061000);
  await expect(
    service.sendOtp('voter@example.com', '123456', context),
  ).rejects.toThrow('Không thể gửi email');
  expect(request).toHaveBeenCalledTimes(2);
  now.mockReturnValue(1120001);
  request.mockResolvedValue({ status: 200, data: { id: 'recovered' } });
  await service.sendOtp('voter@example.com', '123456', context);
  expect(request).toHaveBeenCalledTimes(3);
});

it.each([
  { response: { status: 400 } },
  {
    response: {
      status: 403,
      data: { error: { errors: [{ reason: 'unknownPolicy' }] } },
    },
  },
])('does not switch accounts for unrelated errors (%j)', async (error) => {
  const request = vi.fn().mockRejectedValue(error);
  mockGmailRequests(request);
  await expect(
    new OtpEmailService(new ConfigService(gmailPool)).sendOtp(
      'voter@example.com',
      '123456',
      context,
    ),
  ).rejects.toThrow('Không thể gửi email');
  expect(request).toHaveBeenCalledTimes(1);
});

it.each([
  'invalid-json',
  '[]',
  '[{}]',
  JSON.stringify([
    {
      from: 'invalid',
      clientId: 'id',
      clientSecret: 'secret',
      refreshToken: 'token',
    },
  ]),
  JSON.stringify([
    {
      from: 'same@gmail.com',
      clientId: 'id',
      clientSecret: 'secret',
      refreshToken: 'token',
    },
    {
      from: 'SAME@gmail.com',
      clientId: 'id2',
      clientSecret: 'secret2',
      refreshToken: 'token2',
    },
  ]),
])(
  'rejects invalid Gmail pools without silently falling back to legacy config (%s)',
  (accounts) => {
    const service = new OtpEmailService(
      new ConfigService({ ...gmail, GMAIL_ACCOUNTS: accounts }),
    );
    expect(() => service.assertAvailable()).toThrow(
      'GMAIL_ACCOUNTS không hợp lệ',
    );
  },
);

it.each([
  [
    'oauth',
    {
      response: {
        status: 400,
        data: { error: 'invalid_grant', error_description: 'SECRET OTP TOKEN' },
      },
    },
    'invalid_grant',
  ],
  [
    'send',
    {
      response: {
        status: 403,
        data: {
          error: {
            errors: [
              {
                reason: 'insufficientPermissions',
                message: 'SECRET OTP TOKEN',
              },
            ],
          },
        },
      },
    },
    'insufficientPermissions',
  ],
  ['send', { code: 'ETIMEDOUT', message: 'SECRET OTP TOKEN' }, 'ETIMEDOUT'],
  [
    'send',
    {
      code: 'SECRET OTP TOKEN',
      response: { status: 400, data: { error: 'SECRET OTP TOKEN' } },
    },
    'unknown',
  ],
])(
  'logs safe diagnostics for %s failures without exposing credentials',
  async (stage, failure, reason) => {
    const log = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    if (stage === 'oauth') {
      vi.spyOn(OAuth2Client.prototype, 'getAccessToken').mockRejectedValue(
        failure,
      );
    } else {
      mockGmailRequests(vi.fn().mockRejectedValue(failure));
    }
    await expect(
      new OtpEmailService(new ConfigService(gmail)).sendOtp(
        'voter@example.com',
        '012345',
        context,
      ),
    ).rejects.toThrow('Không thể gửi email');
    expect(log).toHaveBeenCalledWith(expect.stringContaining(`stage=${stage}`));
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining(`reason=${reason}`),
    );
    const output = JSON.stringify(log.mock.calls);
    for (const secret of [
      'SECRET',
      '012345',
      'voter@example.com',
      gmail.GMAIL_REFRESH_TOKEN,
      gmail.GMAIL_CLIENT_SECRET,
    ]) {
      expect(output).not.toContain(secret);
    }
  },
);

it.each([
  'accessNotConfigured',
  'insufficientPermissions',
  'domainPolicy',
  'authError',
  'forbidden',
  'unauthorized',
])(
  'uses the backup after a definite Gmail account rejection (%s)',
  async (reason) => {
    const request = vi
      .fn()
      .mockRejectedValueOnce({
        response: {
          status: reason === 'unauthorized' ? 401 : 403,
          data: { error: { errors: [{ reason }] } },
        },
      })
      .mockResolvedValue({ status: 200, data: { id: 'accepted' } });
    mockGmailRequests(request);
    const service = new OtpEmailService(new ConfigService(gmailPool));
    await service.sendOtp('voter@example.com', '123456', context);
    await service.sendOtp('voter@example.com', '654321', context);
    expect(
      request.mock.calls.map(([options]) => options.headers.Authorization),
    ).toEqual([
      'Bearer primary-token',
      'Bearer backup-token',
      'Bearer backup-token',
    ]);
  },
);

it.each([
  'invalid_grant',
  'invalid_client',
  'unauthorized_client',
  'access_denied',
])(
  'skips rejected OAuth credentials without sending through that account (%s)',
  async (reason) => {
    const request = vi
      .fn()
      .mockResolvedValue({ status: 200, data: { id: 'accepted' } });
    const getAccessToken = vi
      .spyOn(OAuth2Client.prototype, 'getAccessToken')
      .mockImplementation(async function (this: OAuth2Client) {
        if (this.credentials.refresh_token === 'primary-token')
          throw { response: { status: 400, data: { error: reason } } };
        this.transporter.request = request;
        return { token: 'backup-token' };
      });
    const service = new OtpEmailService(new ConfigService(gmailPool));
    await service.sendOtp('voter@example.com', '123456', context);
    await service.sendOtp('voter@example.com', '654321', context);
    expect(getAccessToken).toHaveBeenCalledTimes(3);
    expect(
      request.mock.calls.map(([options]) => options.headers.Authorization),
    ).toEqual(['Bearer backup-token', 'Bearer backup-token']);
  },
);

it('reaches account four after two quota errors and an API-disabled account', async () => {
  const pool = [1, 2, 3, 4].map((i) => ({
    from: `sender${i}@gmail.com`,
    clientId: `client${i}`,
    clientSecret: `secret${i}`,
    refreshToken: `token${i}`,
  }));
  const request = vi
    .fn()
    .mockRejectedValueOnce({ response: { status: 429 } })
    .mockRejectedValueOnce({ response: { status: 429 } })
    .mockRejectedValueOnce({
      response: {
        status: 403,
        data: { error: { errors: [{ reason: 'accessNotConfigured' }] } },
      },
    })
    .mockResolvedValue({ status: 200, data: { id: 'accepted' } });
  mockGmailRequests(request);
  const service = new OtpEmailService(
    new ConfigService({
      EMAIL_PROVIDER: 'gmail_api',
      GMAIL_ACCOUNTS: JSON.stringify(pool),
    }),
  );
  await service.sendOtp('voter@example.com', '123456', context);
  expect(
    request.mock.calls.map(([options]) => options.headers.Authorization),
  ).toEqual([
    'Bearer token1',
    'Bearer token2',
    'Bearer token3',
    'Bearer token4',
  ]);
  const bodies = request.mock.calls.map(([options]) =>
    Buffer.from(options.data.raw, 'base64url')
      .toString('utf8')
      .split('\r\n\r\n')[1]
      ?.trim(),
  );
  expect(bodies).toEqual(['123456', '123456', '123456', '123456']);
  await service.sendOtp('voter@example.com', '654321', context);
  expect(request).toHaveBeenCalledTimes(5);
  expect(request.mock.calls[4][0].headers.Authorization).toBe('Bearer token4');
});

it('keeps disabled accounts out even after the next Pacific day', async () => {
  const now = vi.spyOn(Date, 'now').mockReturnValue(1000000);
  const request = vi.fn().mockRejectedValue({
    response: {
      status: 403,
      data: { error: { errors: [{ reason: 'accessNotConfigured' }] } },
    },
  });
  mockGmailRequests(request);
  const service = new OtpEmailService(new ConfigService(gmailPool));
  await expect(
    service.sendOtp('voter@example.com', '123456', context),
  ).rejects.toThrow('Không thể gửi email');
  now.mockReturnValue(1060000);
  await expect(
    service.sendOtp('voter@example.com', '123456', context),
  ).rejects.toThrow('Không thể gửi email');
  expect(request).toHaveBeenCalledTimes(2);
  now.mockReturnValue(1000000 + 86400000);
  await expect(
    service.sendOtp('voter@example.com', '123456', context),
  ).rejects.toThrow('Không thể gửi email');
  expect(request).toHaveBeenCalledTimes(2);
});

it.each([
  { errors: [{ reason: 'dailyLimitExceeded' }] },
  { errors: [{ reason: 'quotaExceeded' }] },
  { message: 'Daily user sending quota exceeded' },
  { message: 'You have reached a sending limit' },
])(
  'uses the first account again at Pacific midnight after a daily quota error (%j)',
  async (error) => {
    // The spring DST transition makes the next midnight 07:00 UTC.
    const now = vi
      .spyOn(Date, 'now')
      .mockReturnValue(Date.parse('2026-03-08T08:30:00Z'));
    const request = vi
      .fn()
      .mockRejectedValueOnce({ response: { status: 403, data: { error } } })
      .mockResolvedValue({ status: 200, data: { id: 'accepted' } });
    mockGmailRequests(request);
    const service = new OtpEmailService(new ConfigService(gmailPool));
    await service.sendOtp('voter@example.com', '123456', context);
    now.mockReturnValue(Date.parse('2026-03-09T06:59:59Z'));
    await service.sendOtp('voter@example.com', '123456', context);
    now.mockReturnValue(Date.parse('2026-03-09T07:00:00Z'));
    await service.sendOtp('voter@example.com', '123456', context);
    expect(
      request.mock.calls.map(([options]) => options.headers.Authorization),
    ).toEqual([
      'Bearer primary-token',
      'Bearer backup-token',
      'Bearer backup-token',
      'Bearer primary-token',
    ]);
  },
);

it('counts successful sends per Pacific day and respects the soft limit under concurrency', async () => {
  const now = vi
    .spyOn(Date, 'now')
    .mockReturnValue(Date.parse('2026-11-03T07:59:59Z'));
  const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  const request = vi
    .fn()
    .mockResolvedValue({ status: 200, data: { id: 'message-id' } });
  mockGmailRequests(request);
  const service = new OtpEmailService(
    new ConfigService({
      ...gmailPool,
      GMAIL_ACCOUNTS: JSON.stringify(
        gmailAccounts.map(({ from, ...account }) => ({
          email: from,
          ...account,
        })),
      ),
      GMAIL_DAILY_SOFT_LIMIT: '1',
    }),
  );
  await Promise.all([
    service.sendOtp('voter@example.com', '123456', context),
    service.sendOtp('another@example.com', '654321', context),
  ]);
  await expect(
    service.sendOtp('voter@example.com', '123456', context),
  ).rejects.toMatchObject({ status: 503 });
  now.mockReturnValue(Date.parse('2026-11-03T08:00:00Z'));
  await service.sendOtp('voter@example.com', '123456', context);
  expect(
    request.mock.calls
      .map(([options]) => options.headers.Authorization)
      .sort((a: string, b: string) => a.localeCompare(b)),
  ).toEqual([
    'Bearer backup-token',
    'Bearer primary-token',
    'Bearer primary-token',
  ]);
  expect(log).toHaveBeenCalledWith(
    expect.stringContaining('sender=p***@gmail.com'),
  );
  expect(log).toHaveBeenCalledWith(
    expect.stringContaining('messageId=message-id'),
  );
});

it.each([{ response: { status: 503 } }, { code: 'ECONNRESET' }])(
  'retries transient errors twice, switches, and tries the primary again on the next send (%j)',
  async (error) => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValue({ status: 200, data: { id: 'accepted' } });
    mockGmailRequests(request);
    const service = new OtpEmailService(
      new ConfigService({ ...gmailPool, GMAIL_DAILY_SOFT_LIMIT: '1' }),
    );
    await service.sendOtp('voter@example.com', '123456', context);
    await service.sendOtp('voter@example.com', '654321', context);
    expect(
      request.mock.calls.map(([options]) => options.headers.Authorization),
    ).toEqual([
      'Bearer primary-token',
      'Bearer primary-token',
      'Bearer primary-token',
      'Bearer backup-token',
      'Bearer primary-token',
    ]);
  },
);

it('returns a sanitized 400 for a rejected recipient without rotating accounts', async () => {
  const request = vi.fn().mockRejectedValue({
    response: {
      status: 400,
      data: { error: { message: 'Invalid To header: voter@example.com' } },
    },
  });
  mockGmailRequests(request);
  const service = new OtpEmailService(new ConfigService(gmailPool));
  await expect(
    service.sendOtp('voter@example.com', '123456', context),
  ).rejects.toMatchObject({
    status: 400,
    message: 'Địa chỉ email người nhận không hợp lệ.',
  });
  expect(request).toHaveBeenCalledTimes(1);
});
