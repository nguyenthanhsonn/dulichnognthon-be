import type { DataSourceOptions } from 'typeorm';
import { votingEntities } from './entities/voting.entities.js';
import { InitVoting1793715300000 } from './migrations/1793715300000-init-voting.js';
import { AuthOtpPhone1793718000000 } from './migrations/1793718000000-auth-otp-phone.js';
import { AuthEmail1793757600000 } from './migrations/1793757600000-auth-email.js';
import { OtpResend1793800000000 } from './migrations/1793800000000-otp-resend.js';
import { UnlimitedVoting1793826000000 } from './migrations/1793826000000-unlimited-voting.js';
import { OtpFlows1793839000000 } from './migrations/1793839000000-otp-flows.js';

import { DestinationCards1793842000000 } from './migrations/1793842000000-destination-cards.js';

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
    ],
    migrationsTableName: 'typeorm_migrations',
    migrationsTransactionMode: 'all',
    synchronize: false,
    migrationsRun: false,
    logging: false,
    uuidExtension: 'pgcrypto',
    installExtensions: false,
    poolSize: 10,
    connectTimeoutMS: 5000,
    // Raw query và QueryBuilder luôn thao tác trên cùng schema.
    extra: { options: `-c search_path=${schema}` },
  };
}
