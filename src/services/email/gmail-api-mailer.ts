import { OAuth2Client } from 'google-auth-library';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';

export interface GmailApiSettings {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export type GmailDeliveryStage = 'oauth' | 'compose' | 'send' | 'acceptance';

/** Chỉ chứa metadata cho phép log; không giữ response, message hay cause gốc. */
export class GmailDeliveryError extends Error {
  constructor(
    readonly stage: GmailDeliveryStage,
    readonly reason: string,
    readonly status?: number,
  ) {
    super('Gmail delivery failed');
  }
}

/** Chỉ lỗi quota đã được Google từ chối rõ ràng mới cho phép gửi qua tài khoản khác. */
export class GmailQuotaError extends GmailDeliveryError {
  constructor(
    readonly retryAfterMs: number,
    reason = 'quota',
    status?: number,
  ) {
    super('send', reason, status);
  }
}

function deliveryError(
  stage: GmailDeliveryStage,
  error: unknown,
): GmailDeliveryError {
  const source = error as {
    code?: unknown;
    response?: { status?: unknown; data?: { error?: unknown } };
  } | null;
  const status = source?.response?.status;
  const apiError = source?.response?.data?.error;
  const reasons =
    typeof apiError === 'object' &&
    apiError !== null &&
    'errors' in apiError &&
    Array.isArray(apiError.errors)
      ? apiError.errors.map((item: unknown) =>
          item && typeof item === 'object' && 'reason' in item
            ? item.reason
            : undefined,
        )
      : [];
  const known = [
    'invalid_grant',
    'invalid_client',
    'unauthorized_client',
    'access_denied',
    'authError',
    'insufficientPermissions',
    'forbidden',
    'domainPolicy',
    'userRateLimitExceeded',
    'rateLimitExceeded',
    'dailyLimitExceeded',
    'quotaExceeded',
    'accessNotConfigured',
    'backendError',
    'ETIMEDOUT',
    'ECONNRESET',
    'ENOTFOUND',
    'EAI_AGAIN',
    'ECONNREFUSED',
  ];
  const reason =
    known.find(
      (value) =>
        value === apiError || value === source?.code || reasons.includes(value),
    ) ?? 'unknown';
  return new GmailDeliveryError(
    stage,
    reason,
    typeof status === 'number' &&
      Number.isInteger(status) &&
      status >= 100 &&
      status <= 599
      ? status
      : undefined,
  );
}

function quotaRetryAfter(error: unknown): number | undefined {
  const response = (
    error as {
      response?: {
        status?: number;
        data?: { error?: { errors?: { reason?: string }[] } };
        headers?: {
          get?: (name: string) => string | null;
          [key: string]: unknown;
        };
      };
    } | null
  )?.response;
  const reasons = response?.data?.error?.errors ?? [];
  if (
    response?.status !== 429 &&
    !(
      response?.status === 403 &&
      reasons.some(({ reason }) =>
        [
          'userRateLimitExceeded',
          'rateLimitExceeded',
          'dailyLimitExceeded',
        ].includes(reason ?? ''),
      )
    )
  )
    return undefined;
  const header =
    response?.headers?.get?.('retry-after') ??
    response?.headers?.['retry-after'];
  if (typeof header !== 'string' && typeof header !== 'number') return 60000;
  const seconds = Number(header);
  const delay = Number.isFinite(seconds)
    ? seconds * 1000
    : Date.parse(String(header)) - Date.now();
  return Number.isFinite(delay) && delay > 0 ? Math.max(1000, delay) : 60000;
}

/** Chỉ gửi qua HTTPS; không kết nối SMTP và không cần quyền đọc hộp thư. */
export class GmailApiMailer {
  private readonly oauth: OAuth2Client;

  constructor(settings: GmailApiSettings) {
    this.oauth = new OAuth2Client({
      clientId: settings.clientId,
      clientSecret: settings.clientSecret,
      transporterOptions: { timeout: 10000, retry: false },
    });
    // Thư viện Google cache access token, tự refresh và gộp refresh đồng thời.
    this.oauth.setCredentials({ refresh_token: settings.refreshToken });
  }

  async send(
    from: string,
    to: string,
    subject: string,
    text: string,
  ): Promise<void> {
    let token: string | null | undefined;
    try {
      ({ token } = await this.oauth.getAccessToken());
    } catch (error) {
      throw deliveryError('oauth', error);
    }
    if (!token) throw new GmailDeliveryError('oauth', 'missing_token');
    // MailComposer mã hóa MIME/UTF-8 và header; tuyệt đối không ghép header từ input.
    let message: Buffer;
    try {
      message = await new MailComposer({
        from: { name: 'Du lịch Nông thôn', address: from },
        to,
        subject,
        text,
        disableFileAccess: true,
        disableUrlAccess: true,
      })
        .compile()
        .build();
    } catch {
      throw new GmailDeliveryError('compose', 'mime_error');
    }
    // Không tự retry lệnh gửi: timeout có thể xảy ra sau khi Gmail đã nhận thư.
    let result: unknown;
    try {
      // Dùng cùng HTTP client Google đã kiểm tra gửi thật thành công.
      const response = await this.oauth.transporter.request({
        url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { raw: message.toString('base64url') },
        timeout: 15000,
        retry: false,
      });
      result = response.data;
    } catch (error) {
      const retryAfterMs = quotaRetryAfter(error);
      const failure = deliveryError('send', error);
      if (retryAfterMs !== undefined)
        throw new GmailQuotaError(retryAfterMs, failure.reason, failure.status);
      // 401: lần gửi sau phải lấy token mới; không gửi lại thư trong request hiện tại.
      if (
        (error as { response?: { status?: number } }).response?.status === 401
      )
        this.oauth.credentials.access_token = undefined;
      throw failure;
    }
    if (
      !result ||
      typeof result !== 'object' ||
      !('id' in result) ||
      typeof result.id !== 'string' ||
      !result.id
    ) {
      throw new GmailDeliveryError('acceptance', 'missing_message_id');
    }
  }
}
