import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength } from 'class-validator';
import { normalizeEmail } from './email.js';
import { IsNotDisposableEmail } from './is-not-disposable-email.decorator.js';

export class SendOtpRequestDto {
  @Transform(({ value }: { value: unknown }) => normalizeEmail(value))
  @IsString()
  @IsEmail({}, { message: 'email phải là địa chỉ email hợp lệ' })
  @IsNotDisposableEmail({
    message:
      'Hệ thống không chấp nhận địa chỉ email tạm thời. Vui lòng sử dụng email cá nhân chính chủ.',
  })
  @MaxLength(254)
  email: string;
}
