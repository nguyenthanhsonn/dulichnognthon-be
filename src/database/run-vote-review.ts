import 'dotenv/config';
import { type EntityManager } from 'typeorm';
import database from './data-source.js';
import { canonicalGmailEmailSql } from './gmail-mailbox.sql.js';
import { STANDARD_EMAIL_DOMAINS } from '../services/dto/auth/email.js';

const scenarioB = `
  WITH ballot AS MATERIALIZED (
    SELECT v.id, v.destination_id, v.created_at,
           ${canonicalGmailEmailSql} AS gmail,
           coalesce(substring(lower(btrim(u.email)) from '@([^@]+)$'), '') AS domain
    FROM votes v JOIN users u ON u.id = v.user_id
    WHERE v.created_at < $1::timestamptz
  ), gmail_votes AS (
    SELECT id, row_number() OVER (PARTITION BY destination_id, gmail ORDER BY created_at, id) AS position
    FROM ballot WHERE gmail IS NOT NULL
  ), flagged AS (
    SELECT id, 'UNAPPROVED_DOMAIN' AS reason FROM ballot
      WHERE NOT (domain = ANY($2::text[]) OR domain LIKE '%.edu.vn' OR domain LIKE '%.gov.vn')
    UNION ALL
    SELECT id, 'DUPLICATE_GMAIL_SAME_DESTINATION' FROM gmail_votes WHERE position > 1
  )`;

async function review(
  tx: EntityManager,
  cutoff: string,
  domains: string[],
  approval?: { fingerprint: string; actor: string },
) {
  if (approval) await lockReview(tx);
  else await tx.query('SET TRANSACTION READ ONLY');
  const [{ inside_snapshot }] = await tx.query<{ inside_snapshot: boolean }[]>(
    'SELECT $1::timestamptz <= transaction_timestamp() AS inside_snapshot',
    [cutoff],
  );
  if (!inside_snapshot) throw new Error('The cutoff must be in the past.');

  const values = [cutoff, [...STANDARD_EMAIL_DOMAINS, ...domains]];
  const [summary] = await tx.query<
    {
      fingerprint: string;
      destinations: unknown;
      original_votes: number;
      excluded: number;
      remaining: number;
    }[]
  >(
    `${scenarioB}, totals AS (
    SELECT b.destination_id,
           count(*)::int AS original_votes,
           count(*) FILTER (WHERE f.id IS NOT NULL)::int AS excluded
    FROM ballot b LEFT JOIN (SELECT DISTINCT id FROM flagged) f USING (id)
    GROUP BY b.destination_id
  )
    SELECT (SELECT count(*)::int FROM ballot) AS original_votes,
           (SELECT count(DISTINCT id)::int FROM flagged) AS excluded,
           (SELECT count(*)::int FROM ballot) - (SELECT count(DISTINCT id)::int FROM flagged) AS remaining,
           md5(concat($1::timestamptz AT TIME ZONE 'UTC', '|', $2::text[], '|',
              (SELECT string_agg(id::text || ':' || reason, ',' ORDER BY id, reason) FROM flagged))) AS fingerprint,
           (SELECT json_agg(json_build_object('title', d.title, 'id', d.id,
               'original_votes', coalesce(t.original_votes, 0), 'excluded', coalesce(t.excluded, 0),
               'remaining', coalesce(t.original_votes - t.excluded, 0))
               ORDER BY coalesce(t.original_votes - t.excluded, 0) DESC, d.display_order, d.id)
            FROM destinations d LEFT JOIN totals t ON t.destination_id = d.id WHERE d.is_active) AS destinations`,
    values,
  );

  let inserted = 0;
  if (approval) {
    if (summary.fingerprint !== approval.fingerprint)
      throw new Error(
        'The preview changed. Review the new preview before applying.',
      );
    [{ inserted }] = await tx.query<{ inserted: number }[]>(
      `${scenarioB}, saved AS (
      INSERT INTO vote_disqualifications (vote_id, reason, cutoff_at, disqualified_by)
      SELECT id, reason, $1, $3 FROM flagged
      ON CONFLICT (vote_id, reason) DO NOTHING
      RETURNING vote_id
    ) SELECT count(*)::int AS inserted FROM saved`,
      [...values, approval.actor],
    );
  }
  return { mode: approval ? 'apply' : 'preview', cutoff, ...summary, inserted };
}

async function lockReview(tx: EntityManager): Promise<void> {
  await tx.query(
    `SELECT pg_advisory_xact_lock(hashtextextended('vote-disqualification-review', 0))`,
  );
}

function parseDomain(value: string): string {
  const domain = value.trim().toLowerCase();
  if (
    !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(
      domain,
    )
  )
    throw new Error(`Invalid domain: ${value}`);
  return domain;
}

async function restoreDomain(
  tx: EntityManager,
  domain: string,
  actor: string,
  note: string,
) {
  await lockReview(tx);
  const [summary] = await tx.query<{ restored: number }[]>(
    `
    WITH restored AS (
      UPDATE vote_disqualifications decision
      SET restored_at = CURRENT_TIMESTAMP, restored_by = $2, restoration_note = $3
      FROM votes v JOIN users u ON u.id = v.user_id
      WHERE v.id = decision.vote_id AND decision.reason = 'UNAPPROVED_DOMAIN'
        AND decision.restored_at IS NULL
        AND substring(lower(btrim(u.email)) from '@([^@]+)$') = $1
      RETURNING decision.vote_id
    ) SELECT count(*)::int AS restored FROM restored`,
    [domain, actor, note],
  );
  return { domain, ...summary };
}

async function main(args: string[]): Promise<void> {
  const [mode, value, ...rest] = args;
  if (mode === 'restore-domain') {
    const [actor, note] = rest;
    if (rest.length !== 2 || !actor?.trim() || !note?.trim())
      throw new Error('Usage: restore-domain <domain> <actor> <note>');
    const domain = parseDomain(value ?? '');
    await database.initialize();
    const result = await database.transaction((tx) =>
      restoreDomain(tx, domain, actor, note),
    );
    console.log(JSON.stringify(result));
    return;
  }
  if (
    (mode !== 'preview' && mode !== 'apply') ||
    !value ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) ||
    !Number.isFinite(Date.parse(value))
  )
    throw new Error(
      'Usage: preview <ISO cutoff> [domain ...] | apply <ISO cutoff> <fingerprint> <actor> [domain ...]',
    );

  let approval: { fingerprint: string; actor: string } | undefined;
  if (mode === 'apply') {
    const fingerprint = rest.shift();
    const actor = rest.shift();
    if (!fingerprint || !/^[\da-f]{32}$/.test(fingerprint) || !actor?.trim())
      throw new Error(
        'Apply requires the fingerprint from preview and the approver name.',
      );
    approval = { fingerprint, actor };
  }
  const domains = [...new Set(rest.map(parseDomain))].sort();
  await database.initialize();
  const result = await database.transaction('REPEATABLE READ', (tx) =>
    review(tx, value, domains, approval),
  );
  console.log(JSON.stringify(result, null, 2));
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (database.isInitialized) await database.destroy();
}
