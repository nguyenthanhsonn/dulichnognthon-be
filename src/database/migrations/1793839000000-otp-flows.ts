import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Bổ sung metadata phiên OTP, không xóa hoặc sửa challenge/session/vote đã tồn tại. */
export class OtpFlows1793839000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const schema =
      (queryRunner.connection.options as { schema?: string }).schema ??
      'public';
    await queryRunner.query(
      'SET LOCAL search_path TO ' +
        queryRunner.connection.driver.escape(schema),
    );
    await queryRunner.query(`
      ALTER TABLE otp_codes ADD COLUMN flow_id UUID;
      ALTER TABLE otp_codes ADD COLUMN flow_expires_at TIMESTAMPTZ(6);
      ALTER TABLE otp_codes ADD COLUMN verified_at TIMESTAMPTZ(6);
      ALTER TABLE otp_codes ADD CONSTRAINT otp_codes_flow_metadata_check
        CHECK ((flow_id IS NULL AND flow_expires_at IS NULL) OR (flow_id IS NOT NULL AND flow_expires_at IS NOT NULL));
      CREATE INDEX otp_codes_flow_id_request_type_idx ON otp_codes (flow_id, request_type);
      COMMENT ON COLUMN otp_codes.request_type IS 'SEND: gửi đầu của phiên xác thực; RESEND: gửi lại, tối đa 3 lần/phiên.';
      COMMENT ON COLUMN otp_codes.flow_id IS 'Nhóm một lần gửi đầu và tối đa ba lần gửi lại; dữ liệu cũ được giữ NULL.';
      COMMENT ON COLUMN otp_codes.verified_at IS 'Phiên OTP đã xác thực thành công; tách biệt consumed_at của mã bị thay thế/khóa/gửi lỗi.';
    `);
  }

  async down(): Promise<void> {
    throw new Error(
      'Review active OTP flows before reverting authentication flow metadata.',
    );
  }
}
