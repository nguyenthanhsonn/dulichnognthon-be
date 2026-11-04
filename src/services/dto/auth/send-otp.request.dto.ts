import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';
import { normalizePhone } from './phone.js';

export class SendOtpRequestDto {
  @Transform(({ value }: { value: unknown }) => normalizePhone(value))
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, {
    message:
      'phone phải là số điện thoại hợp lệ, ví dụ 0901234567 hoặc +84901234567',
  })
  phone: string;
}
