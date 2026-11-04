# Đăng nhập bằng số điện thoại và OTP

**Trạng thái bản deploy hiện tại:** SMS tạm thời chưa bật. `POST /auth/otp/send`
trả 503 trước khi tạo OTP trong database. Provider dùng `DisabledSmsService`;
không cần credential SMS để khởi động backend. JWT, refresh/logout và kiểm tra
session tiếp tục phục vụ các phiên đã tồn tại. Cấu hình SpeedSMS bên dưới là
hướng dẫn cho lần tích hợp sau; chỉ điền token không tự bật gửi tin.

Backend dùng NestJS + TypeORM + PostgreSQL. Model xác thực dùng lại các entity
`User`, `OtpCode`, `AuthSession` qua `auth.model.ts`. Controller nằm trong
`src/controllers`, nghiệp vụ trong `src/services`, DTO request/response và
validation trong `src/services/dto/auth`.

## Cấu hình và khởi động

```dotenv
AUTH_JWT_SECRET=<secret riêng, tối thiểu 32 ký tự>
AUTH_OTP_SECRET=<secret khác, tối thiểu 32 ký tự>
OTP_EXPIRES_SECONDS=300
OTP_MAX_ATTEMPTS=3
OTP_SEND_COOLDOWN_SECONDS=60
OTP_MAX_SENDS_PER_HOUR=5
SPEEDSMS_ACCESS_TOKEN=
SPEEDSMS_SMS_TYPE=4
SPEEDSMS_SENDER=Verify
SPEEDSMS_OTP_TEMPLATE="Ma OTP Du lich Nong thon cua ban la {otp}. Khong chia se ma nay."
```

Sinh từng secret bằng `openssl rand -hex 32`. Secret local đã được tạo trong
`.env`, không commit. Đăng ký tại [SpeedSMS](https://connect.speedsms.vn), vào
**Settings → Profile** lấy API Access Token rồi điền `SPEEDSMS_ACCESS_TOKEN`.
Mặc định type `4`, sender `Verify` cho OTP; type `3` dùng Brandname riêng đã đăng ký.
Nội dung template có thể thay theo mẫu được SpeedSMS duyệt, phải giữ `{otp}`.

Khi tích hợp lại, adapter dùng [API SpeedSMS chính thức](https://speedsms.vn/sms-api-service/):
HTTPS POST JSON, Basic Auth với Access Token, timeout 10 giây. Số `+84...` được
chuyển thành `84...` khi gửi sang provider. Chỉ chấp nhận phản hồi `status=success`,
`code=00`, có SMS được tiếp nhận và không có số lỗi. Thiếu cấu hình hoặc provider
báo lỗi trả 503, challenge bị vô hiệu theo luồng hiện có. Không tự retry gửi SMS.

Brandname Verify có sẵn theo [hướng dẫn OTP](https://speedsms.vn/sms-otp-service/);
SMS thật vẫn tính phí theo tài khoản/gói SpeedSMS, không phải dịch vụ gửi miễn phí.

```bash
npm run build
npm run db:migrate
npm run dev
```

Migration thêm `otp_codes.phone`, copy phone từ user cho bản ghi cũ và cho phép
`user_id` rỗng. Gửi OTP chưa tạo tài khoản; chỉ xác thực thành công mới tạo user.
Vẫn giữ 7 bảng nghiệp vụ.

## API

| Method | Endpoint           | Request                                      | Response                    |
| ------ | ------------------ | -------------------------------------------- | --------------------------- |
| POST   | `/auth/otp/send`   | `{ "phone": "0901234567" }`                  | 503: SMS tạm thời chưa bật  |
| POST   | `/auth/otp/verify` | `{ "phone": "0901234567", "otp": "123456" }` | 200: token pair và user     |
| POST   | `/auth/refresh`    | `{ "refreshToken": "..." }`                  | 200: token pair mới và user |
| POST   | `/auth/logout`     | `{ "refreshToken": "..." }`                  | 204, không body             |
| GET    | `/auth/me`         | Header `Authorization: Bearer <accessToken>` | 200: id, phone, createdAt   |

Số Việt Nam `0xxxxxxxxx` đổi thành `+84xxxxxxxxx`, số quốc tế dùng E.164. OTP phải
là chuỗi 6 chữ số. Field ngoài DTO bị từ chối với lỗi 400. Response auth dùng
`Cache-Control: no-store`.

Response đăng nhập/refresh gồm `accessToken`, `refreshToken`, `tokenType: Bearer`,
`expiresIn: 900`, `refreshExpiresIn` và `user: {id, phone, createdAt}`. Refresh token
là chuỗi opaque `<session UUID>.<random secret>`, không phải JWT. Frontend thay cả
cặp token sau mỗi lần refresh và chỉ gửi một refresh tại một thời điểm cho mỗi phiên.

## Quy tắc xử lý

- OTP dùng `crypto.randomInt`, lưu HMAC-SHA256 với secret riêng, bind theo challenge
  ID và phone. Không lưu, trả hoặc log OTP plaintext ở bất kỳ môi trường nào.
- Mã hết hạn sau 300 giây, khóa sau 3 lần sai. Số lần sai được commit trước lỗi 401.
  Gửi lại vô hiệu mã cũ. Lỗi SMS vô hiệu challenge vừa tạo.
- Advisory lock PostgreSQL theo phone bảo vệ send/verify giữa nhiều instance,
  kể cả trước khi user tồn tại. Cùng một OTP chỉ xác thực thành công một lần.
- Tối thiểu 60 giây giữa hai lần gửi và tối đa 5 challenge/phone/giờ. Gửi lỗi vẫn
  tính vào giới hạn để tránh retry vô hạn khi nhà cung cấp gặp sự cố.
- Thêm giới hạn IP: send 5/phút, verify 15/phút, route auth khác 60/phút. Bộ đếm IP
  nằm trong bộ nhớ từng instance; giới hạn phone dùng DB chung. Trên Render đặt
  `TRUST_PROXY_HOPS=1`; local trực tiếp dùng `0`.
- Access token HS256 có issuer/audience cố định, sống 15 phút. Guard kiểm tra cả
  session và user bị chặn. Logout làm access token bị từ chối ở lần kiểm tra sau.
- Refresh token có 256 bit ngẫu nhiên, chỉ lưu SHA-256, session hết hạn tuyệt đối
  sau 30 ngày. Rotation khóa session và thay hash, chỉ một refresh đồng thời thành
  công. Token cũ bị từ chối; chưa có cơ chế token family thu hồi hậu duệ khi replay.
  Hash sai không làm mất session để tránh kẻ biết session ID gây logout người khác.
- Logout idempotent, chỉ token hiện tại đúng hash mới thu hồi session. Không trả
  các hash hoặc field nội bộ trong response.

## Render và kiểm thử

Điền hai secret, `SPEEDSMS_ACCESS_TOKEN` và cấu hình sender trong Environment trên Render.
Service đã tồn tại cần thêm biến thủ công vì `sync: false` chỉ hỏi khi tạo Blueprint.
Render chạy migration trước khi start.

```bash
npm test
npm run test:e2e
npm run test:db
```

SMS được giả lập trong tất cả test, không gửi tin thật. Database test chạy trong
schema tạm riêng, kiểm tra OTP sai/hết hạn/dùng lại, request đồng thời, rate limit
phone, token hash, rotation, session hết hạn, blocked user và logout. Chưa xác nhận
gửi SMS thực tế khi chưa có Access Token SpeedSMS.
