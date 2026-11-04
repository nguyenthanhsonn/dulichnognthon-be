/** Chuẩn hóa số Việt Nam 0xxx thành +84xxx; số quốc tế dùng E.164. */
export function normalizePhone(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const phone = value.trim().replace(/[\s().-]/g, '');
  return /^0\d{9}$/.test(phone) ? `+84${phone.slice(1)}` : phone;
}
