# Đăng nhập bằng email và OTP

Backend dùng NestJS + TypeORM + PostgreSQL. Controller ở `src/controllers`,
nghiệp vụ ở `src/services`, DTO và validation ở `src/services/dto/auth`.
`EmailSender` tách luồng xác thực khỏi dịch vụ gửi thư. Cấu hình triển khai chọn Gmail API qua HTTPS.
Không gửi SMS.

## Gmail API cho local và Render Free

Production dùng **Gmail API qua HTTPS**, tài khoản gửi `mediaqtm@gmail.com`.
`render.yaml` chọn `EMAIL_PROVIDER=gmail_api`, gói Web Service `free`.
Không dùng App Password hoặc cổng SMTP; không cần domain gửi riêng.
Thay đổi repo chưa triển khai hoặc thay đổi gói thực tế trong Render Dashboard.

### 1. Tạo project và bật API

Mở [Google Cloud Console](https://console.cloud.google.com/), đăng nhập tài khoản
quản lý project và tạo project `Du lich Nong thon`. Trong **APIs & Services →
Library**, tìm **Gmail API** rồi chọn **Enable**.

Trong **Google Auth Platform**, cấu hình Branding (tên ứng dụng, email hỗ trợ),
Audience **External**, và thêm `mediaqtm@gmail.com` vào Test users khi còn Testing.
Trong **Data Access**, chỉ thêm scope gửi thư:

```text
https://www.googleapis.com/auth/gmail.send
```

Đây là quyền của tài khoản gửi, không phải quyền cần yêu cầu từng người bình chọn.
Không cần quyền đọc, sửa hoặc xóa email. Người dùng website vẫn chỉ nhập email và OTP.

### 2. Tạo OAuth client

Trong **Google Auth Platform → Clients → Create client**, chọn **Web application**,
đặt tên `Backend OTP`. Thêm Authorized redirect URI chính xác:

```text
https://developers.google.com/oauthplayground
```

Lưu Client ID và Client Secret vào `.env` local, không đưa vào code frontend.

### 3. Cấp quyền tài khoản gửi và lấy Refresh Token

Mở [OAuth Playground](https://developers.google.com/oauthplayground/):

1. Nhấn bánh răng, bật **Use your own OAuth credentials**, điền Client ID/Secret
   của bước 2. Giữ OAuth endpoints là Google, Access type **Offline**, Force prompt
   **Consent Screen**.
2. Nhập scope `https://www.googleapis.com/auth/gmail.send`, nhấn **Authorize APIs**.
3. Đăng nhập và cấp quyền bằng đúng tài khoản `mediaqtm@gmail.com`.
4. Chọn **Exchange authorization code for tokens**, copy **Refresh token** vào
   `GMAIL_REFRESH_TOKEN`. Không dùng Access token ngắn hạn cho biến này.

Dùng OAuth client của chính bạn để tránh token mặc định Playground bị thu hồi
sau 24 giờ. [Hướng dẫn Playground](https://developers.google.com/oauthplayground/).

**Trước khi vận hành lâu dài:** chuyển Audience từ Testing sang **In production**
rồi cấp quyền lại để lấy Refresh Token mới. Google cấp token hết hạn sau **7 ngày**
cho ứng dụng External còn Testing có scope Gmail.
[Quy tắc token Google](https://developers.google.com/identity/protocols/oauth2#expiration).
Publishing không tự hoàn tất OAuth verification; nếu Google yêu cầu xác minh quyền
nhạy cảm, làm theo yêu cầu trong Console. Token vẫn có thể bị thu hồi khi chủ tài khoản
rút quyền, đổi mật khẩu hoặc theo chính sách Google; khi đó phải cấp quyền lại.

### 4. Điền cấu hình và triển khai

```dotenv
EMAIL_PROVIDER=gmail_api
MAIL_FROM=mediaqtm@gmail.com
GMAIL_CLIENT_ID=<Client ID>
GMAIL_CLIENT_SECRET=<Client Secret>
GMAIL_REFRESH_TOKEN=<Refresh Token của mediaqtm@gmail.com>
```

Điền trong `.env` để chạy local và trong **Render → Web Service → Environment**
cho production. `MAIL_FROM` dùng đúng tài khoản đã cấp quyền, không dùng email người nhận.
Service đã tồn tại cần cập nhật các biến thủ công; `sync: false` không tự đọc `.env` local.
Giữ/chọn gói **Free** rồi redeploy; khởi động lại backend local sau khi thay `.env`.
Các biến `SMTP_*` và `RESEND_API_KEY` không được dùng khi provider là `gmail_api`.

Thiếu một trong ba biến OAuth trả 503 trước khi tạo challenge; không tự chuyển sang
SMTP hoặc Resend. OAuth client tự cache/refresh Access Token. Không tự retry gửi
thư khi Gmail lỗi/timeout để tránh gửi trùng. Lỗi gửi vô hiệu challenge và trả lỗi
chung, không lộ OTP, token hoặc phản hồi Google. Không gửi thư khi khởi động.

### 5. Kiểm tra thực tế

Gọi `POST /auth/otp/send` với `{"email":"email-nhan@example.com"}`, kiểm tra Inbox/Spam
rồi gọi `/auth/otp/verify` với email và mã nhận được. Chỉ gọi bước này với địa chỉ
người nhận được phép thử. HTTP 202 nghĩa là Gmail đã nhận lệnh, không bảo đảm thư
đã xuất hiện trong Inbox. Chưa có OAuth thì chưa kiểm tra gửi thư thật được.

Gmail API dùng tiêu chuẩn không tính thêm phí, vẫn chịu quota và giới hạn gửi của
Gmail; không dùng làm dịch vụ gửi số lượng lớn không giới hạn.
[Xem quota API](https://developers.google.com/workspace/gmail/api/reference/quota).

## Cấu hình xác thực và migration

```dotenv
AUTH_JWT_SECRET=<secret riêng, tối thiểu 32 ký tự>
AUTH_OTP_SECRET=<secret khác, tối thiểu 32 ký tự>
OTP_EXPIRES_SECONDS=300
OTP_MAX_ATTEMPTS=3
OTP_SEND_COOLDOWN_SECONDS=60
OTP_MAX_SENDS_PER_HOUR=4
```

Sinh secret bằng `openssl rand -hex 32`. Giữ secret trong `.env` hoặc Environment.

Nếu service Render cũ còn `OTP_MAX_SENDS_PER_HOUR=5`, đổi thành `4` trong
Environment trước khi redeploy. Cấu hình chỉ cho phép tối đa 4 lần gửi/email trong
cửa sổ một giờ (1 lần đầu + 3 lần gửi lại); mỗi mã tối đa 3 lần nhập sai.

```bash
npm run build
npm run db:migrate
npm run dev
```

Migration `1793757600000-auth-email` thêm email và index unique, cho phép phone
rỗng. Giữ nguyên UUID, số điện thoại cũ, session, phiếu bình chọn và dữ liệu điểm
đến. Không tự gán email cho tài khoản phone cũ vì chưa xác minh quyền sở hữu.
Tài khoản cũ có thể tiếp tục dùng session còn hạn nhưng cần quy trình liên kết
được xác minh riêng nếu muốn giữ cùng danh tính khi chuyển sang email.
Các OTP phone cũ không dùng được qua API email mới. Migration không rollback
xóa email tự động vì có thể làm mất danh tính tài khoản.

## API cho frontend

Đây là thay đổi request: dùng `email` thay cho `phone`. Email được trim và chuyển
lowercase trước khi tìm tài khoản, tạo hash hoặc kiểm tra giới hạn. Không tự xóa
dấu chấm hay phần `+alias` của email. OTP phải là chuỗi 6 chữ số, giữ số 0 đầu.

| Method | Endpoint           | Request                                            | Kết quả                             |
| ------ | ------------------ | -------------------------------------------------- | ----------------------------------- |
| POST   | `/auth/otp/send`   | `{ "email": "user@example.com" }`                  | 202: message, expiresIn, retryAfter |
| POST   | `/auth/otp/verify` | `{ "email": "user@example.com", "otp": "012345" }` | 200: token pair và user             |
| POST   | `/auth/refresh`    | `{ "refreshToken": "..." }`                        | 200: token pair mới và user         |
| POST   | `/auth/logout`     | `{ "refreshToken": "..." }`                        | 204                                 |
| GET    | `/auth/me`         | `Authorization: Bearer <accessToken>`              | 200: id, email, createdAt           |

Đăng nhập/refresh trả `accessToken`, `refreshToken`, `tokenType: Bearer`,
`expiresIn: 900`, `refreshExpiresIn` và `user: {id, email, createdAt}`.
Email nullable chỉ dành cho tài khoản phone cũ; tài khoản đăng nhập email có email
đã xác minh. Không trả phone, hash hoặc field nội bộ. Field ngoài DTO bị từ chối 400.
Response auth dùng `Cache-Control: no-store`.

## Quy tắc xử lý

- OTP sinh bằng `crypto.randomInt`, lưu HMAC-SHA256 với secret riêng, gắn với
  challenge ID và email. Không lưu, trả hoặc log OTP plaintext trong mọi môi trường.
- Mã hết hạn sau 5 phút, khóa sau 3 lần sai. Số lần sai được commit trước lỗi 401.
  Gửi lại vô hiệu mã cũ; một mã chỉ được xác thực thành công một lần.
- Advisory lock PostgreSQL theo email bảo vệ send/verify giữa các instance,
  kể cả trước khi user tồn tại. Chỉ tạo user sau khi xác thực thành công.
- Tối thiểu 60 giây giữa các lần gửi, tối đa 4 challenge/email/giờ (1 lần đầu + 3 lần gửi lại). Gửi lỗi vẫn
  tính vào giới hạn. Trả 429 khi vượt giới hạn.
- Giới hạn IP: send 5/phút, verify 15/phút, các route auth khác 60/phút; bộ đếm IP
  nằm trong bộ nhớ mỗi instance. Render đặt `TRUST_PROXY_HOPS=1`, local trực tiếp `0`.
- Access token HS256 sống 15 phút, kiểm tra issuer/audience, session và blocked user.
  Logout khiến access token bị từ chối ở lần kiểm tra sau.
- Refresh token opaque có secret 256 bit, chỉ lưu SHA-256, session hết hạn tuyệt đối
  sau 30 ngày. Rotation khóa session, chỉ một refresh đồng thời thành công.
  Frontend thay cả cặp token và chỉ refresh một lần tại một thời điểm cho mỗi phiên.
  Chưa có cơ chế token family thu hồi hậu duệ khi replay; hash sai không xóa session.
- Logout idempotent; chỉ refresh token hiện tại đúng hash mới thu hồi session.

## Kiểm thử

```bash
npm test
npm run test:e2e
npm run test:db
```

Kiểm tra validation, email normalization, cooldown, OTP hash/sai/hết hạn/dùng lại,
request đồng thời, token rotation/logout, gửi thư lỗi và thiếu cấu hình.
Database test dùng schema tạm riêng, bao gồm nâng cấp từ schema phone có dữ liệu
để kiểm tra bảo toàn user, OTP, session và phiếu bình chọn. Không ghi dữ liệu test
vào bảng public, không gửi email thật. Việc gửi và nhận thư thực tế cần credential
OAuth Gmail API và một lần thử gửi nhận thực tế.
