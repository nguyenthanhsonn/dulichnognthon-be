# Nhập 35 bài thi du lịch nông thôn 2026

Nguồn: [tài liệu 35 hồ sơ](https://docs.google.com/document/d/11gw7XpG78qNzzGM5q1OIpAfIGvjsn6j2/edit),
Phụ lục 02 kèm báo cáo ngày 27/10/2026. File gốc là Word được chia sẻ qua Google Drive.
Snapshot văn bản nằm trong `data/contest-2026-source.txt`; dữ liệu TypeScript ở
`contest-2026.entries.ts` có checksum nguồn để đối chiếu.

```bash
npm run build
npm run db:import:contest2026
```

- Giữ nguyên tên bài thi, mã hồ sơ, địa chỉ và nội dung nguồn; mã/địa chỉ được đưa
  vào `detail` dạng Markdown vì schema hiện chưa có cột riêng.
- `brief` trích tối đa khoảng 320 ký tự từ đoạn giới thiệu đầu tiên. Nội dung đầy
  đủ của cả đánh giá chung và nét khác biệt được lưu trong `detail`.
- `slug` ghép mã có thứ tự ba chữ số và tên bỏ dấu; `display_order` từ 1 đến 35,
  `is_active=true`, UUID do PostgreSQL sinh.
- `thumbnail_url=null`, không tạo `destination_media` hoặc ảnh placeholder.
- Bài số 25 (Vườn hồng Lê Phúc): người dùng xác nhận trường tỉnh/thành là `Đà Lạt`
  ngày 04/11/2026; giá trị này bổ sung cho dữ liệu nguồn, địa chỉ trong detail giữ nguyên.
- Mã nguồn số 21 là `DLNT2026-21`, số 35 là `DLNT2026-35`: giữ nguyên trong nội dung,
  chỉ chuẩn hóa phần mã trong slug thành 021/035.
- Bài 18 có nhắc Sen Quê Bác, bài 35 là một hồ sơ riêng; giữ đủ 35 dòng theo mã hồ sơ.
- Import dùng một transaction, xác minh toàn bộ nội dung trước commit, không sửa
  ảnh/video, UUID hoặc phiếu bình chọn của bản ghi đã tồn tại. Chạy lại sẽ bỏ qua
  bản ghi trùng khớp; xung đột nội dung hoặc tên trùng slug khác sẽ báo lỗi để đối chiếu.

## Bổ sung video Vimeo cho 35 bài thi

```bash
npm run build
npm run db:seed:videos -- --dry-run
npm run db:seed:videos
```

Chạy import nội dung 35 bài trước khi seed video. Danh sách link nằm trong
`../seeds/contest-2026.videos.ts`, thứ tự 1–35 theo tài liệu gốc. Seed tìm điểm đến
bằng slug đã import, không dựa vào thứ tự query hay `display_order` hiện tại.
Mỗi bài thêm một media `VIDEO`, API chi tiết trả trong `media[].mediaUrl`.

- Toàn bộ thao tác nằm trong transaction có advisory lock; thiếu bài sẽ rollback.
- Chạy lại không thêm trùng; không sửa nội dung bài thi, ảnh, phiếu bình chọn hoặc
  media nhập bằng cách khác. Chỉ cập nhật URL của video do chính seed quản lý.
- Bỏ tham số tracking `fl`, `fe`, `share`. Giữ hash đường dẫn ở bài 1 để truy cập
  video unlisted. Bài 7 hiện dùng link xem `https://vimeo.com/1242903360`.
- Theo danh sách đã sửa: bài 15 và 22 vẫn cùng video `1243134240`. Các bài
  16–20 và 29 đã có link riêng; cập nhật giữ nguyên UUID media và không sinh bản ghi trùng.
- Seed không tải video và không xác nhận được quyền xem/nhúng của Vimeo. Nếu
  video private hoặc hạn chế domain, chủ video cần bật quyền xem/nhúng tương ứng.
- URL lưu là link Vimeo, không phải tệp MP4; frontend cần dùng Vimeo player/iframe,
  giữ hash của video unlisted khi tạo URL nhúng.
