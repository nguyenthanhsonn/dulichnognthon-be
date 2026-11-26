import type { MigrationInterface, QueryRunner } from 'typeorm';

const ORIGINAL_WINDOW = `
  created_at >= TIMESTAMPTZ '2026-11-07 00:00:00+07'
  AND created_at < TIMESTAMPTZ '2026-11-21 00:00:00+07'
`;

export class VotingReopening1795698000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE contest_voting_reopenings (
        starts_at TIMESTAMPTZ PRIMARY KEY,
        ends_at TIMESTAMPTZ NOT NULL,
        CHECK (starts_at >= TIMESTAMPTZ '2026-11-21 00:00:00+07'
          AND ends_at = starts_at + INTERVAL '15 minutes')
      );
      COMMENT ON TABLE contest_voting_reopenings IS
        'Các khung 15 phút đã cấu hình để mở lại bình chọn.';
    `);

    // Production có CHECK được đặt ngoài migration. Giữ giới hạn cũ ở nơi đã có.
    const constraint = await queryRunner.query(
      `
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = 'votes'::regclass AND conname = 'votes_contest_2026_window_check'
    `,
      undefined,
      true,
    );
    if (!constraint.records.length) return;

    await queryRunner.query(`
      CREATE FUNCTION enforce_contest_vote_window() RETURNS trigger
      LANGUAGE plpgsql AS $$
      BEGIN
        IF (NEW.created_at >= TIMESTAMPTZ '2026-11-07 00:00:00+07'
            AND NEW.created_at < TIMESTAMPTZ '2026-11-21 00:00:00+07')
          OR EXISTS (
            SELECT 1 FROM contest_voting_reopenings
            WHERE NEW.created_at >= starts_at AND NEW.created_at < ends_at
              AND clock_timestamp() >= starts_at AND clock_timestamp() < ends_at
          ) THEN
          RETURN NEW;
        END IF;
        RAISE EXCEPTION 'Vote is outside the contest window'
          USING ERRCODE = '23514', CONSTRAINT = 'votes_contest_2026_window_check';
      END;
      $$;
      ALTER TABLE votes DROP CONSTRAINT votes_contest_2026_window_check;
      CREATE TRIGGER enforce_contest_vote_window
        BEFORE INSERT ON votes FOR EACH ROW
        EXECUTE FUNCTION enforce_contest_vote_window();
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const trigger = await queryRunner.query(
      `
      SELECT 1
      FROM pg_trigger
      WHERE tgrelid = 'votes'::regclass AND tgname = 'enforce_contest_vote_window'
    `,
      undefined,
      true,
    );
    if (trigger.records.length) {
      await queryRunner.query(`
        ALTER TABLE votes ADD CONSTRAINT votes_contest_2026_window_check
          CHECK (${ORIGINAL_WINDOW}) NOT VALID;
        DROP TRIGGER enforce_contest_vote_window ON votes;
        DROP FUNCTION enforce_contest_vote_window();
      `);
    }
    await queryRunner.query('DROP TABLE contest_voting_reopenings');
  }
}
