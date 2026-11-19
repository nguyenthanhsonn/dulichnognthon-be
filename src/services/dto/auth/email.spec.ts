import { describe, expect, it } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { isDisposableEmail, isStandardEmail, normalizeEmail } from './email.js';
import { SendOtpRequestDto } from './send-otp.request.dto.js';

describe('normalizeEmail', () => {
  it('trims whitespace and converts to lowercase', () => {
    expect(normalizeEmail('  User@Example.Com  ')).toBe('user@example.com');
  });

  it('normalizes Gmail addresses by removing dots and plus aliases', () => {
    expect(normalizeEmail('nguyen.son@gmail.com')).toBe('nguyenson@gmail.com');
    expect(normalizeEmail('n.g.u.y.e.n.s.o.n@gmail.com')).toBe(
      'nguyenson@gmail.com',
    );
    expect(normalizeEmail('nguyenson+buff1@gmail.com')).toBe(
      'nguyenson@gmail.com',
    );
    expect(normalizeEmail('n.g.u.y.e.n+buff99@gmail.com')).toBe(
      'nguyen@gmail.com',
    );
  });

  it('normalizes googlemail.com to gmail.com and strips dots/aliases', () => {
    expect(normalizeEmail('test.user+vote@googlemail.com')).toBe(
      'testuser@gmail.com',
    );
  });

  it('strips plus aliases for outlook/hotmail/icloud while preserving dots', () => {
    expect(normalizeEmail('user.name+alias@outlook.com')).toBe(
      'user.name@outlook.com',
    );
    expect(normalizeEmail('user+alias@hotmail.com')).toBe('user@hotmail.com');
    expect(normalizeEmail('user+test@icloud.com')).toBe('user@icloud.com');
  });

  it('keeps standard emails intact', () => {
    expect(normalizeEmail('voter-123@example.com')).toBe(
      'voter-123@example.com',
    );
  });

  it('handles non-string inputs safely', () => {
    expect(normalizeEmail(null)).toBeNull();
    expect(normalizeEmail(undefined)).toBeUndefined();
    expect(normalizeEmail(123)).toBe(123);
  });
});

describe('isStandardEmail', () => {
  it('identifies standard providers correctly', () => {
    expect(isStandardEmail('user@gmail.com')).toBe(true);
    expect(isStandardEmail('user@yahoo.com')).toBe(true);
    expect(isStandardEmail('user@outlook.com')).toBe(true);
    expect(isStandardEmail('user@hotmail.com')).toBe(true);
    expect(isStandardEmail('user@icloud.com')).toBe(true);
    expect(isStandardEmail('student@hust.edu.vn')).toBe(true);
    expect(isStandardEmail('officer@quangninh.gov.vn')).toBe(true);
  });

  it('rejects non-standard or foreign domains', () => {
    expect(isStandardEmail('bot@fldubai.com')).toBe(false);
    expect(isStandardEmail('bot@mailinator.com')).toBe(false);
  });
});

describe('isDisposableEmail', () => {
  it('detects common disposable email domains', () => {
    expect(isDisposableEmail('becobo2852@anonmart.com')).toBe(true);
    expect(isDisposableEmail('test@mailinator.com')).toBe(true);
    expect(isDisposableEmail('test@10minutemail.com')).toBe(true);
    expect(isDisposableEmail('test@guerrillamail.com')).toBe(true);
    expect(isDisposableEmail('test@temp-mail.org')).toBe(true);
    expect(isDisposableEmail('test@temp-mail.io')).toBe(true);
    expect(isDisposableEmail('test@tempmail.com')).toBe(true);
    expect(isDisposableEmail('test@tmpmail.org')).toBe(true);
    expect(isDisposableEmail('test@yopmail.com')).toBe(true);
  });

  it('detects actual bot domains from database audit', () => {
    expect(isDisposableEmail('bot@fldubai.com')).toBe(true);
    expect(isDisposableEmail('bot@euploading.com')).toBe(true);
    expect(isDisposableEmail('bot@andesco.vn')).toBe(true);
    expect(isDisposableEmail('bot@veangiang.com')).toBe(true);
    expect(isDisposableEmail('bot@catnhapkhaucampuchia.com')).toBe(true);
    expect(isDisposableEmail('bot@dustmail.net')).toBe(true);
    expect(isDisposableEmail('bot@dustmail.online')).toBe(true);
    expect(isDisposableEmail('bot@mail10p.com')).toBe(true);
    expect(isDisposableEmail('bot@vietnam1.mail10p.com')).toBe(true);
    expect(isDisposableEmail('bot@tiktok.mail10p.com')).toBe(true);
    expect(isDisposableEmail('bot@emailracc.com')).toBe(true);
    expect(isDisposableEmail('bot@accclone.com')).toBe(true);
  });

  it('detects subdomains of disposable email domains', () => {
    expect(isDisposableEmail('test@sub.mailinator.com')).toBe(true);
    expect(isDisposableEmail('test@sub.sub.mailinator.com')).toBe(true);
  });

  it('allows valid email providers and custom domains in default mode', () => {
    expect(isDisposableEmail('user@gmail.com')).toBe(false);
    expect(isDisposableEmail('user@yahoo.com')).toBe(false);
    expect(isDisposableEmail('user@outlook.com')).toBe(false);
    expect(isDisposableEmail('user@icloud.com')).toBe(false);
    expect(isDisposableEmail('user@company.com.vn')).toBe(false);
    expect(isDisposableEmail('voter@example.com')).toBe(false);
  });
});

describe('SendOtpRequestDto validation', () => {
  it('accepts valid email and applies normalization', async () => {
    const dto = plainToInstance(SendOtpRequestDto, {
      email: '  Nguyen.Son+Test@Gmail.com  ',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.email).toBe('nguyenson@gmail.com');
  });

  it('rejects disposable email addresses', async () => {
    const dto = plainToInstance(SendOtpRequestDto, {
      email: 'bot@mailinator.com',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints?.isNotDisposableEmail).toBe(
      'Hệ thống không chấp nhận địa chỉ email tạm thời. Vui lòng sử dụng email cá nhân chính chủ.',
    );
  });

  it('rejects actual bot domains from database', async () => {
    const dto = plainToInstance(SendOtpRequestDto, {
      email: 'bot@fldubai.com',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects invalid email formats', async () => {
    const dto = plainToInstance(SendOtpRequestDto, {
      email: 'not-an-email',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
