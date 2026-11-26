import type { MigrationInterface, QueryRunner } from 'typeorm';

const startsAt = "TIMESTAMPTZ '2026-11-26 22:30:30+07'";
const oldEnd = "TIMESTAMPTZ '2026-11-26 22:45:00+07'";
const newEnd = "TIMESTAMPTZ '2026-11-26 23:00:00+07'";
const previousWindows = `
  starts_at >= TIMESTAMPTZ '2026-11-21 00:00:00+07'
  AND starts_at <> TIMESTAMPTZ '2026-11-26 20:30:00+07'
  AND (
    ends_at = starts_at + INTERVAL '15 minutes'
    OR (starts_at, ends_at) IN (
      (TIMESTAMPTZ '2026-11-26 20:45:00+07', TIMESTAMPTZ '2026-11-26 21:20:00+07'),
      (TIMESTAMPTZ '2026-11-26 21:29:35+07', TIMESTAMPTZ '2026-11-26 21:45:00+07'),
      (TIMESTAMPTZ '2026-11-26 21:55:47+07', TIMESTAMPTZ '2026-11-26 22:20:00+07'),
      (${startsAt}, ${oldEnd})
    )
  )
`;

export class ExtendLateVotingReopening1795707150000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contest_voting_reopenings
        DROP CONSTRAINT contest_voting_reopenings_check,
        ADD CONSTRAINT contest_voting_reopenings_check CHECK (
          (${previousWindows}) OR (starts_at = ${startsAt} AND ends_at = ${newEnd})
        );
      UPDATE contest_voting_reopenings SET ends_at = ${newEnd}
      WHERE starts_at = ${startsAt} AND ends_at = ${oldEnd};
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE contest_voting_reopenings SET ends_at = ${oldEnd}
      WHERE starts_at = ${startsAt} AND ends_at = ${newEnd};
      ALTER TABLE contest_voting_reopenings
        DROP CONSTRAINT contest_voting_reopenings_check,
        ADD CONSTRAINT contest_voting_reopenings_check CHECK (${previousWindows});
    `);
  }
}
