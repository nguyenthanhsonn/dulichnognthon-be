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

#### Nhiều tài khoản Gmail và chuyển khi hết quota

Đặt `EMAIL_PROVIDER=gmail_api` và thêm `GMAIL_ACCOUNTS` trong Render Environment
hoặc `.env`. Giá trị là mảng JSON, thứ tự tài khoản là thứ tự ưu tiên. Ví dụ `.env`:

```dotenv
GMAIL_ACCOUNTS='[{"from":"xelon1929@gmail.com","clientId":"CLIENT_ID_MOI","clientSecret":"SECRET_MOI","refreshToken":"TOKEN_XELON"},{"from":"backup@gmail.com","clientId":"CLIENT_ID_DU_PHONG","clientSecret":"SECRET_DU_PHONG","refreshToken":"TOKEN_DU_PHONG"}]'
```

Trong Render nhập JSON trực tiếp, không bọc thêm dấu nháy đơn. Thay các giá trị
mẫu bằng thông tin thật, lưu và redeploy. `from` phải khớp tài khoản đã cấp token.
Nếu `mediaqtm@gmail.com` đang hết quota, đặt `xelon1929@gmail.com` đầu danh sách;
chỉ thêm mediaqtm sau khi đã thay credential bị lộ. Không commit bí mật vào repo.

Khi `GMAIL_ACCOUNTS` có giá trị, backend bỏ qua `MAIL_FROM` và ba biến `GMAIL_*`
đơn. JSON sai hoặc email trùng sẽ trả 503 trước khi tạo challenge; không âm thầm
dùng cấu hình cũ. Nếu biến trống/không có, cấu hình Gmail đơn vẫn hoạt động.

Backend chuyển sang tài khoản kế tiếp ngay trong lần gửi OTP khi Gmail trả 429
hoặc 403 có reason `userRateLimitExceeded`, `rateLimitExceeded`, `dailyLimitExceeded`.
Tài khoản bị chặn được nghỉ theo header `Retry-After`, mặc định 60 giây nếu không
có header hợp lệ. Các lần gửi tiếp theo tiếp tục dùng tài khoản đã gửi thành công;
khi tài khoản đó hết quota, backend tìm vòng qua danh sách, kể cả tài khoản cũ đã
hết thời gian nghỉ. Mỗi tài khoản được thử tối đa một lần trong một request.
Nếu tất cả đang bị chặn, trả 503 chung và không gửi thêm request tới Google.

Các lỗi tài khoản bị từ chối rõ ràng cũng cho phép chuyển tiếp: OAuth 400/401/403
với `invalid_grant`, `invalid_client`, `unauthorized_client`, `access_denied`;
gửi mail trả 401; hoặc 403 với `accessNotConfigured`, `insufficientPermissions`,
`domainPolicy`, `authError`, `forbidden`. Tài khoản đó nghỉ 5 phút, ghi log lỗi,
rồi có thể được thử lại khi xoay vòng. Nhờ đó một project chưa bật API không
chặn toàn bộ các tài khoản phía sau. Vẫn cần sửa cấu hình/token của tài khoản lỗi.

Không chuyển tài khoản khi timeout, lỗi mạng, 5xx, phản hồi thiếu message ID hay
lỗi không nhận diện được để tránh gửi trùng. Trạng thái nghỉ
nằm trong bộ nhớ mỗi instance, mất khi restart; không đồng bộ giữa các instance.
Hạn mức theo Gmail được dùng chung giữa mọi client/API/SMTP của cùng tài khoản;
quota cấp project vẫn có thể ảnh hưởng nhiều tài khoản cùng project. Gmail nhận
request không bảo đảm thư đã tới Inbox.
[Quy tắc lỗi và hạn mức Gmail](https://developers.google.com/workspace/gmail/api/guides/handle-errors).

Với cấu hình Gmail đơn, thiếu một trong ba biến OAuth trả 503 trước khi tạo
challenge; không tự chuyển sang SMTP hoặc Resend. OAuth client tự cache/refresh
Access Token. Chỉ chuyển tài khoản theo lỗi quota/tài khoản như mô tả ở trên, không retry
thư khi timeout để tránh gửi trùng. Lỗi gửi vô hiệu challenge và trả lỗi
chung, không lộ OTP, token hoặc phản hồi Google. Không gửi thư khi khởi động.

#### Chuyển khi Gmail báo hết lượt bằng thư trả lại

Thêm `"checkQuotaBounces": true` vào mục Gmail cần theo dõi trong `GMAIL_ACCOUNTS`.
Với tài khoản đó, cấp lại OAuth bằng cả hai scope sau và thay `refreshToken`
trong cùng mục. Giữ địa chỉ gửi và các tài khoản khác trong danh sách.

```text
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.readonly
```

`gmail.readonly` là scope hạn chế. Bật từng tài khoản sau khi đã cấp quyền đọc
và kiểm tra yêu cầu xác minh OAuth của Google.
[Quyền Gmail API](https://developers.google.com/workspace/gmail/api/auth/scopes).

Trước khi gửi OTP từ một tài khoản đã bật, backend kiểm tra tối đa một lần mỗi
phút trên mỗi instance. Backend chỉ tìm trong Inbox các thư có tiêu đề OTP từ
`mailer-daemon@googlemail.com` và nội dung báo đạt giới hạn gửi bằng tiếng Việt
hoặc tiếng Anh. Khi khớp, tài khoản nghỉ tối đa 24 giờ tính từ lúc Gmail nhận
thư trả lại, rồi vòng gửi thử tài khoản kế tiếp ngay trong request hiện tại.
Sau khi restart, lần kiểm tra tiếp theo đọc lại các thông báo còn trong khoảng
24 giờ. Yêu cầu OTP mới hoặc gửi lại qua giao diện kích hoạt bước kiểm tra này.

Render Logs ghi `Gmail quota bounce detected` kèm `account`, `challengeId` và
`pausedUntil`. `Gmail OTP accepted after switch` cho biết Gmail dự phòng đã
chấp nhận lệnh gửi. Nếu đọc Inbox lỗi hoặc token thiếu quyền, log
`Gmail quota check failed` và tiếp tục dùng cơ chế xử lý phản hồi gửi Gmail API.
Tài khoản chỉ có scope `gmail.send` tiếp tục hoạt động khi bỏ qua tùy chọn này.

### 5. Kiểm tra thực tế

Nếu gửi thất bại, tìm `Gmail delivery failed` trong Render Logs. Log chỉ chứa
`account` (vị trí 1-based trong danh sách), `challengeId`, `stage`, `status`,
`reason` thuộc danh sách cho phép; không chứa địa chỉ nhận, OTP, token, secret
hoặc phản hồi Google gốc. `stage=oauth reason=invalid_grant` cần cấp quyền lại
refresh token; `stage=send status=403 reason=insufficientPermissions` cần kiểm
tra scope `gmail.send`; `status=429` là hạn mức Gmail; `reason=ETIMEDOUT` là
timeout. Lỗi không nhận diện được ghi `reason=unknown`, không phỏng đoán quota.
API gửi/gửi lại OTP trả 503 với thông báo tiếng Việt cố định, vẫn ẩn chi tiết gốc.

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
OTP_MAX_SENDS_PER_HOUR=10
```

Sinh secret bằng `openssl rand -hex 32`. Giữ secret trong `.env` hoặc Environment.

Trên Render, đổi `OTP_MAX_SENDS_PER_HOUR` cũ (4/5) thành `10` rồi redeploy.
Đây là hạn mức chống spam cho email qua mọi phiên, không phải số resend trong một
phiên. Mỗi phiên OTP có một SEND và tối đa ba RESEND, khóa mã sau ba lần nhập sai.

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
| POST   | `/auth/otp/resend` | `{ "email": "user@example.com" }`                  | 202: message, expiresIn, retryAfter |
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
- Trong phiên đang chờ, mỗi lần resend cách ít nhất 60 giây và tối đa 3 lần/phiên.
  Quota chống spam độc lập mặc định 10 challenge/email/giờ, tính cả các phiên đã
  hoàn tất. Gửi lỗi vẫn tính quota. Trả 429 khi vượt giới hạn.
- Giới hạn IP: send + resend dùng chung 60/phút, verify 120/phút, các route auth khác 60/phút; bộ đếm IP
  nằm trong bộ nhớ mỗi instance. Render đặt `TRUST_PROXY_HOPS=1`, local trực tiếp `0`.
  Ngưỡng IP cho phép nhiều người chung Wi-Fi/NAT; cooldown và quota email trong
  DB vẫn áp dụng độc lập. Lỗi IP trả thông báo tiếng Việt cùng header `Retry-After`
  (số giây cần chờ), không trả chuỗi `ThrottlerException` ra giao diện.
  Khi có thêm proxy phía trước Render, cần kiểm tra đường đi thực tế của request
  trước khi đổi `TRUST_PROXY_HOPS`; không tin toàn bộ header IP do client gửi.
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

## Phiên xác thực OTP và phiên đăng nhập

- `POST /auth/otp/send` tạo phiên OTP tối đa 30 phút, gửi đầu một lần.
- `POST /auth/otp/resend` dùng phiên đang chờ, gửi lại tối đa ba lần, chờ 60 giây
  giữa các lần gửi. Mỗi mã tối đa 5 phút, không vượt thời điểm hết hạn phiên.
- `send` khi còn phiên chưa kết thúc trả 409, frontend mở màn hình nhập mã/gửi lại.
  Mã đã dùng hết lượt nhập sai vẫn có thể resend nếu còn lượt. Không gọi send để reset.
- Verify thành công đánh dấu `verified_at` cho cả nhóm `flow_id`, kết thúc phiên OTP;
  lần đăng nhập mới được SEND ngay, kể cả vừa logout. RESEND sau verify trả 400.
- Phiên bỏ dở hết hạn sau 30 phút; có thể bắt đầu phiên mới sau cooldown nếu lần gửi
  cuối vừa xảy ra. Resend không kéo dài mốc 30 phút.
- Chống spam riêng: `OTP_MAX_SENDS_PER_HOUR=10`, tính mọi SEND/RESEND theo email
  trong cửa sổ trượt 1 giờ; verify/logout không xóa bộ đếm. IP vẫn dùng chung 5/phút.
- Request send/resend vẫn chỉ cần email. Response thêm `remainingResends` (3 sau
  SEND, giảm 2/1/0 sau RESEND) và `flowExpiresIn`; các field cũ được giữ.
- Session đăng nhập khác phiên OTP: Access Token 15 phút, Refresh Token tối đa 30 ngày.
  Frontend phải giữ/refresh token khi mở lại trang; đóng tab không phải logout.

Migration `OtpFlows1793839000000` thêm `flow_id`, `flow_expires_at`, `verified_at`
vào `otp_codes`, cùng index/check. Các challenge cũ giữ metadata NULL; mã cũ còn
hạn vẫn xác thực được, không xóa account/session/vote. Muốn resend dữ liệu cũ cần
bắt đầu phiên mới. Chạy build và migration trước khi khởi động bản mới.
