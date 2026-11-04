// SQL được quản lý bằng TypeORM migration; comment được lưu trong PostgreSQL.
export const initialVotingSql = `-- Migration nguyên tử: không để lại schema dở dang khi một bước thất bại.


-- CreateSchema


-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone" VARCHAR(20) NOT NULL,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "code_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "brief" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "province" VARCHAR(150),
    "thumbnail_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destination_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "destination_id" UUID NOT NULL,
    "media_type" VARCHAR(20) NOT NULL,
    "media_url" TEXT NOT NULL,
    "caption" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destination_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vote_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "destination_id" UUID,
    "ip_hash" VARCHAR(255),
    "device_hash" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL,
    "reason" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vote_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "otp_codes_user_id_created_at_idx" ON "otp_codes"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "otp_codes_expires_at_idx" ON "otp_codes"("expires_at");

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_revoked_at_idx" ON "auth_sessions"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations"("slug");

-- CreateIndex
CREATE INDEX "destinations_is_active_display_order_idx" ON "destinations"("is_active", "display_order");

-- CreateIndex
CREATE INDEX "destination_media_destination_id_display_order_idx" ON "destination_media"("destination_id", "display_order");

-- CreateIndex
CREATE INDEX "votes_destination_id_idx" ON "votes"("destination_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_user_id_destination_id_key" ON "votes"("user_id", "destination_id");

-- CreateIndex
CREATE INDEX "vote_attempts_user_id_created_at_idx" ON "vote_attempts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "vote_attempts_destination_id_created_at_idx" ON "vote_attempts"("destination_id", "created_at");

-- CreateIndex
CREATE INDEX "vote_attempts_status_created_at_idx" ON "vote_attempts"("status", "created_at");

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "destination_media" ADD CONSTRAINT "destination_media_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vote_attempts" ADD CONSTRAINT "vote_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "vote_attempts" ADD CONSTRAINT "vote_attempts_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE SET NULL ON UPDATE RESTRICT;

-- Giữ VARCHAR như thiết kế, nhưng DB chỉ nhận các trạng thái hợp lệ.
ALTER TABLE "destination_media" ADD CONSTRAINT "destination_media_type_check"
  CHECK ("media_type" IN ('IMAGE', 'VIDEO'));
ALTER TABLE "vote_attempts" ADD CONSTRAINT "vote_attempts_status_check"
  CHECK ("status" IN ('SUCCESS', 'REJECTED'));
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_attempt_count_check"
  CHECK ("attempt_count" >= 0);

-- Bình chọn không được sửa hoặc hủy, kể cả khi ghi SQL trực tiếp.
CREATE FUNCTION reject_vote_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Votes cannot be updated or deleted' USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER votes_immutable BEFORE UPDATE OR DELETE ON "votes"
  FOR EACH ROW EXECUTE FUNCTION reject_vote_mutation();

-- Cập nhật updated_at cho cả TypeORM lẫn các thao tác SQL ngoài ứng dụng.
CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER destinations_updated_at BEFORE UPDATE ON "destinations"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Comment được lưu trong PostgreSQL để có thể đọc ngay bằng DBeaver.
COMMENT ON TABLE "users" IS 'Người bình chọn; một tài khoản cho mỗi số điện thoại chuẩn hóa.';
COMMENT ON TABLE "otp_codes" IS 'OTP có hạn dùng và số lần thử; chỉ lưu hash, không lưu mã thô.';
COMMENT ON TABLE "auth_sessions" IS 'Phiên đăng nhập; lưu hash refresh token và thời điểm thu hồi.';
COMMENT ON TABLE "destinations" IS 'Điểm đến dự thi, nội dung chi tiết có thể dùng Markdown.';
COMMENT ON TABLE "destination_media" IS 'Hình ảnh/video của điểm đến, sắp theo display_order.';
COMMENT ON TABLE "votes" IS 'Bình chọn bất biến; tối đa 3 lượt/user, tạo qua transaction khóa user trong VotesRepository.';
COMMENT ON TABLE "vote_attempts" IS 'Nhật ký thao tác, không thay thế rate limiting của backend.';
COMMENT ON COLUMN "otp_codes"."code_hash" IS 'Hash OTP; backend phải kiểm tra expires_at, attempt_count và consumed_at khi xác thực.';
COMMENT ON COLUMN "auth_sessions"."refresh_token_hash" IS 'Hash refresh token; rotation và thu hồi do backend thực hiện.';
COMMENT ON COLUMN "vote_attempts"."ip_hash" IS 'Hash IP đã tính tại backend, không lưu IP thô.';
COMMENT ON COLUMN "vote_attempts"."device_hash" IS 'Hash định danh thiết bị, không lưu fingerprint thô.';


`;
