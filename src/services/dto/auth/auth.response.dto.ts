export class UserResponseDto {
  id: string;
  email: string | null;
  createdAt: string;
}

export class SendOtpResponseDto {
  message: string;
  expiresIn: number;
  retryAfter: number;
}

export class TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  refreshExpiresIn: number;
  user: UserResponseDto;
}
