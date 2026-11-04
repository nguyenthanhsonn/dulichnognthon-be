import { IsString, Matches } from 'class-validator';
import { SendOtpRequestDto } from './send-otp.request.dto.js';

export class VerifyOtpRequestDto extends SendOtpRequestDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'otp phải gồm đúng 6 chữ số' })
  otp: string;
}
