import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const rawDisposableDomains: string[] = require('disposable-email-domains');

/**
 * Danh sách bổ sung các tên miền email tạm thời phổ biến
 */
const EXTRA_DISPOSABLE_DOMAINS = [
  'anonmart.com',
  'temp-mail.io',
  'tempmail.com',
  'tmpmail.org',
  'tmpmail.net',
  'disposablemail.com',
  '10mail.org',
  'emailfake.com',
  'mohmal.im',
  'guerrillamailblock.com',
  'pokemail.net',
  'generator.email',
  'inboxkitten.com',
];

const DISPOSABLE_DOMAINS = new Set<string>([
  ...rawDisposableDomains,
  ...EXTRA_DISPOSABLE_DOMAINS,
]);

/**
 * Kiểm tra xem địa chỉ email có thuộc danh sách tên miền email tạm thời (disposable / temp-mail) hay không.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) return false;

  const domain = email
    .slice(atIndex + 1)
    .toLowerCase()
    .trim();
  if (!domain) return false;

  const parts = domain.split('.');
  // Kiểm tra domain và các subdomain (ví dụ sub.mailinator.com -> mailinator.com)
  for (let i = 0; i < parts.length - 1; i++) {
    const sub = parts.slice(i).join('.');
    if (DISPOSABLE_DOMAINS.has(sub)) {
      return true;
    }
  }

  return false;
}

/**
 * Danh sách domain cho phép áp dụng subaddressing (+alias)
 */
const SUBADDRESS_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
]);

/**
 * Dùng cùng một cách chuẩn hóa tại DTO và service để khóa/rate limit nhất quán.
 * - Loại bỏ khoảng trắng và chuyển chữ thường.
 * - Với Gmail/Googlemail: chuyển về @gmail.com, bỏ toàn bộ dấu chấm '.', bỏ alias sau dấu '+'.
 * - Với các nhà cung cấp hỗ trợ subaddressing (Outlook, iCloud...): loại bỏ alias sau dấu '+'.
 */
export function normalizeEmail(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) return trimmed;

  let localPart = trimmed.slice(0, atIndex);
  let domain = trimmed.slice(atIndex + 1);

  if (domain === 'googlemail.com') {
    domain = 'gmail.com';
  }

  if (domain === 'gmail.com') {
    // 1. Bỏ alias sau dấu cộng: user+anything -> user
    const plusIndex = localPart.indexOf('+');
    if (plusIndex !== -1) {
      localPart = localPart.slice(0, plusIndex);
    }
    // 2. Bỏ toàn bộ dấu chấm trong local part: u.s.e.r -> user
    localPart = localPart.replaceAll('.', '');
    return `${localPart}@gmail.com`;
  }

  if (SUBADDRESS_DOMAINS.has(domain)) {
    const plusIndex = localPart.indexOf('+');
    if (plusIndex !== -1) {
      localPart = localPart.slice(0, plusIndex);
    }
    return `${localPart}@${domain}`;
  }

  return `${localPart}@${domain}`;
}
