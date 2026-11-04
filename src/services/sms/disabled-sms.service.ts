import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { SmsSender } from './sms-sender.js';

/** Chưa tích hợp SMS: từ chối trước khi tạo challenge, không báo gửi thành công giả. */
@Injectable()
export class DisabledSmsService implements SmsSender {
  assertAvailable(): never {
    throw new ServiceUnavailableException(
      'Đăng nhập bằng SMS OTP tạm thời chưa được bật.',
    );
  }

  async sendOtp(): Promise<void> {
    this.assertAvailable();
  }
}
