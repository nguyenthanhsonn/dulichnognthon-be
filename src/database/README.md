# PostgreSQL và TypeORM

Ứng dụng dùng `@nestjs/typeorm`, `DataSource` và repository chuẩn TypeORM.
`entities/voting.entities.ts` ánh xạ 7 bảng, cột snake_case, index, khóa ngoại và
CHECK constraint. Comment tiếng Việt nằm trong entity và SQL migration, xem được
trực tiếp trong DBeaver.

| Entity           | Bảng              | Mục đích                                          |
| ---------------- | ----------------- | ------------------------------------------------- |
| User             | users             | Email duy nhất và trạng thái bị chặn              |
| OtpCode          | otp_codes         | Hash OTP, thời hạn, số lần thử, thời điểm sử dụng |
| AuthSession      | auth_sessions     | Hash refresh token và thu hồi phiên               |
| Destination      | destinations      | Nội dung điểm đến, slug, trạng thái hiển thị      |
| DestinationMedia | destination_media | Hình ảnh/video và thứ tự hiển thị                 |
| Vote             | votes             | Bình chọn bất biến, duy nhất theo user/điểm đến   |
| VoteAttempt      | vote_attempts     | Audit thành công/từ chối, hash IP/device          |

## Sử dụng

```bash
npm run build
npm run db:migrate
npm run db:migration:show
npm run dev
```

Nest và CLI cùng đọc `DATABASE_URL` từ `.env`. `synchronize` và `migrationsRun`
đều tắt; migration được chạy tường minh bằng `db:migrate` trước khi start trên
Render. Nest quản lý vòng đời pool, kết nối PostgreSQL trước khi mở cổng HTTP.

Inject `DataSource` hoặc dùng `@InjectRepository(User)` trong module đã import
`TypeOrmModule.forFeature([User])`. Không cần sinh client trước khi build/test.

## Migration và dữ liệu có sẵn

Migration `InitVoting1793715300000` tạo 7 bảng trên database mới. Với database
Render đã khởi tạo ở bước trước, migration xác nhận đủ 7 bảng và checksum lịch sử
khởi tạo đã hoàn tất, sau đó chỉ ghi nhận trong `typeorm_migrations`. Không xóa
bảng, không reset database. Bảng lịch sử cũ được giữ để đối chiếu, không dùng làm
ORM runtime. Schema có bảng trùng tên nhưng không đúng lịch sử sẽ báo lỗi để kiểm
tra thay vì tự sửa.

Để thêm migration, thay entity rồi chạy trên database phát triển riêng:

```bash
npm run build
npm run db:migration:generate -- src/database/migrations/ChangeName
```

Review SQL, import class migration mới vào danh sách `migrations` trong
`database.config.ts`, rồi build và chạy `db:migrate`. Migration khởi tạo không hỗ
trợ rollback tự động vì thao tác đó sẽ xóa toàn bộ dữ liệu nghiệp vụ.

## Bình chọn và các ràng buộc

Luôn gọi `VotesRepository.castVote(userId, destinationId, context)` để ghi vote.
Không có hạn mức tổng theo tài khoản. Transaction READ COMMITTED khóa dòng user
(`pessimistic_write`/FOR UPDATE) để chống gửi trùng đồng thời. Điểm đến dùng khóa chia
sẻ (`pessimistic_read`/FOR SHARE). Đồng hồ DB được đọc sau khi đã nhận khóa.

Repository kiểm tra user bị chặn, trạng thái điểm đến, thời gian hội thi và trùng
vote. Kết quả là `{ accepted: true, vote }` hoặc `{ accepted: false, reason }`.
Audit từ chối được commit; vote và audit thành công được lưu cùng transaction.
Lệnh INSERT trực tiếp bỏ qua xác thực, kiểm tra trạng thái và thời gian ở
repository, nhưng vẫn chịu UNIQUE cho mỗi user/điểm đến. `userId` phải lấy từ phiên đăng nhập đã xác thực, UUID cần được validate
ở lớp API, và context chỉ nhận hash do backend tính.

Database chặn trùng `(user_id, destination_id)` và UPDATE/DELETE vote bằng trigger.
Khóa ngoại vote dùng RESTRICT, OTP/session/media dùng CASCADE, audit dùng SET NULL.
CHECK giới hạn media IMAGE/VIDEO, audit SUCCESS/REJECTED, số lần thử OTP không âm.
Trigger cập nhật `updated_at` kể cả khi sửa dữ liệu bằng SQL trực tiếp.

## Cấu hình hội thi và kiểm thử

Lịch mở/đóng bình chọn do frontend quản lý; backend không kiểm tra thời gian.
Đã bỏ biến lịch và hạn mức tổng `MAX_VOTES_PER_USER`.
`OTP_EXPIRES_SECONDS=300`, `OTP_MAX_ATTEMPTS=3` là cấu hình cho
lớp xác thực OTP đã triển khai; xem [hướng dẫn Auth](../modules/AUTH.md) để biết API, rotation và rate limiting.

`npm run test:db` chạy migration TypeORM trong schema `test_<uuid>`, kiểm tra entity,
ràng buộc, audit và request đồng thời. Sau test chỉ xóa schema tạm của lần chạy đó,
không sửa dữ liệu bảng public. CI có PostgreSQL riêng và chạy cả migration, test
database và smoke test production.
