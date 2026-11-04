import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createDatabaseOptions } from './database.config.js';
import { votingEntities } from './entities/voting.entities.js';
import { VotesRepository } from './votes.repository.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...createDatabaseOptions(config.get<string>('DATABASE_URL')),
        retryAttempts: 3,
        retryDelay: 1000,
      }),
    }),
    TypeOrmModule.forFeature(votingEntities),
  ],
  providers: [VotesRepository],
  exports: [TypeOrmModule, VotesRepository],
})
export class DatabaseModule {}
