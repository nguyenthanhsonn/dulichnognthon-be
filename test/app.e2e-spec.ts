import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  INestApplication,
  Logger,
  Module,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DatabaseModule } from './../src/database/database.module.js';
import { AuthModule } from './../src/modules/auth.module.js';
import { DestinationModule } from './../src/modules/destination.module.js';
import { VotingModule } from './../src/modules/voting.module.js';
import { RankingModule } from './../src/modules/ranking.module.js';

// These tests cover HTTP behavior; they do not require a live database.
@Module({})
class TestDatabaseModule {}

@Controller('__test/errors')
class ErrorTestController {
  @Get('validation')
  validation(): never {
    throw new BadRequestException(['name is required', 'email is invalid']);
  }

  @Get('string')
  stringError(): never {
    throw new HttpException('Resource is gone', 410);
  }

  @Get('unexpected')
  unexpected(): never {
    throw new Error('secret database credentials');
  }

  @Get('unavailable')
  unavailable(): never {
    throw new HttpException('secret upstream details', 503);
  }
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ErrorTestController],
    })
      .overrideModule(DatabaseModule)
      .useModule(TestDatabaseModule)
      .overrideModule(AuthModule)
      .useModule(TestDatabaseModule)
      .overrideModule(DestinationModule)
      .useModule(TestDatabaseModule)
      .overrideModule(VotingModule)
      .useModule(TestDatabaseModule)
      .overrideModule(RankingModule)
      .useModule(TestDatabaseModule)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) includes a generated request ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .set('X-Request-Id', 'untrusted-client-value')
      .expect(200)
      .expect('Hello World!');
    expect(response.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/,
    );
  });

  it('formats 404 errors with a path without query parameters', async () => {
    const response = await request(app.getHttpServer())
      .get('/missing?token=private')
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      path: '/missing',
      requestId: response.headers['x-request-id'],
    });
    expect(new Date(response.body.timestamp).toISOString()).toBe(
      response.body.timestamp,
    );
  });

  it('preserves validation messages', async () => {
    const response = await request(app.getHttpServer())
      .get('/__test/errors/validation')
      .expect(400);
    expect(response.body.message).toEqual([
      'name is required',
      'email is invalid',
    ]);
  });

  it('preserves string HTTP exceptions', async () => {
    const response = await request(app.getHttpServer())
      .get('/__test/errors/string')
      .expect(410);
    expect(response.body.message).toBe('Resource is gone');
  });

  it.each([
    ['unexpected', 500],
    ['unavailable', 503],
  ])('hides internal details for %s errors', async (route, status) => {
    const log = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    try {
      const response = await request(app.getHttpServer())
        .get(`/__test/errors/${route}`)
        .expect(status);
      expect(response.body).toMatchObject({
        statusCode: status,
        message: 'Internal server error',
        requestId: response.headers['x-request-id'],
      });
      expect(JSON.stringify(response.body)).not.toContain('secret');
      expect(response.body).not.toHaveProperty('stack');
      expect(log).toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });

  afterEach(async () => {
    await app.close();
  });
});
