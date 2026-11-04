import { SendOtpRequestDto } from './send-otp.request.dto.js';

/** Cùng email validation; loại yêu cầu do endpoint quyết định, không nhận từ client. */
export class ResendOtpRequestDto extends SendOtpRequestDto {}
