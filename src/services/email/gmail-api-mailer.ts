import { OAuth2Client } from 'google-auth-library';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';

export interface GmailApiSettings {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
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
    const { token } = await this.oauth.getAccessToken();
    if (!token) throw new Error('Gmail access token unavailable');
    // MailComposer mã hóa MIME/UTF-8 và header; tuyệt đối không ghép header từ input.
    const message = await new MailComposer({
      from: { name: 'Du lịch Nông thôn', address: from },
      to,
      subject,
      text,
      disableFileAccess: true,
      disableUrlAccess: true,
    })
      .compile()
      .build();
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
      // 401: lần gửi sau phải lấy token mới; không gửi lại thư trong request hiện tại.
      if (
        (error as { response?: { status?: number } }).response?.status === 401
      )
        this.oauth.credentials.access_token = undefined;
      throw new Error('Gmail request rejected');
    }
    if (
      !result ||
      typeof result !== 'object' ||
      !('id' in result) ||
      typeof result.id !== 'string' ||
      !result.id
    ) {
      throw new Error('Gmail acceptance missing');
    }
  }
}
