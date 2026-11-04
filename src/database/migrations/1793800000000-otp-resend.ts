import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Phân biệt gửi đầu/gửi lại để enforce riêng quota 1 SEND và 3 RESEND mỗi giờ. */
export class OtpResend1793800000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const schema =
      (queryRunner.connection.options as { schema?: string }).schema ??
      'public';
    await queryRunner.query(
      'SET LOCAL search_path TO ' +
        queryRunner.connection.driver.escape(schema),
    );
    // Challenge cũ được coi là SEND; không xóa OTP hoặc đổi user/session hiện có.
    await queryRunner.query(`
      ALTER TABLE otp_codes ADD COLUMN request_type VARCHAR(6) NOT NULL DEFAULT 'SEND';
      ALTER TABLE otp_codes ADD CONSTRAINT otp_codes_request_type_check CHECK (request_type IN ('SEND', 'RESEND'));
      CREATE INDEX otp_codes_email_request_type_created_at_idx ON otp_codes (email, request_type, created_at);
      COMMENT ON COLUMN otp_codes.request_type IS 'SEND: gửi đầu, tối đa 1 lần/email/giờ; RESEND: gửi lại, tối đa 3 lần/email/giờ.';
    `);
  }

  async down(): Promise<void> {
    throw new Error(
      'Review OTP delivery quotas before reverting resend request types.',
    );
  }
}
