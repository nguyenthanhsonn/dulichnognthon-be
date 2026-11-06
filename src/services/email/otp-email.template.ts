export function createOtpEmail(otp: string) {
  if (!/^\d{6}$/.test(otp)) {
    throw new Error('Invalid OTP email content');
  }

  return {
    subject: 'Mã xác thực đăng nhập | Du lịch Nông thôn',
    text: otp,
  };
}
