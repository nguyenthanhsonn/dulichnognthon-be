import type { MigrationInterface, QueryRunner } from 'typeorm';
import { initialVotingSql } from './initial-voting.sql.js';

/** Khởi tạo mới hoặc tiếp nhận schema đã tạo trước khi chuyển về TypeORM. */
export class InitVoting1793715300000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const schema =
      (queryRunner.connection.options as { schema?: string }).schema ??
      'public';
    const escape = (value: string) =>
      queryRunner.connection.driver.escape(value);
    await queryRunner.query('SET LOCAL search_path TO ' + escape(schema));
    const tables = [
      'users',
      'otp_codes',
      'auth_sessions',
      'destinations',
      'destination_media',
      'votes',
      'vote_attempts',
    ];
    const existing = (await queryRunner.query(
      'SELECT tablename FROM pg_tables WHERE schemaname = $1 AND tablename = ANY($2::text[])',
      [schema, tables],
    )) as { tablename: string }[];
    if (existing.length > 0) {
      // Chỉ baseline đúng migration cũ đã hoàn tất, không suy đoán từ tên bảng.
      const historyExists = await queryRunner.hasTable(
        schema + '._prisma_migrations',
      );
      if (existing.length === tables.length && historyExists) {
        const history = (await queryRunner.query(
          'SELECT checksum FROM ' +
            escape(schema) +
            '._prisma_migrations WHERE migration_name = $1 AND finished_at IS NOT NULL AND rolled_back_at IS NULL',
          ['20261103141500_init_voting'],
        )) as { checksum: string }[];
        if (
          history.some(
            (row) =>
              row.checksum ===
              'e1e66e76cfd4b2caea55523e438291afd8b72363b085e584e6f59b41eb8efbd5',
          )
        )
          return;
      }
      throw new Error(
        'Existing voting tables do not match the known initial migration. Review the schema before baselining.',
      );
    }
    await queryRunner.query(initialVotingSql);
  }

  async down(): Promise<void> {
    // Không cung cấp rollback xóa toàn bộ dữ liệu cho migration khởi tạo.
    throw new Error('Initial voting schema cannot be reverted automatically.');
  }
}
