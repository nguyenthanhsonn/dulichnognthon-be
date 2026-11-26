import type { MigrationInterface, QueryRunner } from 'typeorm';

const previousWindows = `
  starts_at >= TIMESTAMPTZ '2026-11-21 00:00:00+07'
  AND starts_at <> TIMESTAMPTZ '2026-11-26 20:30:00+07'
  AND (
    ends_at = starts_at + INTERVAL '15 minutes'
    OR (starts_at, ends_at) IN (
      (TIMESTAMPTZ '2026-11-26 20:45:00+07', TIMESTAMPTZ '2026-11-26 21:20:00+07'),
      (TIMESTAMPTZ '2026-11-26 21:29:35+07', TIMESTAMPTZ '2026-11-26 21:45:00+07')
    )
  )
`;
const startsAt = "TIMESTAMPTZ '2026-11-26 21:55:47+07'";
const endsAt = "TIMESTAMPTZ '2026-11-26 22:20:00+07'";

export class EveningVotingReopening1795706100000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contest_voting_reopenings
        DROP CONSTRAINT contest_voting_reopenings_check,
        ADD CONSTRAINT contest_voting_reopenings_check CHECK (
          (${previousWindows}) OR (starts_at = ${startsAt} AND ends_at = ${endsAt})
        );
      INSERT INTO contest_voting_reopenings (starts_at, ends_at)
      VALUES (${startsAt}, ${endsAt});
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM contest_voting_reopenings WHERE starts_at = ${startsAt} AND ends_at = ${endsAt};
      ALTER TABLE contest_voting_reopenings
        DROP CONSTRAINT contest_voting_reopenings_check,
        ADD CONSTRAINT contest_voting_reopenings_check CHECK (${previousWindows});
    `);
  }
}
