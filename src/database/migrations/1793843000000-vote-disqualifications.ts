import type { MigrationInterface, QueryRunner } from 'typeorm';
import { canonicalGmailEmailSql } from '../gmail-mailbox.sql.js';

export class VoteDisqualifications1793843000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const schema =
      (queryRunner.connection.options as { schema?: string }).schema ??
      'public';
    await queryRunner.query(
      'SET LOCAL search_path TO ' +
        queryRunner.connection.driver.escape(schema),
    );
    await queryRunner.query(`
      CREATE FUNCTION canonical_gmail_email(email text) RETURNS text
      LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
      AS $$ SELECT ${canonicalGmailEmailSql} $$;

      CREATE INDEX users_canonical_gmail_email_idx
        ON users (canonical_gmail_email(email))
        WHERE canonical_gmail_email(email) IS NOT NULL;

      CREATE TABLE vote_disqualifications (
        vote_id UUID NOT NULL REFERENCES votes(id),
        reason TEXT NOT NULL CHECK (reason IN (
          'UNAPPROVED_DOMAIN', 'DUPLICATE_GMAIL_SAME_DESTINATION'
        )),
        disqualified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        disqualified_by TEXT NOT NULL,
        cutoff_at TIMESTAMPTZ NOT NULL,
        restored_at TIMESTAMPTZ,
        restored_by TEXT,
        restoration_note TEXT,
        PRIMARY KEY (vote_id, reason),
        CHECK (num_nonnulls(restored_at, restored_by, restoration_note) IN (0, 3))
      );
      COMMENT ON TABLE vote_disqualifications IS 'Quyết định loại phiếu theo từng lý do và lịch sử phục hồi khi phúc khảo.';
      CREATE INDEX vote_disqualifications_active_vote_idx
        ON vote_disqualifications (vote_id) WHERE restored_at IS NULL;
    `);
  }

  async down(): Promise<void> {
    throw new Error(
      'Back up vote disqualification decisions before reverting.',
    );
  }
}
