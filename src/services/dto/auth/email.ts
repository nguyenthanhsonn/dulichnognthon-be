/** Dùng cùng một cách chuẩn hóa tại DTO và service để khóa/rate limit nhất quán. */
export function normalizeEmail(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}
