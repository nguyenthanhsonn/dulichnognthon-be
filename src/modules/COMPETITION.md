# Destination → Voting → Ranking

Ba module dùng NestJS + **TypeORM** + PostgreSQL hiện có. Dùng lại xác thực email OTP,
không có admin/CRUD công khai hoặc WebSocket. Schema đã đủ bảng, khóa ngoại,
index và UNIQUE `(user_id, destination_id)`. Migration UnlimitedVoting chỉ cập nhật
comment quy tắc trong database, không xóa hoặc sửa phiếu.

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

Lịch bình chọn do frontend xử lý theo giờ Việt Nam (UTC+7): mở lúc 00:00 ngày
07/11/2026 và đóng sau hết phút 23:59 ngày 20/11/2026. Frontend ẩn/khóa nút
bình chọn ngoài thời gian này. Backend không kiểm tra lịch và vẫn nhận request
bình chọn trực tiếp ngoài khung giờ; không dùng biến môi trường lịch bình chọn.

Không giới hạn tổng số điểm đến mỗi tài khoản được bình chọn; mỗi điểm đến chỉ
được vote một lần/tài khoản trong toàn hội thi. Các API đọc vẫn hoạt
động trước/sau hội thi. Login và secret JWT/session tiếp tục dùng cấu hình auth
hiện tại; xem [AUTH.md](AUTH.md). Không cần gửi email thật để chạy test ba module.

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
{
  "destinationId": "<destination UUID>"
}
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

| Trường hợp                           | HTTP |
| ------------------------------------ | ---- |
| Thiếu/sai/hết hạn token hoặc session | 401  |
| Điểm đến không tồn tại               | 404  |
| Điểm đến inactive                    | 400  |
| Chưa mở/đã đóng/chưa cấu hình lịch   | 403  |
| Đã bình chọn điểm đến                | 409  |

Repository hiện có dùng transaction READ COMMITTED, khóa user bằng FOR UPDATE
để chống vote trùng đồng thời, giữ khóa đến khi INSERT và COMMIT. Destination dùng FOR SHARE để
trạng thái active không đổi giữa kiểm tra và ghi. Đồng hồ DB được đọc sau khi
nhận khóa; `created_at` của vote dùng chính thời điểm đã kiểm tra, thay vì timestamp
bắt đầu transaction trước lúc chờ khóa. UNIQUE bảo vệ vote trùng và trigger chặn
sửa/xóa vote. Audit SUCCESS lưu cùng vote; audit REJECTED được commit trước khi
service trả lỗi HTTP. Không có endpoint hủy hay thay đổi bình chọn.

### `GET /votes/me`

Cũng yêu cầu Bearer token; chỉ lấy phiếu của user trong token, không nhận ID user
qua query/body. Điểm đến bị ẩn vẫn có trong lịch sử. `usedVotes` là số điểm đã
bình chọn; `remainingVotes` và `maxVotes` là null vì không có hạn mức tổng.

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
  "remainingVotes": null,
  "maxVotes": null
}
```

## Ranking

`GET /rankings` trả toàn bộ điểm đến active. `GET /rankings/top` trả tối đa 3 điểm.
Cả hai public, dùng `Cache-Control: no-store`; frontend có thể polling 5–10 giây nhận
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
test, không gửi email thật và không ghi bảng public. Bao gồm phân trang/tìm kiếm/media,
ba phiếu đầu, phiếu thứ tư, trùng phiếu, request đồng thời, trước/sau/missing lịch,
điểm đến inactive, ranking 0 phiếu/tổng/tie-break, auth và seed idempotent.
Schema test được dọn sau mỗi suite. CI/CD hiện tại được giữ nguyên.

### Ranking SSE và cache

`GET /rankings/stream` phát snapshot qua event `rankings`, không cần token. Stream
chia sẻ một query cho mọi người xem, kiểm tra DB mỗi 2 giây và refresh sau vote
commit trên cùng instance. API JSON top/full dùng cache nội bộ 1 giây và gom
request đồng thời; cache bị xóa sau vote. Không thay đổi bảng votes, quy tắc
xếp hạng hoặc thêm bảng tổng điểm. Hướng dẫn FE và giới hạn cold start:
[Ranking realtime](../../docs/RANKING-REALTIME.md).
