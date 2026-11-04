import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Bổ sung email, giữ lại phone/UUID và quan hệ cũ để không mất user/session/vote. */
export class AuthEmail1793757600000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const schema =
      (queryRunner.connection.options as { schema?: string }).schema ??
      'public';
    await queryRunner.query(
      'SET LOCAL search_path TO ' +
        queryRunner.connection.driver.escape(schema),
    );
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN email VARCHAR(254);
      ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
      CREATE UNIQUE INDEX users_email_key ON users (email);
      ALTER TABLE users ADD CONSTRAINT users_email_normalized_check
        CHECK (email IS NULL OR (email = lower(btrim(email)) AND email <> ''));
      ALTER TABLE users ADD CONSTRAINT users_identity_check CHECK (email IS NOT NULL OR phone IS NOT NULL);
      ALTER TABLE otp_codes ADD COLUMN email VARCHAR(254);
      ALTER TABLE otp_codes ALTER COLUMN phone DROP NOT NULL;
      CREATE INDEX otp_codes_email_created_at_idx ON otp_codes (email, created_at);
      ALTER TABLE otp_codes ADD CONSTRAINT otp_codes_email_normalized_check
        CHECK (email IS NULL OR (email = lower(btrim(email)) AND email <> ''));
      ALTER TABLE otp_codes ADD CONSTRAINT otp_codes_identity_check CHECK (email IS NOT NULL OR phone IS NOT NULL);
      COMMENT ON COLUMN users.email IS 'Email đăng nhập đã chuẩn hóa lowercase/trim; chỉ gắn sau khi xác thực OTP.';
      COMMENT ON COLUMN users.phone IS 'Số điện thoại từ dữ liệu cũ, không còn dùng để đăng nhập OTP.';
      COMMENT ON COLUMN otp_codes.email IS 'Email nhận OTP; challenge tồn tại trước khi tạo tài khoản.';
      COMMENT ON TABLE users IS 'Người bình chọn; đăng nhập bằng email OTP, giữ dữ liệu phone cũ khi chuyển đổi.';
    `);
  }
  async down(): Promise<void> {
    throw new Error(
      'Email authentication migration requires an explicit data migration to revert safely.',
    );
  }
}
