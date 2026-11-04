import { readFileSync } from 'node:fs';

const logo = readFileSync(new URL('./assets/logo.png', import.meta.url));
const logoCid = 'logo@dulichnongthon';

/** Bảng và CSS inline để thư vẫn đọc tốt trên Gmail, Outlook và điện thoại. */
export function createOtpEmail(otp: string, expiresInSeconds: number) {
  if (
    !/^\d{6}$/.test(otp) ||
    !Number.isFinite(expiresInSeconds) ||
    expiresInSeconds <= 0
  ) {
    throw new Error('Invalid OTP email content');
  }
  const minutes = Math.ceil(expiresInSeconds / 60);
  return {
    subject: 'Mã xác thực đăng nhập | Du lịch Nông thôn',
    text: `DU LỊCH NÔNG THÔN\nBình chọn điểm đến du lịch nông thôn\n\nMã xác thực đăng nhập của bạn là ${otp}.\nMã có hiệu lực trong ${minutes} phút và chỉ sử dụng một lần.\n\nKhông chia sẻ mã này với bất kỳ ai. Nếu bạn không yêu cầu đăng nhập, hãy bỏ qua email này.\n\nMỗi bình chọn, một miền quê được lan tỏa.`,
    // Chỉ nội suy mã đã validate và số phút; không đưa input người nhận vào HTML.
    html: `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Xác thực đăng nhập · Du lịch Nông thôn</title>
  <style>
    body, table, td, p { margin: 0; padding: 0; }
    table { border-collapse: collapse; }
    img { border: 0; }
    @media only screen and (max-width: 620px) {
      .outer { padding: 20px 12px !important; }
      .section { padding-left: 24px !important; padding-right: 24px !important; }
      .brand-name { font-size: 20px !important; }
      .brand-logo { width: 64px !important; height: 64px !important; }
      .otp { font-size: 36px !important; letter-spacing: 7px !important; }
      .title { font-size: 28px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f3f6ef;font-family:Arial,Helvetica,sans-serif;color:#233f35;-webkit-text-size-adjust:100%;">
  <div style="display:none;font-size:1px;color:#f3f6ef;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">Hoàn tất đăng nhập và cùng lan tỏa vẻ đẹp du lịch nông thôn. Mã có hiệu lực trong ${minutes} phút.</div>
  <table role="presentation" width="100%" bgcolor="#f3f6ef"><tr><td class="outer" align="center" style="padding:40px 16px;">
    <!--[if mso]><table role="presentation" width="600"><tr><td><![endif]-->
    <table role="presentation" width="100%" style="max-width:600px;background-color:#ffffff;border:1px solid #dfe8dc;border-radius:20px;border-collapse:separate;overflow:hidden;">
      <tr><td style="padding:0;">
        <table role="presentation" width="100%"><tr>
          <td width="60%" height="6" bgcolor="#007b57" style="height:6px;font-size:0;line-height:0;">&nbsp;</td>
          <td width="25%" height="6" bgcolor="#80b72a" style="height:6px;font-size:0;line-height:0;">&nbsp;</td>
          <td width="15%" height="6" bgcolor="#ffb51b" style="height:6px;font-size:0;line-height:0;">&nbsp;</td>
        </tr></table>
      </td></tr>
      <tr><td class="section" style="padding:28px 36px;">
        <table role="presentation" width="100%"><tr>
          <td width="100" valign="middle" style="padding-right:16px;">
            <img class="brand-logo" src="cid:${logoCid}" alt="Logo Du lịch Nông thôn" width="84" height="84" style="display:block;width:84px;height:84px;">
          </td>
          <td valign="middle">
            <p style="font-size:10px;line-height:16px;letter-spacing:2px;font-weight:700;color:#6a7d6e;">BÌNH CHỌN ĐIỂM ĐẾN</p>
            <p class="brand-name" style="font-size:25px;line-height:34px;font-weight:700;color:#006849;">Du lịch Nông thôn</p>
            <p style="font-size:12px;line-height:20px;color:#758374;">Khám phá miền xanh · Lan tỏa bản sắc</p>
          </td>
        </tr></table>
      </td></tr>
      <tr><td class="section" bgcolor="#006849" style="padding:28px 36px 30px;">
        <p style="font-size:10px;line-height:18px;letter-spacing:2px;font-weight:700;color:#e2c979;">KẾT NỐI NHỮNG MIỀN QUÊ</p>
        <h1 class="title" style="margin:10px 0 10px;font-size:32px;line-height:1.2;letter-spacing:-0.6px;font-weight:700;color:#ffffff;">Một mã xác thực.<br>Mở hành trình xanh.</h1>
        <p style="font-size:14px;line-height:23px;color:#d1e9da;">Đăng nhập để khám phá và bình chọn cho<br>những điểm đến nông thôn bạn yêu thích.</p>
      </td></tr>
      <tr><td class="section" style="padding:32px 36px 28px;">
        <h2 style="margin:0 0 10px;font-size:20px;line-height:28px;font-weight:700;color:#183f31;">Xác thực đăng nhập của bạn</h2>
        <p style="font-size:14px;line-height:24px;color:#65756a;">Nhập mã dưới đây vào màn hình đăng nhập để tiếp tục.<br>Mã chỉ sử dụng một lần.</p>
        <table role="presentation" width="100%" style="margin-top:24px;border-collapse:separate;border:1px solid #d9e8d7;border-radius:12px;background-color:#f4f8ef;">
          <tr><td align="center" style="padding:22px 12px 12px;">
            <p style="font-size:10px;line-height:18px;letter-spacing:2px;font-weight:700;color:#687f5c;">MÃ XÁC THỰC CỦA BẠN</p>
            <p class="otp" dir="ltr" style="margin:10px 0 0;padding-left:9px;font-family:'Courier New',Courier,monospace;font-size:44px;line-height:56px;letter-spacing:9px;font-weight:700;color:#006849;white-space:nowrap;">${otp}</p>
          </td></tr>
          <tr><td align="center" style="padding:0 12px 22px;">
            <span style="display:inline-block;padding:6px 12px;border-radius:20px;background-color:#fff1ce;font-size:12px;line-height:18px;color:#825c12;">Có hiệu lực trong <strong>${minutes} phút</strong></span>
          </td></tr>
        </table>
        <p style="margin-top:22px;font-size:12px;line-height:21px;color:#68776d;"><strong style="color:#365143;">Giữ an toàn cho tài khoản</strong><br>Không chia sẻ mã xác thực với bất kỳ ai. Nếu bạn không yêu cầu đăng nhập, hãy bỏ qua email này.</p>
      </td></tr>
      <tr><td class="section" bgcolor="#f9faf5" style="padding:22px 36px;border-top:1px solid #e7eddf;">
        <p style="font-size:13px;line-height:22px;font-weight:700;color:#417144;">Mỗi bình chọn, một miền quê được lan tỏa.</p>
        <p style="margin-top:5px;font-size:11px;line-height:19px;color:#82907e;">Email được gửi tự động từ Du lịch Nông thôn.<br>Bạn không cần trả lời email này.</p>
      </td></tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]-->
    <p style="margin-top:20px;font-size:10px;line-height:18px;letter-spacing:1.5px;color:#82917d;">DU LỊCH NÔNG THÔN · VIỆT NAM</p>
  </td></tr></table>
</body></html>`,
    attachments: [
      {
        filename: 'du-lich-nong-thon.png',
        content: logo,
        contentType: 'image/png',
        contentDisposition: 'inline' as const,
        cid: logoCid,
      },
    ],
  };
}
