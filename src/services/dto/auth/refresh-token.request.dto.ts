import { IsString, Matches } from 'class-validator';

export class RefreshTokenRequestDto {
  @IsString()
  @Matches(
    /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\.[A-Za-z0-9_-]{43}$/i,
    { message: 'refreshToken không hợp lệ' },
  )
  refreshToken: string;
}
