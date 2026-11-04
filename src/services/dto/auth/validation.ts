import { type Type, ValidationPipe } from '@nestjs/common';

// expectedType giữ validation hoạt động cả khi test runner không emit metadata.
export const authDto = (expectedType: Type<unknown>) =>
  new ValidationPipe({
    expectedType,
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    validationError: { target: false, value: false },
  });
