import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Chỉ thêm metadata card; không thay đổi title, slug hoặc nội dung hồ sơ. */
export class DestinationCards1793842000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const schema =
      (queryRunner.connection.options as { schema?: string }).schema ??
      'public';
    await queryRunner.query(
      'SET LOCAL search_path TO ' +
        queryRunner.connection.driver.escape(schema),
    );
    await queryRunner.query(`
      ALTER TABLE destinations ADD COLUMN contest_code VARCHAR(50);
      ALTER TABLE destinations ADD COLUMN short_title VARCHAR(255);
      COMMENT ON COLUMN destinations.contest_code IS 'Mã hiển thị theo danh sách hội thi, độc lập với mã hồ sơ cũ trong detail.';
      COMMENT ON COLUMN destinations.short_title IS 'Tên ngắn hiển thị card; NULL dùng title hiện tại.';
    `);
  }
  async down(): Promise<void> {
    throw new Error(
      'Back up contest card metadata before reverting this migration.',
    );
  }
}
