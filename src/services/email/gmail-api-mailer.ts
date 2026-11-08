import { OAuth2Client } from 'google-auth-library';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';

export interface GmailApiSettings {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

const gmailMessagesUrl =
  'https://gmail.googleapis.com/gmail/v1/users/me/messages';
const quotaBounceSender = 'mailer-daemon@googlemail.com';
const quotaBouncePauseMs = 24 * 60 * 60 * 1000;
const quotaBounceText = [
  'bạn đã đạt đến giới hạn gửi thư. thư của bạn chưa được gửi.',
  'you have reached a limit for sending mail. your message was not sent.',
];

interface GmailQuotaNotice {
  internalDate?: string;
  snippet?: string;
  payload?: { headers?: { name: string; value: string }[] };
}

export type GmailDeliveryStage =
  'oauth' | 'compose' | 'send' | 'acceptance' | 'bounce';

type GmailFailure =
  'daily_quota' | 'rate_limit' | 'auth' | 'transient' | 'recipient' | 'unknown';

const oauthRejections = [
  'invalid_grant',
  'invalid_client',
  'unauthorized_client',
  'access_denied',
];
const sendAuthRejections = [
  'accessNotConfigured',
  'insufficientPermissions',
  'domainPolicy',
  'authError',
  'forbidden',
];
const rateLimits = ['userRateLimitExceeded', 'rateLimitExceeded'];
const dailyLimits = ['dailyLimitExceeded', 'quotaExceeded'];
const networkErrors = [
  'TimeoutError',
  'ETIMEDOUT',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ECONNREFUSED',
  'EPIPE',
  'ENETUNREACH',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET',
];

/** Chỉ chứa metadata cho phép log; không giữ response, message hay cause gốc. */
export class GmailDeliveryError extends Error {
  constructor(
    readonly stage: GmailDeliveryStage,
    readonly reason: string,
    readonly status?: number,
    readonly kind: GmailFailure = 'unknown',
    readonly retryAfterMs?: number,
  ) {
    super('Gmail delivery failed');
  }
}

function retryAfterMs(header: unknown): number | undefined {
  if (typeof header !== 'string' && typeof header !== 'number') return;
  const seconds = Number(header);
  const delay = Number.isFinite(seconds)
    ? seconds * 1000
    : Date.parse(String(header)) - Date.now();
  if (Number.isFinite(delay) && delay > 0) return Math.max(1000, delay);
}

function deliveryError(
  stage: GmailDeliveryStage,
  error: unknown,
): GmailDeliveryError {
  const source = error as {
    code?: unknown;
    cause?: { code?: unknown };
    response?: {
      status?: unknown;
      data?: { error?: unknown };
      headers?: {
        get?: (name: string) => string | null;
        'retry-after'?: unknown;
      };
    };
  } | null;
  const response = source?.response;
  const status =
    typeof response?.status === 'number' ? response.status : undefined;
  const apiError = response?.data?.error;
  const details =
    typeof apiError === 'object' && apiError !== null
      ? (apiError as { message?: unknown; errors?: unknown })
      : undefined;
  const items = Array.isArray(details?.errors)
    ? (details.errors as ({
        reason?: unknown;
        message?: unknown;
        location?: unknown;
      } | null)[])
    : [];
  const reasons = [
    apiError,
    source?.code,
    source?.cause?.code,
    ...items.map((item) => item?.reason),
  ];
  const messages = [
    details?.message,
    ...items.map((item) => item?.message),
  ].filter((message): message is string => typeof message === 'string');
  const dailyReason = dailyLimits.find((reason) => reasons.includes(reason));
  const rateReason = rateLimits.find((reason) => reasons.includes(reason));
  const oauthReason = oauthRejections.find((reason) =>
    reasons.includes(reason),
  );
  const sendAuthReason = sendAuthRejections.find((reason) =>
    reasons.includes(reason),
  );
  const networkReason = networkErrors.find((reason) =>
    reasons.includes(reason),
  );

  if (status === 401 || (stage === 'oauth' && oauthReason)) {
    return new GmailDeliveryError(
      stage,
      oauthReason ?? sendAuthReason ?? 'unauthorized',
      status,
      'auth',
    );
  }
  if (stage === 'send') {
    const dailyMessage = messages.some((message) =>
      /daily user sending quota exceeded|sending limit/i.test(message),
    );
    const daily =
      dailyMessage || ((status === 403 || status === 429) && dailyReason);
    if (daily || status === 429 || (status === 403 && rateReason)) {
      const retryAfter = retryAfterMs(
        response?.headers?.get?.('retry-after') ??
          response?.headers?.['retry-after'],
      );
      return new GmailDeliveryError(
        stage,
        daily
          ? (dailyReason ?? 'dailySendingLimit')
          : (rateReason ?? 'tooManyRequests'),
        status,
        daily ? 'daily_quota' : 'rate_limit',
        retryAfter,
      );
    }
    if (status === 403 && sendAuthReason)
      return new GmailDeliveryError(stage, sendAuthReason, status, 'auth');
    if (
      status === 400 &&
      (reasons.includes('invalidRecipient') ||
        items.some(
          (item) =>
            typeof item?.location === 'string' &&
            /^(to|recipient)$/i.test(item.location),
        ) ||
        messages.some((message) =>
          /invalid (?:to header|recipient|email address)|recipient address (?:is )?(?:required|invalid)|(?:recipient|to header).*(?:invalid|malformed)/i.test(
            message,
          ),
        ))
    ) {
      return new GmailDeliveryError(
        stage,
        'invalidRecipient',
        status,
        'recipient',
      );
    }
  }
  if (
    (status !== undefined && status >= 500 && status <= 599) ||
    (status === undefined && (stage === 'send' || networkReason))
  ) {
    return new GmailDeliveryError(
      stage,
      networkReason ?? (status === undefined ? 'networkError' : 'backendError'),
      status,
      'transient',
    );
  }
  return new GmailDeliveryError(
    stage,
    sendAuthReason ?? oauthReason ?? networkReason ?? 'unknown',
    status,
  );
}

/** Gửi qua HTTPS. Chỉ truy cập hộp thư khi được bật kiểm tra thông báo hạn mức. */
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

  async quotaBounceUntil(subject: string): Promise<number> {
    try {
      const { token } = await this.oauth.getAccessToken();
      if (!token) throw new GmailDeliveryError('bounce', 'missing_token');

      const headers = { Authorization: `Bearer ${token}` };
      const signal = AbortSignal.timeout(3500);
      const after = Math.floor((Date.now() - quotaBouncePauseMs) / 1000);
      const phrases = quotaBounceText.map((phrase) => `"${phrase}"`).join(' ');
      const { data } = await this.oauth.transporter.request<{
        messages?: { id: string }[];
      }>({
        url: gmailMessagesUrl,
        method: 'GET',
        headers,
        params: {
          q: `in:inbox from:${quotaBounceSender} subject:"${subject}" after:${after} {${phrases}}`,
          maxResults: 3,
          fields: 'messages(id)',
        },
        signal,
        retry: false,
      });
      const notices = await Promise.all(
        (data.messages ?? []).map(async ({ id }) => {
          const { data: notice } =
            await this.oauth.transporter.request<GmailQuotaNotice>({
              url: `${gmailMessagesUrl}/${encodeURIComponent(id)}`,
              method: 'GET',
              headers,
              params: {
                format: 'full',
                fields: 'internalDate,snippet,payload(headers)',
              },
              signal,
              retry: false,
            });
          return notice;
        }),
      );

      const now = Date.now();
      let until = 0;
      for (const notice of notices) {
        const from = notice.payload?.headers
          ?.find((header) => header.name.toLowerCase() === 'from')
          ?.value.trim()
          .toLowerCase();
        const address = from?.match(/^[^<>]*<([^<>]+)>$/)?.[1] ?? from;
        const text = notice.snippet
          ?.normalize('NFC')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();
        const receivedAt = Number(notice.internalDate);
        if (
          address === quotaBounceSender &&
          quotaBounceText.some((phrase) => text?.startsWith(phrase)) &&
          receivedAt <= now &&
          receivedAt + quotaBouncePauseMs > now
        ) {
          until = Math.max(until, receivedAt + quotaBouncePauseMs);
        }
      }
      return until;
    } catch (error) {
      if (error instanceof GmailDeliveryError) throw error;
      throw deliveryError('bounce', error);
    }
  }

  async send(
    from: string,
    to: string,
    subject: string,
    text: string,
  ): Promise<string> {
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
    let response;
    try {
      response = await this.oauth.transporter.request<{ id?: unknown }>({
        url: `${gmailMessagesUrl}/send`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: { raw: message.toString('base64url') },
        timeout: 15000,
        retry: false,
      });
    } catch (error) {
      throw deliveryError('send', error);
    }
    if (response.status !== 200)
      throw new GmailDeliveryError(
        'acceptance',
        'unexpected_status',
        response.status,
      );
    const id = response.data?.id;
    if (typeof id !== 'string' || !id.trim())
      throw new GmailDeliveryError(
        'acceptance',
        'missing_message_id',
        response.status,
      );
    return id;
  }
}
