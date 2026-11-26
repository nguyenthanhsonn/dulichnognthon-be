import type { MigrationInterface, QueryRunner } from 'typeorm';

const priorWindows = `
  starts_at >= TIMESTAMPTZ '2026-11-21 00:00:00+07'
  AND starts_at <> TIMESTAMPTZ '2026-11-26 20:30:00+07'
  AND (
    ends_at = starts_at + INTERVAL '15 minutes'
    OR (
      starts_at = TIMESTAMPTZ '2026-11-26 20:45:00+07'
      AND ends_at = TIMESTAMPTZ '2026-11-26 21:20:00+07'
    )
  )
`;

const finalWindow = `
  starts_at = TIMESTAMPTZ '2026-11-26 21:29:35+07'
  AND ends_at = TIMESTAMPTZ '2026-11-26 21:45:00+07'
`;

export class FinalVotingReopening1795703400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE contest_voting_reopenings
        DROP CONSTRAINT contest_voting_reopenings_check,
        ADD CONSTRAINT contest_voting_reopenings_check CHECK (
          (${priorWindows}) OR (${finalWindow})
        );
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM contest_voting_reopenings WHERE ${finalWindow};
      ALTER TABLE contest_voting_reopenings
        DROP CONSTRAINT contest_voting_reopenings_check,
        ADD CONSTRAINT contest_voting_reopenings_check CHECK (${priorWindows});
    `);
  }
}
