import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ReplaceVotingReopening1795700200000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE contest_voting_reopenings
      SET starts_at = TIMESTAMPTZ '2026-11-26 20:45:00+07',
          ends_at = TIMESTAMPTZ '2026-11-26 21:00:00+07'
      WHERE starts_at = TIMESTAMPTZ '2026-11-26 20:30:00+07';
      ALTER TABLE contest_voting_reopenings
        DROP CONSTRAINT contest_voting_reopenings_check,
        ADD CONSTRAINT contest_voting_reopenings_check CHECK (
          starts_at >= TIMESTAMPTZ '2026-11-21 00:00:00+07'
          AND starts_at <> TIMESTAMPTZ '2026-11-26 20:30:00+07'
          AND ends_at = starts_at + INTERVAL '15 minutes'
        );
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contest_voting_reopenings
        DROP CONSTRAINT contest_voting_reopenings_check,
        ADD CONSTRAINT contest_voting_reopenings_check CHECK (
          starts_at >= TIMESTAMPTZ '2026-11-21 00:00:00+07'
          AND (
            ends_at = starts_at + INTERVAL '15 minutes'
            OR (
              starts_at = TIMESTAMPTZ '2026-11-26 20:30:00+07'
              AND ends_at = TIMESTAMPTZ '2026-11-26 20:55:00+07'
            )
          )
        );
      UPDATE contest_voting_reopenings
      SET starts_at = TIMESTAMPTZ '2026-11-26 20:30:00+07',
          ends_at = TIMESTAMPTZ '2026-11-26 20:55:00+07'
      WHERE starts_at = TIMESTAMPTZ '2026-11-26 20:45:00+07'
        AND ends_at = TIMESTAMPTZ '2026-11-26 21:00:00+07'
    `);
  }
}
