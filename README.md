# Du lịch Nông thôn

Backend cho website bình chọn điểm đến Du lịch Nông thôn, phục vụ việc giới thiệu
hồ sơ dự thi, quản lý hoạt động bình chọn và hiển thị bảng xếp hạng.

Dự án được xây dựng bằng **NestJS, TypeORM và PostgreSQL**, với mã nguồn TypeScript
và cấu trúc chia theo module nghiệp vụ.

## Chức năng chính

| Module         | Chức năng                                                                   |
| -------------- | --------------------------------------------------------------------------- |
| Destination    | Quản lý nội dung điểm đến, tìm kiếm, phân trang và hiển thị hình ảnh, video |
| Voting         | Xử lý bình chọn và lịch sử bình chọn của người dùng                         |
| Ranking        | Tổng hợp kết quả và hiển thị bảng xếp hạng điểm đến                         |
| Authentication | Quản lý tài khoản, token và phiên đăng nhập                                 |

Người dùng đăng nhập bằng email và mã xác thực OTP gửi tới hộp thư.

## Công nghệ

| Thành phần  | Công nghệ    |
| ----------- | ------------ |
| Runtime     | Node.js 24   |
| Framework   | NestJS 12    |
| Ngôn ngữ    | TypeScript 6 |
| ORM         | TypeORM 0.3  |
| Database    | PostgreSQL   |
| HTTP server | Express      |

Phiên bản Node.js sử dụng trong dự án được khai báo tại [`.node-version`](.node-version).

## Cài đặt và chạy

```bash
npm ci
npm run dev
```

Build mã nguồn:

```bash
npm run build
```

## Cấu trúc dự án

```text
src/
├── controllers/     # Tiếp nhận và xử lý HTTP request
├── modules/         # Tổ chức các module nghiệp vụ
├── services/        # Logic nghiệp vụ
│   └── dto/         # Cấu trúc dữ liệu request và response
├── guards/          # Kiểm soát xác thực
├── database/        # Entity và lớp truy cập dữ liệu
├── common/          # Middleware, exception filter và thành phần dùng chung
└── main.ts          # Khởi tạo ứng dụng
```

## Tổ chức mã nguồn

- **Controller** tiếp nhận request và chuyển xử lý cho service.
- **Service** thực hiện các nghiệp vụ của từng chức năng.
- **DTO** định nghĩa dữ liệu đầu vào, đầu ra và validation.
- **Entity** ánh xạ dữ liệu giữa ứng dụng và PostgreSQL.
- **Guard** kiểm tra quyền truy cập dựa trên phiên đăng nhập.
- **Middleware và exception filter** hỗ trợ theo dõi request và xử lý lỗi thống nhất.

## License

`UNLICENSED` — theo khai báo hiện tại trong `package.json`.
