import type { DataSourceOptions } from 'typeorm';
import { votingEntities } from './entities/voting.entities.js';
import { InitVoting1793715300000 } from './migrations/1793715300000-init-voting.js';
import { AuthOtpPhone1793718000000 } from './migrations/1793718000000-auth-otp-phone.js';
import { AuthEmail1793757600000 } from './migrations/1793757600000-auth-email.js';
import { OtpResend1793800000000 } from './migrations/1793800000000-otp-resend.js';
import { UnlimitedVoting1793826000000 } from './migrations/1793826000000-unlimited-voting.js';
import { OtpFlows1793839000000 } from './migrations/1793839000000-otp-flows.js';

import { DestinationCards1793842000000 } from './migrations/1793842000000-destination-cards.js';
import { VoteDisqualifications1793843000000 } from './migrations/1793843000000-vote-disqualifications.js';
import { PublishedVoteResults1795669200000 } from './migrations/1795669200000-published-vote-results.js';
import { VotingReopening1795698000000 } from './migrations/1795698000000-voting-reopening.js';
import { VotingReopeningExtension1795699492000 } from './migrations/1795699492000-voting-reopening-extension.js';
import { ReplaceVotingReopening1795700200000 } from './migrations/1795700200000-replace-voting-reopening.js';
import { ExtendVotingReopening1795701200000 } from './migrations/1795701200000-extend-voting-to-2120.js';
import { FinalVotingReopening1795703400000 } from './migrations/1795703400000-final-voting-reopening.js';
import { EveningVotingReopening1795706100000 } from './migrations/1795706100000-evening-voting-reopening.js';
import { LateVotingReopening1795707030000 } from './migrations/1795707030000-late-voting-reopening.js';

export const DATABASE_POOL_SIZE = 10;

export function getDatabaseUrl(connectionString: string | undefined): string {
  const url = connectionString?.trim();
  if (!url) {
    throw new Error(
      'DATABASE_URL is required. Set it in .env before starting the app.',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }

  if (
    !['postgres:', 'postgresql:'].includes(parsed.protocol) ||
    !parsed.hostname ||
    !parsed.username ||
    parsed.pathname.length <= 1
  ) {
    throw new Error(
      'DATABASE_URL must use postgres:// or postgresql:// and include a host, username, and database name.',
    );
  }

  return url;
}
/** Cùng cấu hình cho Nest, CLI migration và kiểm thử; không tự sửa schema. */
export function createDatabaseOptions(
  connectionString: string | undefined,
): DataSourceOptions {
  const url = getDatabaseUrl(connectionString);
  const schema = new URL(url).searchParams.get('schema') ?? 'public';
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(schema)) {
    throw new Error(
      'Database schema must be a lowercase PostgreSQL identifier.',
    );
  }
  return {
    type: 'postgres',
    url,
    schema,
    entities: votingEntities,
    migrations: [
      InitVoting1793715300000,
      AuthOtpPhone1793718000000,
      AuthEmail1793757600000,
      OtpResend1793800000000,
      UnlimitedVoting1793826000000,
      OtpFlows1793839000000,
      DestinationCards1793842000000,
      VoteDisqualifications1793843000000,
      PublishedVoteResults1795669200000,
      VotingReopening1795698000000,
      VotingReopeningExtension1795699492000,
      ReplaceVotingReopening1795700200000,
      ExtendVotingReopening1795701200000,
      FinalVotingReopening1795703400000,
      EveningVotingReopening1795706100000,
      LateVotingReopening1795707030000,
    ],
    migrationsTableName: 'typeorm_migrations',
    migrationsTransactionMode: 'all',
    synchronize: false,
    migrationsRun: false,
    logging: false,
    uuidExtension: 'pgcrypto',
    installExtensions: false,
    poolSize: DATABASE_POOL_SIZE,
    connectTimeoutMS: 5000,
    // Raw query và QueryBuilder luôn thao tác trên cùng schema.
    extra: { options: `-c search_path=${schema}` },
  };
}
