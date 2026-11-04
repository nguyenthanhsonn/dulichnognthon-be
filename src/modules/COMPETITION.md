# Destination → Voting → Ranking

Ba module dùng NestJS + **TypeORM** + PostgreSQL hiện có. Không thay auth/SMS,
không có admin/CRUD công khai hoặc WebSocket. Schema đã đủ bảng, khóa ngoại,
index và UNIQUE `(user_id, destination_id)` nên không cần migration mới.

## Chuẩn bị và cấu hình

```bash
npm install
npm run build
npm run db:migrate
# Tùy chọn trên database phát triển: thêm 3 điểm đến demo, không tự chạy production.
npm run db:seed
npm run dev
```

Seed dùng TypeORM, chỉ INSERT slug `demo-*` chưa tồn tại, không ghi đè nội dung
hoặc media đã có. Ảnh dùng placeholder; dữ liệu demo cần được thay bằng nội dung
chính thức trước khi công bố. Chạy lại seed không tạo bản ghi trùng. Không có seed
user, phiếu bình chọn hoặc token; không tạo cách đăng nhập bỏ qua xác thực.

```dotenv
MAX_VOTES_PER_USER=3
VOTING_START_AT=
VOTING_END_AT=
```

Hai timestamp phải có timezone rõ ràng (`+07:00` hoặc `Z`), start < end. Chỉ điền
giờ chính thức được Ban tổ chức xác nhận cho thời gian 05–20/11/2026; code không
tự suy đoán giờ mở/đóng. Để trống cả hai biến thì vote bị từ chối 403. Cấu hình
thiếu một mốc hoặc timestamp không hợp lệ sẽ làm startup báo lỗi. Khởi động lại
backend sau khi thay lịch. Hai đầu mốc start/end được tính trong khoảng cho phép.

Giới hạn mặc định 3, có thể cấu hình giảm nhưng không vượt 3. Các API đọc vẫn hoạt
động trước/sau hội thi. Login và secret JWT/session tiếp tục dùng cấu hình auth
hiện tại; xem [AUTH.md](AUTH.md). Không cần gửi SMS để chạy test ba module.

## Destination

### `GET /destinations?page=1&limit=12&keyword=lang`

Public, chỉ trả điểm đến active. `page` là số nguyên 1–100000, `limit` 1–100,
keyword tối đa 100 ký tự. Tìm không phân biệt hoa/thường trên title, brief và
province; không tự bỏ dấu tiếng Việt. `%`, `_` trong keyword được tìm như ký tự
thường. Thứ tự cố định: `displayOrder ASC, id ASC`.

```json
{
  "items": [
    {
      "id": "<destination UUID>",
      "title": "Làng Xanh",
      "slug": "lang-xanh",
      "brief": "Trải nghiệm làng quê",
      "province": "Tỉnh/thành",
      "thumbnailUrl": "https://example.com/image.jpg",
      "displayOrder": 1
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 12,
  "totalPages": 1
}
```

### `GET /destinations/:slug`

Public. Trả các field summary bên trên, thêm `detail` (Markdown) và `media`:

```json
{
  "id": "<destination UUID>",
  "title": "Làng Xanh",
  "slug": "lang-xanh",
  "brief": "Trải nghiệm làng quê",
  "province": null,
  "thumbnailUrl": null,
  "displayOrder": 1,
  "detail": "# Giới thiệu\nNội dung Markdown",
  "media": [
    {
      "id": "<media UUID>",
      "mediaType": "IMAGE",
      "mediaUrl": "https://example.com/image.jpg",
      "caption": "Cảnh làng quê",
      "displayOrder": 1
    }
  ]
}
```

Media IMAGE/VIDEO được sắp theo `displayOrder ASC, id ASC`. Slug không tồn tại
hoặc điểm đến inactive đều trả 404. Không có endpoint thêm/sửa/xóa dữ liệu.

## Voting

### `POST /votes`

Yêu cầu `Authorization: Bearer <accessToken>` của hệ thống đăng nhập hiện tại.

```json
{ "destinationId": "<destination UUID>" }
```

Không nhận `userId` từ client; guard xác thực token/session và gắn user vào request.
UUID/field ngoài DTO không hợp lệ trả 400. Thành công trả 201:

```json
{
  "id": "<vote UUID>",
  "destinationId": "<destination UUID>",
  "createdAt": "2026-11-05T03:00:00.000Z"
}
```

Timestamp ví dụ chỉ minh họa định dạng, không xác định giờ hội thi chính thức.

| Trường hợp                             | HTTP |
| -------------------------------------- | ---- |
| Thiếu/sai/hết hạn token hoặc session   | 401  |
| Điểm đến không tồn tại                 | 404  |
| Điểm đến inactive                      | 400  |
| Chưa mở/đã đóng/chưa cấu hình lịch     | 403  |
| Đã bình chọn điểm đến hoặc đã hết lượt | 409  |

Repository hiện có dùng transaction READ COMMITTED, khóa user bằng FOR UPDATE
trước khi đếm, giữ khóa đến khi INSERT và COMMIT. Destination dùng FOR SHARE để
trạng thái active không đổi giữa kiểm tra và ghi. Đồng hồ DB được đọc sau khi
nhận khóa; `created_at` của vote dùng chính thời điểm đã kiểm tra, thay vì timestamp
bắt đầu transaction trước lúc chờ khóa. UNIQUE bảo vệ vote trùng và trigger chặn
sửa/xóa vote. Audit SUCCESS lưu cùng vote; audit REJECTED được commit trước khi
service trả lỗi HTTP. Không có endpoint hủy hay thay đổi bình chọn.

### `GET /votes/me`

Cũng yêu cầu Bearer token; chỉ lấy phiếu của user trong token, không nhận ID user
qua query/body. Điểm đến bị ẩn sau khi bình chọn vẫn có trong lịch sử và vẫn dùng lượt.

```json
{
  "items": [
    {
      "id": "<vote UUID>",
      "destinationId": "<destination UUID>",
      "createdAt": "2026-11-05T03:00:00.000Z",
      "destination": {
        "id": "<destination UUID>",
        "title": "Làng Xanh",
        "slug": "lang-xanh",
        "brief": "Trải nghiệm làng quê",
        "province": null,
        "thumbnailUrl": null,
        "displayOrder": 1
      }
    }
  ],
  "usedVotes": 1,
  "remainingVotes": 2,
  "maxVotes": 3
}
```

## Ranking

`GET /rankings` trả toàn bộ điểm đến active. `GET /rankings/top` trả tối đa 3 điểm.
Cả hai public, dùng `Cache-Control: no-store` để frontend polling 5–10 giây nhận
dữ liệu mới. Không cache counter, không tạo bảng tổng điểm.

```json
{
  "items": [
    {
      "id": "<destination UUID>",
      "title": "Làng Xanh",
      "slug": "lang-xanh",
      "brief": "Trải nghiệm làng quê",
      "province": null,
      "thumbnailUrl": null,
      "displayOrder": 1,
      "rank": 1,
      "voteCount": 5
    }
  ],
  "totalVotes": 5,
  "totalDestinations": 1
}
```

Một SQL LEFT JOIN + GROUP BY giữ cả điểm đến 0 phiếu. Thứ tự:
`voteCount DESC, displayOrder ASC, id ASC`; rank là thứ tự 1, 2, 3… sau tie-break.
Window aggregation tính tổng trước LIMIT, nên `/top` vẫn trả `totalVotes` và
`totalDestinations` của toàn bộ bảng xếp hạng active, không chỉ ba dòng đầu.

`totalVotes` là tổng các phiếu đã ghi nhận cho điểm đến **đang active**. Phiếu từ
lần bình chọn bị từ chối không được lưu vào `votes`; audit REJECTED không tham gia
đếm. Không loại phiếu đã hợp lệ trước đó chỉ vì user sau này bị chặn. Vote phải ghi
qua repository; dữ liệu INSERT thủ công ngoài quy tắc nghiệp vụ không được tự
phát hiện/kiểm duyệt bởi ranking. Không có điểm đến thì items rỗng và hai tổng bằng 0.

## Ví dụ request

```bash
curl 'http://localhost:3000/destinations?page=1&limit=12&keyword=lang'
curl 'http://localhost:3000/destinations/demo-lang-xanh'
curl -X POST 'http://localhost:3000/votes' \
  -H 'Authorization: Bearer <accessToken>' \
  -H 'Content-Type: application/json' \
  -d '{"destinationId":"<destination UUID>"}'
curl 'http://localhost:3000/votes/me' -H 'Authorization: Bearer <accessToken>'
curl 'http://localhost:3000/rankings/top'
curl 'http://localhost:3000/rankings'
```

## Kiểm thử

```bash
npm run build
npm test
npm run test:e2e
npm run test:db
```

Database suite chạy trên schema UUID riêng, dùng guard/JWT/session thật với user
test, không gửi SMS và không ghi bảng public. Bao gồm phân trang/tìm kiếm/media,
ba phiếu đầu, phiếu thứ tư, trùng phiếu, request đồng thời, trước/sau/missing lịch,
điểm đến inactive, ranking 0 phiếu/tổng/tie-break, auth và seed idempotent.
Schema test được dọn sau mỗi suite. CI/CD hiện tại được giữ nguyên.
