// Biểu thức dùng chung cho migration và truy vấn chạy thử trước khi migration được áp dụng.
export const canonicalGmailEmailSql = `CASE
  WHEN split_part(lower(btrim(email)), '@', 2) IN ('gmail.com', 'googlemail.com')
  THEN replace(split_part(split_part(lower(btrim(email)), '@', 1), '+', 1), '.', '') || '@gmail.com'
END`;
