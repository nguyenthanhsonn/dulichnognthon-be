import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Chỉ cập nhật mô tả quy tắc; giữ nguyên UNIQUE(user_id, destination_id) và mọi phiếu. */
export class UnlimitedVoting1793826000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const schema =
      (queryRunner.connection.options as { schema?: string }).schema ??
      'public';
    const table = `${queryRunner.connection.driver.escape(schema)}."votes"`;
    await queryRunner.query(
      `COMMENT ON TABLE ${table} IS 'Bình chọn bất biến; mỗi tài khoản chỉ bình chọn một lần cho mỗi điểm đến, không giới hạn tổng số điểm đến.'`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const schema =
      (queryRunner.connection.options as { schema?: string }).schema ??
      'public';
    const table = `${queryRunner.connection.driver.escape(schema)}."votes"`;
    await queryRunner.query(
      `COMMENT ON TABLE ${table} IS 'Bình chọn bất biến; tối đa 3 lượt/user, tạo qua transaction khóa user trong VotesRepository.'`,
    );
  }
}
