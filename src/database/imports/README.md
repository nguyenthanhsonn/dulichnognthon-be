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
