import { ConfigService } from '@nestjs/config';
import { getVotingSettings } from './voting.config.js';

describe('Voting configuration', () => {
  it('keeps voting closed until the official schedule is configured', () => {
    expect(getVotingSettings(new ConfigService({}))).toMatchObject({
      startsAt: null,
      endsAt: null,
      maxVotesPerUser: 3,
      otpExpiresSeconds: 300,
      otpMaxAttempts: 3,
    });
  });

  it.each([
    { MAX_VOTES_PER_USER: '4' },
    { OTP_MAX_ATTEMPTS: '0' },
    { OTP_EXPIRES_SECONDS: 'invalid' },
    { VOTING_START_AT: '2026-11-05T00:00:00' },
    { VOTING_START_AT: '2026-11-05T00:00:00+07:00' },
    {
      VOTING_START_AT: '11/05/2026 00:00:00+07:00',
      VOTING_END_AT: '2026-11-20T00:00:00+07:00',
    },
    {
      VOTING_START_AT: '2026-02-30T00:00:00+07:00',
      VOTING_END_AT: '2026-11-20T00:00:00+07:00',
    },
    {
      VOTING_START_AT: '2026-11-05T24:00:00+07:00',
      VOTING_END_AT: '2026-11-20T00:00:00+07:00',
    },
    {
      VOTING_START_AT: '2026-11-20T00:00:00Z',
      VOTING_END_AT: '2026-11-05T00:00:00Z',
    },
  ])('rejects unsafe or incomplete configuration: %j', (values) => {
    expect(() => getVotingSettings(new ConfigService(values))).toThrow();
  });
});
