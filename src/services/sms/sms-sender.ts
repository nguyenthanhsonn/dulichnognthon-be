// Giữ giao diện gửi SMS độc lập để tích hợp nhà cung cấp sau.
export const SMS_SENDER = Symbol('SMS_SENDER');

export interface SmsSender {
  assertAvailable?(): void;
  sendOtp(phone: string, otp: string): Promise<void>;
}
