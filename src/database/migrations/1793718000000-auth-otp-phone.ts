import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Challenge OTP tồn tại trước user; chỉ tạo tài khoản sau khi xác thực thành công. */
export class AuthOtpPhone1793718000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const schema =
      (queryRunner.connection.options as { schema?: string }).schema ??
      'public';
    await queryRunner.query(
      'SET LOCAL search_path TO ' +
        queryRunner.connection.driver.escape(schema),
    );
    await queryRunner.query(`
      ALTER TABLE otp_codes ADD COLUMN phone VARCHAR(20);
      UPDATE otp_codes AS otp SET phone = u.phone FROM users AS u WHERE u.id = otp.user_id;
      ALTER TABLE otp_codes ALTER COLUMN phone SET NOT NULL;
      ALTER TABLE otp_codes ALTER COLUMN user_id DROP NOT NULL;
      CREATE INDEX otp_codes_phone_created_at_idx ON otp_codes (phone, created_at);
      COMMENT ON COLUMN otp_codes.phone IS 'Số điện thoại chuẩn hóa của challenge; user chỉ được tạo sau khi OTP đúng.';
    `);
  }

  async down(): Promise<void> {
    throw new Error(
      'Review pending OTP challenges before reverting phone-based authentication.',
    );
  }
}
