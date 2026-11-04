import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength } from 'class-validator';
import { normalizeEmail } from './email.js';

export class SendOtpRequestDto {
  @Transform(({ value }: { value: unknown }) => normalizeEmail(value))
  @IsString()
  @IsEmail({}, { message: 'email phải là địa chỉ email hợp lệ' })
  @MaxLength(254)
  email: string;
}
