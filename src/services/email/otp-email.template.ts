export function createOtpEmail(otp: string) {
  if (!/^\d{6}$/.test(otp)) {
    throw new Error('Invalid OTP email content');
  }

  return {
    subject: 'Mã xác thực đăng nhập | Du lịch Nông thôn',
    text: otp,
    html: `<p dir="ltr" style="margin:16px 0;font-family:monospace;font-size:32px;font-weight:700;letter-spacing:4px;">${otp}</p>`,
  };
}
