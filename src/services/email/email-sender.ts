export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export interface OtpEmailContext {
  challengeId: string;
  expiresInSeconds: number;
}

export interface EmailSender {
  assertAvailable(): void;
  sendOtp(email: string, otp: string, context: OtpEmailContext): Promise<void>;
}
