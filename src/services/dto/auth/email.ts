import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const rawDisposableDomains: string[] = require('disposable-email-domains');

/**
 * Danh sách bổ sung các tên miền email tạm thời và tên miền bot buff đã phát hiện thực tế
 */
const KNOWN_BUFF_AND_DISPOSABLE_DOMAINS = [
  'anonmart.com',
  'mailforspam.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'mailinator.com',
  'haribu.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.info',
  'sharklasers.com',
  'grr.la',
  'temp-mail.org',
  '10minutemail.com',
  'mohmal.com',
  'duck.com',
  'mozmail.com',
  'relay.firefox.com',
  'simplelogin.com',
  'simplelogin.co',
  'simplelogin.io',
  'aleeas.com',
  'slmail.me',
  'mail10p.com',
  'vietmail.cloud',
  'dustmail.net',
  'dustmail.pro',
  'dustmail.online',
  'fldubai.com',
  'euploading.com',
  'andesco.vn',
  'veangiang.com',
  'catnhapkhaucampuchia.com',
  'ivn.one',
  'ideciphera.com',
  'captreonuicam.vn',
  'hoangxbt.com',
  'kienbac.pro',
  'hugeapi.net',
  'flashpage.net',
  'checkhub.org',
  'thaingocland.com',
  'emailracc.com',
  'accclone.com',
  'nick-ao.com',
  '123clone.com',
  'botgetlink.com',
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
  'tmailor.net',
  'tempmailor.com',
  'cloudtempmail.net',
  'instaddr.uk',
  'instaddr.ch',
  'instaddr.win',
  'instmail.uk',
  'boxfi.uk',
  'hamham.uk',
  'meruado.uk',
  'adadad.uk',
  'bangban.uk',
  'nekosan.uk',
  'nanana.uk',
  'mail4.uk',
  'kywa.uk',
  'send4.uk',
  'otona.uk',
  'pngk.uk',
  'addrin.uk',
  'haren.uk',
  'sendapp.uk',
  'tenhub.uk',
  'emailgen.uk',
  'ccmail.uk',
  'maillog.uk',
  'choco.la',
  'mbox.re',
  'moimoi.re',
  'tapi.re',
  'mirai.re',
  'ichigo.me',
  'merry.pink',
  'cream.pink',
  'via.tokyo.jp',
  'eay.jp',
  'svk.jp',
  'neko2.net',
  'usako.net',
  'fuwamofu.com',
  'exdonuts.com',
  'macr2.com',
  'stayhome.li',
  'kbox.li',
  'kmail.li',
  'fuwa.li',
  'fuwa.be',
  'usbc.be',
  'kksm.be',
  'rapt.be',
  'kkmail.be',
  'kpost.be',
  'ponp.be',
  'quicksend.ch',
  'owleyes.ch',
  'digdig.org',
  'f5.si',
  'cubin.click',
  'simaenaga.com',
  'pertera.com',
  'soc123.net',
  'pithu.org',
  'dogclothing.org',
  'vinakop.com',
  'bombibi.com',
  'mokook.com',
  'photobrex.com',
  'routerboardvietnam.com',
  'mikfarm.com',
  'camera47.net',
  'chamconnho.com',
  'colaname.com',
  'colabeta.com',
  'tnbeta.com',
  'usdtbeta.com',
  'zefvo.com',
  'albill.com',
  'ket-qua.org',
  'tubeemail.com',
  'tiktakgrabber.com',
  'javadmin.com',
  'search4gpt.com',
  'zozozo123.com',
  'clockemail.com',
  'micropaste.com',
  'storebanme.com',
  'topdatamaster.com',
  'techusa.org',
  'nhmvn.com',
  'danlikenmedia.com',
  'jasrac-notice.com',
  'artegin.com',
  'bwingmedia.com',
  'freedomainmail.info',
  'freedomainmail.link',
  'jysnk.com',
  'nbasweeps.com',
  'tinpho.com',
  'evc.vn',
  'eacademia.uk',
  'jcaton.com',
  'mail123.fr',
  'maildrop.cc',
  'roomsranked.com',
  'marchslurp.com',
  'youxiang.dev',
  'linshiyou.com',
  'laoia.com',
  'sika3.com',
  'okiae.com',
];

function getBlockedDomains(): Set<string> {
  const set = new Set<string>([
    ...rawDisposableDomains,
    ...KNOWN_BUFF_AND_DISPOSABLE_DOMAINS,
  ]);

  // Hỗ trợ thêm domain bị chặn từ biến môi trường (phục vụ chặn nóng không cần build lại code)
  const envBlocked = process.env.BLOCKED_EMAIL_DOMAINS;
  if (envBlocked) {
    for (const dom of envBlocked.split(',')) {
      const clean = dom.trim().toLowerCase();
      if (clean) set.add(clean);
    }
  }
  return set;
}

const DISPOSABLE_DOMAINS = getBlockedDomains();

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

export const STANDARD_EMAIL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.com.vn',
  'ymail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
] as const;
const STANDARD_DOMAINS = new Set<string>(STANDARD_EMAIL_DOMAINS);

/**
 * Kiểm tra xem địa chỉ email có thuộc nhóm nhà cung cấp email cá nhân / tổ chức chính quy hay không.
 */
export function isStandardEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) return false;

  const domain = email
    .slice(atIndex + 1)
    .toLowerCase()
    .trim();
  if (!domain) return false;

  return (
    STANDARD_DOMAINS.has(domain) ||
    domain.endsWith('.edu.vn') ||
    domain.endsWith('.gov.vn')
  );
}

/**
 * Kiểm tra xem địa chỉ email có thuộc danh sách tên miền email tạm thời (disposable / temp-mail / bot) hay không.
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

  // Chế độ danh sách cho phép vẫn áp dụng danh sách chặn ở trên.
  return (
    process.env.REQUIRE_STANDARD_EMAIL_DOMAINS === 'true' &&
    !isStandardEmail(email)
  );
}

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
