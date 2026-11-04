import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';

/** UUID và thời điểm tạo dùng chung, do PostgreSQL sinh mặc định. */
abstract class CreatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}

abstract class UpdatedEntity extends CreatedEntity {
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}

/** Tài khoản theo email đã xác thực; phone chỉ giữ để bảo toàn dữ liệu cũ. */
@Entity({
  name: 'users',
  comment:
    'Người bình chọn; đăng nhập bằng email OTP, giữ dữ liệu phone cũ khi chuyển đổi.',
})
@Index('users_phone_key', ['phone'], { unique: true })
@Index('users_email_key', ['email'], { unique: true })
@Check(
  'users_email_normalized_check',
  `email IS NULL OR (email = lower(btrim(email)) AND email <> '')`,
)
@Check('users_identity_check', 'email IS NOT NULL OR phone IS NOT NULL')
export class User extends UpdatedEntity {
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Số điện thoại từ dữ liệu cũ, không còn dùng để đăng nhập OTP.',
  })
  phone: string | null;
  @Column({
    type: 'varchar',
    length: 254,
    nullable: true,
    comment:
      'Email đăng nhập đã chuẩn hóa lowercase/trim; chỉ gắn sau khi xác thực OTP.',
  })
  email: string | null;

  @Column({ name: 'is_blocked', type: 'boolean', default: false })
  isBlocked: boolean;

  @OneToMany(() => OtpCode, (otp) => otp.user)
  otpCodes: Relation<OtpCode[]>;
  @OneToMany(() => AuthSession, (session) => session.user)
  authSessions: Relation<AuthSession[]>;
  @OneToMany(() => Vote, (vote) => vote.user)
  votes: Relation<Vote[]>;
  @OneToMany(() => VoteAttempt, (attempt) => attempt.user)
  voteAttempts: Relation<VoteAttempt[]>;
}

/** Chỉ lưu hash OTP; xác thực phải kiểm tra hạn dùng, số lần thử và consumedAt. */
@Entity({
  name: 'otp_codes',
  comment: 'OTP có hạn dùng và số lần thử; chỉ lưu hash, không lưu mã thô.',
})
@Index('otp_codes_user_id_created_at_idx', ['userId', 'createdAt'])
@Index('otp_codes_expires_at_idx', ['expiresAt'])
@Index('otp_codes_phone_created_at_idx', ['phone', 'createdAt'])
@Index('otp_codes_email_created_at_idx', ['email', 'createdAt'])
@Check('otp_attempt_count_check', '"attempt_count" >= 0')
@Check(
  'otp_codes_email_normalized_check',
  `email IS NULL OR (email = lower(btrim(email)) AND email <> '')`,
)
@Check('otp_codes_identity_check', 'email IS NOT NULL OR phone IS NOT NULL')
export class OtpCode extends CreatedEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment:
      'Số điện thoại chuẩn hóa của challenge; user chỉ được tạo sau khi OTP đúng.',
  })
  phone: string | null;
  @Column({
    type: 'varchar',
    length: 254,
    nullable: true,
    comment: 'Email nhận OTP; challenge tồn tại trước khi tạo tài khoản.',
  })
  email: string | null;
  @Column({
    name: 'code_hash',
    type: 'varchar',
    length: 255,
    comment:
      'Hash OTP; backend phải kiểm tra expires_at, attempt_count và consumed_at khi xác thực.',
  })
  codeHash: string;
  @Column({ name: 'expires_at', type: 'timestamptz', precision: 6 })
  expiresAt: Date;
  @Column({ name: 'attempt_count', type: 'integer', default: 0 })
  attemptCount: number;
  @Column({
    name: 'consumed_at',
    type: 'timestamptz',
    precision: 6,
    nullable: true,
  })
  consumedAt: Date | null;

  @ManyToOne(() => User, (user) => user.otpCodes, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'otp_codes_user_id_fkey',
  })
  user: Relation<User> | null;
}

/** Lưu hash refresh token; revokedAt phục vụ đăng xuất, thu hồi và rotation. */
@Entity({
  name: 'auth_sessions',
  comment: 'Phiên đăng nhập; lưu hash refresh token và thời điểm thu hồi.',
})
@Index('auth_sessions_user_id_revoked_at_idx', ['userId', 'revokedAt'])
@Index('auth_sessions_expires_at_idx', ['expiresAt'])
export class AuthSession extends CreatedEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;
  @Column({
    name: 'refresh_token_hash',
    type: 'text',
    comment: 'Hash refresh token; rotation và thu hồi do backend thực hiện.',
  })
  refreshTokenHash: string;
  @Column({ name: 'expires_at', type: 'timestamptz', precision: 6 })
  expiresAt: Date;
  @Column({
    name: 'revoked_at',
    type: 'timestamptz',
    precision: 6,
    nullable: true,
  })
  revokedAt: Date | null;

  @ManyToOne(() => User, (user) => user.authSessions, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'auth_sessions_user_id_fkey',
  })
  user: Relation<User>;
}

/** Nội dung điểm đến; detail dùng Markdown, slug dùng cho URL công khai. */
@Entity({
  name: 'destinations',
  comment: 'Điểm đến dự thi, nội dung chi tiết có thể dùng Markdown.',
})
@Index('destinations_slug_key', ['slug'], { unique: true })
@Index('destinations_is_active_display_order_idx', ['isActive', 'displayOrder'])
export class Destination extends UpdatedEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;
  @Column({ type: 'varchar', length: 255 })
  slug: string;
  @Column({ type: 'text' })
  brief: string;
  @Column({ type: 'text' })
  detail: string;
  @Column({ type: 'varchar', length: 150, nullable: true })
  province: string | null;
  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl: string | null;
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder: number;

  @OneToMany(() => DestinationMedia, (media) => media.destination)
  media: Relation<DestinationMedia[]>;
  @OneToMany(() => Vote, (vote) => vote.destination)
  votes: Relation<Vote[]>;
  @OneToMany(() => VoteAttempt, (attempt) => attempt.destination)
  voteAttempts: Relation<VoteAttempt[]>;
}

/** Một điểm đến có nhiều ảnh/video; giữ VARCHAR và CHECK đúng bản thiết kế. */
@Entity({
  name: 'destination_media',
  comment: 'Hình ảnh/video của điểm đến, sắp theo display_order.',
})
@Index('destination_media_destination_id_display_order_idx', [
  'destinationId',
  'displayOrder',
])
@Check('destination_media_type_check', `"media_type" IN ('IMAGE', 'VIDEO')`)
export class DestinationMedia extends CreatedEntity {
  @Column({ name: 'destination_id', type: 'uuid' })
  destinationId: string;
  @Column({ name: 'media_type', type: 'varchar', length: 20 })
  mediaType: 'IMAGE' | 'VIDEO';
  @Column({ name: 'media_url', type: 'text' })
  mediaUrl: string;
  @Column({ type: 'text', nullable: true })
  caption: string | null;
  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder: number;

  @ManyToOne(() => Destination, (destination) => destination.media, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'destination_id',
    foreignKeyConstraintName: 'destination_media_destination_id_fkey',
  })
  destination: Relation<Destination>;
}

/** Bất biến qua trigger; tạo bằng VotesRepository để khóa user trước khi đếm. */
@Entity({
  name: 'votes',
  comment:
    'Bình chọn bất biến; tối đa 3 lượt/user, tạo qua transaction khóa user trong VotesRepository.',
})
@Index('votes_user_id_destination_id_key', ['userId', 'destinationId'], {
  unique: true,
})
@Index('votes_destination_id_idx', ['destinationId'])
export class Vote extends CreatedEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;
  @Column({ name: 'destination_id', type: 'uuid' })
  destinationId: string;

  @ManyToOne(() => User, (user) => user.votes, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'votes_user_id_fkey',
  })
  user: Relation<User>;
  @ManyToOne(() => Destination, (destination) => destination.votes, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'destination_id',
    foreignKeyConstraintName: 'votes_destination_id_fkey',
  })
  destination: Relation<Destination>;
}

/** Giữ audit khi xóa đối tượng qua SET NULL; không thay thế rate limiting. */
@Entity({
  name: 'vote_attempts',
  comment: 'Nhật ký thao tác, không thay thế rate limiting của backend.',
})
@Index('vote_attempts_user_id_created_at_idx', ['userId', 'createdAt'])
@Index('vote_attempts_destination_id_created_at_idx', [
  'destinationId',
  'createdAt',
])
@Index('vote_attempts_status_created_at_idx', ['status', 'createdAt'])
@Check('vote_attempts_status_check', `"status" IN ('SUCCESS', 'REJECTED')`)
export class VoteAttempt extends CreatedEntity {
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;
  @Column({ name: 'destination_id', type: 'uuid', nullable: true })
  destinationId: string | null;
  @Column({
    name: 'ip_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Hash IP đã tính tại backend, không lưu IP thô.',
  })
  ipHash: string | null;
  @Column({
    name: 'device_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Hash định danh thiết bị, không lưu fingerprint thô.',
  })
  deviceHash: string | null;
  @Column({ type: 'varchar', length: 20 })
  status: 'SUCCESS' | 'REJECTED';
  @Column({ type: 'varchar', length: 100, nullable: true })
  reason: string | null;

  @ManyToOne(() => User, (user) => user.voteAttempts, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'vote_attempts_user_id_fkey',
  })
  user: Relation<User> | null;
  @ManyToOne(() => Destination, (destination) => destination.voteAttempts, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'RESTRICT',
  })
  @JoinColumn({
    name: 'destination_id',
    foreignKeyConstraintName: 'vote_attempts_destination_id_fkey',
  })
  destination: Relation<Destination> | null;
}

export const votingEntities = [
  User,
  OtpCode,
  AuthSession,
  Destination,
  DestinationMedia,
  Vote,
  VoteAttempt,
];
