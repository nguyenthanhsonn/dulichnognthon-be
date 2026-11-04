import { type Type, ValidationPipe } from '@nestjs/common';

/** Chỉ nhận field khai báo trong DTO; không phụ thuộc metadata của test runner. */
export const dtoValidation = (expectedType: Type<unknown>) =>
  new ValidationPipe({
    expectedType,
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    validationError: { target: false, value: false },
  });
