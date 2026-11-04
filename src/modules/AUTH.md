# Đăng nhập bằng email và OTP

Backend dùng NestJS + TypeORM + PostgreSQL. Controller ở `src/controllers`,
nghiệp vụ ở `src/services`, DTO và validation ở `src/services/dto/auth`.
`EmailSender` tách luồng xác thực khỏi dịch vụ gửi thư; hỗ trợ Gmail SMTP và Resend HTTPS.
Không gửi SMS.

## Chọn dịch vụ gửi email

**Render Free: dùng Resend HTTPS.** Render Free chặn các cổng SMTP 25/465/587
([tài liệu Render](https://render.com/docs/free)). Tạo API key Resend, thêm domain
của bạn và xác thực DNS theo hướng dẫn trong dashboard. `MAIL_FROM` phải thuộc
[domain đã xác thực](https://resend.com/docs/dashboard/domains/introduction),
ví dụ `otp@your-domain.vn`; không dùng địa chỉ `@gmail.com` làm người gửi Resend.
Domain thử nghiệm của nhà cung cấp không dùng để đăng nhập cho mọi người dùng.

```dotenv
EMAIL_PROVIDER=resend
MAIL_FROM=otp@your-domain.vn
RESEND_API_KEY=<API key của bạn>
```

Thêm ba biến này trong Environment của Web Service Render rồi redeploy.
`render.yaml` đã khai báo provider và các biến cần điền; service đã tạo trước đó
cần cập nhật Environment thủ công. Không commit secret.

**Local hoặc hosting cho phép SMTP: Gmail SMTP.** Bật xác minh 2 bước cho Gmail,
tạo [App Password](https://support.google.com/accounts/answer/185833), rồi điền:

```dotenv
EMAIL_PROVIDER=smtp
MAIL_FROM=your-account@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-account@gmail.com
SMTP_PASS=<App Password, không phải mật khẩu Gmail>
```

`MAIL_FROM` dùng cùng địa chỉ Gmail hoặc alias được Gmail cho phép.
Cổng 465 dùng TLS ngay khi kết nối; cổng 587 dùng `SMTP_SECURE=false` và bắt buộc
STARTTLS. Không tắt kiểm tra chứng chỉ TLS. Thiếu cấu hình trả 503 trước khi tạo
challenge; lỗi nhà cung cấp trả 503 và vô hiệu challenge, không báo gửi thành công giả.
Khởi động ứng dụng không gửi email kiểm tra. Test luôn giả lập dịch vụ gửi thư.

## Cấu hình xác thực và migration

```dotenv
AUTH_JWT_SECRET=<secret riêng, tối thiểu 32 ký tự>
AUTH_OTP_SECRET=<secret khác, tối thiểu 32 ký tự>
OTP_EXPIRES_SECONDS=300
OTP_MAX_ATTEMPTS=3
OTP_SEND_COOLDOWN_SECONDS=60
OTP_MAX_SENDS_PER_HOUR=5
```

Sinh secret bằng `openssl rand -hex 32`. Giữ secret trong `.env` hoặc Environment.

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
- Tối thiểu 60 giây giữa các lần gửi, tối đa 5 challenge/email/giờ. Gửi lỗi vẫn
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
SMTP hoặc Resend cùng domain đã xác thực.
