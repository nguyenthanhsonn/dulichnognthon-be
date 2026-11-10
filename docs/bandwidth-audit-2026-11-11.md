# Phân tích băng thông Render — 11/11/2026

## Backup hoàn tất trước khi kiểm tra

- Vị trí cục bộ: `/Users/nguyenson/dulich-be/.backups/2026-11-10T18-32-50-295Z`.
- Archive: 2.956.817 byte, toàn bộ 9 bảng, cùng snapshot chỉ đọc.
- Snapshot có 6.478 votes, 5.089 users, 35 destinations, 70 destination_media, 12.064 otp_codes, 5.371 auth_sessions, 6.480 vote_attempts và 2 bảng migration.
- Đã kiểm tra SHA-256, `pg_restore --list`, restore thật vào PostgreSQL 18 tạm; số dòng 9 bảng khớp, 0 constraint chưa xác thực.
- Bản sao lưu không có ownership/ACL của Render để dễ restore sang database đích. Không thay đổi schema hay dữ liệu production.

## Bằng chứng thực tế

Render Metrics của backend `srv-dblb15jm8hqs738oo3h0` hiển thị 9,71 GB tháng này:

| Loại lưu lượng | Dung lượng hiển thị |
| --- | ---: |
| HTTP Responses | 8,74 GB (khoảng 90%) |
| Service-Initiated | 994 MB |
| WebSocket Responses | 0 MB |

Số đo lấy từ UI Render, có làm tròn. Đây là dung lượng truyền, không phải kích thước database (~24 MB). SSE dùng HTTP nên được tính trong HTTP Responses, không phải WebSocket Responses. HTTP Responses là phần lớn chi phí; chưa có bằng chứng 994 MB còn lại chủ yếu là OTP.

## Điểm gây khuếch đại đã xác minh

### 1. SSE phát lại đầy đủ 35 điểm đến cho từng kết nối

`src/services/ranking.service.ts` dòng 57–78 dùng chung việc query nhưng broadcast một RankingResponseDto đầy đủ đến từng subscriber. `invalidate()` chạy sau vote commit; dữ liệu thay đổi làm mỗi viewer nhận snapshot mới. Query có title, shortTitle, brief, slug, province, thumbnailUrl cùng voteCount/rank.

Đo endpoint production:

| Endpoint | Byte payload trên đường truyền trong phép đo |
| --- | ---: |
| `/rankings`, identity | 29.161 |
| `/rankings`, gzip | 8.643 |
| `/backend-api/rankings` trên frontend, gzip | 8.643 |
| `/rankings/top`, gzip | 1.203 |
| `/destinations?limit=8`, gzip | 2.529 |
| `/rankings/stream`, snapshot đầu, identity | 29.204 |
| `/rankings/stream`, snapshot đầu, yêu cầu gzip | 29.204, không có Content-Encoding |

REST đã được nén bởi hạ tầng: không đúng nếu kết luận toàn bộ backend thiếu gzip. Riêng SSE đo được không nén và gửi lại cả metadata tĩnh.

Snapshot chỉ có totals + id/voteCount/rank của 35 bài là 2.542 byte trong phép tính, nhỏ hơn khoảng 91% so với JSON đầy đủ. Muốn áp dụng phải chỉnh frontend để ghép metadata và cập nhật số phiếu.

Ví dụ minh họa, KHÔNG phải phép thống kê lịch sử: 6.478 snapshot thay đổi × 50 viewer × 29.204 byte ≈ 9,46 GB payload. Nhiều kết nối có thể khiến vài nghìn phiếu tạo ra nhiều GB dữ liệu.

### 2. Frontend tải toàn bộ `/rankings` mỗi 8 giây khi SSE chưa nhận snapshot hợp lệ hoặc bị lỗi

Đọc bundle đang triển khai `/_next/static/chunks/179-cb77f4bb6d6f0df1.js`, module 2254 và 4516:

- `EventSource` nối trực tiếp `https://dulichnognthon-be.onrender.com/rankings/stream`.
- Fallback `setTimeout(..., 8e3)` gọi `/rankings` qua `/backend-api`.
- REST gửi `Cache-Control: no-store`; backend cũng trả `no-store`.
- Khi nhận sự kiện `rankings` hợp lệ, fallback bị hủy; vì vậy không phải mọi người đều polling liên tục.
- Kết nối stream/fallback đặt trong AuthProvider toàn cục và không kiểm tra visibility để ngắt khi tab ẩn; listener visibility ở phần khác chỉ refresh account.

450 lần tải/giờ/viewer khi fallback chạy liên tục. Với kích thước hiện tại, khoảng 3,89 MB gzip hoặc 13,12 MB identity mỗi giờ mỗi viewer, chưa tính header. 100 viewer đồng thời theo fallback tạo khoảng 389 MB/giờ chỉ cho bảng xếp hạng (giả định kích thước và nhịp giữ nguyên).

Phép đo hiện tại thấy SSE trả 200, CORS `*`, nhận 1 snapshot trong 12 giây. Chưa chứng minh toàn bộ giai đoạn trước đó SSE đều lỗi hoặc người dùng đều chạy fallback.

### 3. Log hiện tại chưa đủ để quy phần trăm theo endpoint

Application logs trên Render đang ghi các GET thành `GET / 200 ...`. Middleware dùng `request.path` tại `src/common/middleware/request-logger.middleware.ts:13`, không ghi response bytes. Request logs của Render hiện bị vô hiệu hóa ở giao diện cho plan này. Do đó không thể trung thực quy toàn bộ 8,74 GB lịch sử cho một endpoint hay kết luận có bot chỉ từ dữ liệu hiện có.

## Các điểm không phải nguyên nhân chính đã chứng minh

- Database nhỏ; xóa OTP không hoàn lại băng thông đã dùng.
- Backend có `distinctUntilChanged` và shareReplay: timer 2 giây là kiểm tra DB, KHÔNG phát lại dữ liệu không đổi mỗi 2 giây.
- JSON REST có gzip; tối ưu chỉ bật gzip chung sẽ không giải quyết broadcast snapshot SSE hiện tại.
- Ảnh dùng Cloudinary/Next Image và video từ Vimeo ở frontend; không thấy backend Nest có route tải/proxy các file media này. Chưa có bằng chứng media là nguồn tạo 8,74 GB trên Render backend.
- Repo frontend công khai `nguyenthanhsonn/dulichnongthon` main tại commit 21bc719 còn dùng mock, khác với deployment. Kết luận frontend ở trên dựa trên bundle production, không dựa nhầm repo cũ.

## Thứ tự giảm lưu lượng đề xuất

1. Giữ metadata điểm đến tải một lần/cache riêng, truyền snapshot nhỏ hoặc delta gồm id/voteCount/rank/totals qua SSE; duy trì một snapshot khởi tạo tương thích.
2. Gộp sự kiện trong 1–2 giây khi phiếu đến dồn, thay vì phát ngay từng vote đến tất cả viewer. Cần kiểm tra độ trễ chấp nhận được và test không mất cập nhật cuối.
3. Tạm ngắt realtime khi tab ẩn, đồng bộ ngay khi quay lại; fallback 30–60 giây với backoff/jitter thay vì 8 giây liên tục. Không chạy đồng thời nhiều nguồn refresh.
4. Sửa log dùng pathname từ originalUrl (bỏ query để không log dữ liệu nhạy cảm), ghi Content-Length khi có, và theo dõi riêng số kết nối/sự kiện/byte SSE. Theo dõi endpoint/status để xác định traffic thật hoặc bot.
5. Cân nhắc cache HTTP ngắn/ETag cho dữ liệu công khai; giữ `no-store` cho auth và dữ liệu cá nhân. Cache trong process chỉ giảm query DB, không tự giảm byte đến người dùng.
6. Đối chiếu DATABASE_URL production và private network cùng vùng để giảm traffic DB đi qua public network; chưa thay cấu hình và chưa quy kết 994 MB vào nguồn này.

Các số đo trên thuộc thời điểm kiểm tra, trước khi triển khai bản tối ưu dưới đây.

Bằng chứng: `/Users/nguyenson/dulich-be/.backups/2026-11-10T18-32-50-295Z/bandwidth-audit/` (API measurements JSON, bundle excerpt và ảnh Render).

## Bản tối ưu

- Frontend thực tế được xác định là `hlbaot/duLichNongThon`, main `a286651` trước thay đổi.
- Nén riêng SSE bằng gzip/Brotli, flush mỗi frame để không làm chậm cập nhật. Client cũ vẫn nhận sự kiện `rankings` đầy đủ.
- Client mới dùng `/rankings/stream?compact=1`: mỗi kết nối nhận đầy đủ metadata trước, các thay đổi số phiếu nhận `ranking-counts` gồm toàn bộ id/voteCount/rank và totals. Đây là số tuyệt đối, không phải phép cộng delta; reconnect hoặc bỏ lỡ frame không làm sai tổng.
- Khi metadata/tập điểm đến thay đổi, SSE gửi lại snapshot đầy đủ. Đổi thứ hạng đơn thuần vẫn dùng counts.
- Gộp invalidation trong 1 giây; vẫn đọc định kỳ 2 giây để bắt thay đổi từ instance khác. Không thay logic ghi phiếu, không migration, không xóa dữ liệu.
- `/rankings/counts` phục vụ fallback nhỏ; snapshot cache/query được chia sẻ với các endpoint cũ.
- Frontend đóng SSE/hủy fallback khi tab ẩn; khi quay lại đồng bộ ngay. Fallback tăng từ 30 lên 60 giây với jitter 0–5 giây, giữ dữ liệu cuối khi lỗi và chặn HTTP cũ ghi đè SSE mới.
- Log giữ pathname thật và Content-Length nếu có; SSE có độ dài không cố định được ghi `stream`. Đây chưa phải thống kê byte SSE thực tế.

Triển khai backend trước rồi frontend, không chạy seed/migration/cleanup database. Có thể rollback độc lập: backend vẫn hỗ trợ client cũ; frontend có thể fallback sang `/rankings` nếu backend cũ trả 404/405 cho counts. Phần trăm tiết kiệm thực tế phải đối chiếu Metrics sau triển khai; không suy ra từ tổng băng thông cũ.

Kiểm tra: backend unit, HTTP e2e với gzip/Brotli/identity và reconnect; frontend kiểm thử tự động pause/resume, backoff, dữ liệu sai/thiếu, thứ hạng đổi, chống response cũ; TypeScript, lint và production build hai phía.
