import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PublishedVoteResults1795669200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE published_vote_results (
        destination_id UUID PRIMARY KEY REFERENCES destinations(id),
        vote_count INTEGER NOT NULL CHECK (vote_count >= 0),
        source TEXT NOT NULL,
        imported_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      COMMENT ON TABLE published_vote_results IS
        'Số lượt bình chọn đã chốt dùng để công bố trên bảng xếp hạng.';
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE published_vote_results');
  }
}
