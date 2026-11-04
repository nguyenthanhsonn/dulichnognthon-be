// Dùng lại entity TypeORM hiện có, không tạo thêm bảng hoặc định nghĩa trùng.
export {
  User,
  OtpCode,
  AuthSession,
} from '../database/entities/voting.entities.js';

export interface AccessClaims {
  sub: string;
  sid: string;
  type: 'access';
}
