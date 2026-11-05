import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, DataSource } from 'typeorm';
import { Destination } from '../database/entities/voting.entities.js';
import type { DestinationQueryDto } from './dto/destination/destination-query.dto.js';
import {
  destinationSummary,
  type DestinationDetailDto,
  type DestinationListDto,
} from './dto/destination/destination.response.dto.js';

@Injectable()
export class DestinationService {
  constructor(@Inject(DataSource) private readonly database: DataSource) {}

  async list({
    page,
    limit,
    keyword,
  }: DestinationQueryDto): Promise<DestinationListDto> {
    const query = this.database
      .getRepository(Destination)
      .createQueryBuilder('destination')
      .where('destination.isActive = :active', { active: true });
    if (keyword) {
      // Escape ký tự LIKE để từ khóa %/_ được tìm như nội dung thường; bind param chống SQL injection.
      const search = `%${keyword.replace(/[\\%_]/g, '\\$&')}%`;
      query.andWhere(
        new Brackets((part) =>
          part
            .where('destination.title ILIKE :search', { search })
            .orWhere('destination.shortTitle ILIKE :search', { search })
            .orWhere('destination.contestCode ILIKE :search', { search })
            .orWhere('destination.brief ILIKE :search', { search })
            .orWhere('destination.province ILIKE :search', { search }),
        ),
      );
    }
    // Lấy tổng trên tập đã lọc trước khi phân trang, trong cùng lượt đọc.
    const { entities: destinations, raw } = await query
      .select([
        'destination.id',
        'destination.title',
        'destination.contestCode',
        'destination.shortTitle',
        'destination.slug',
        'destination.brief',
        'destination.province',
        'destination.thumbnailUrl',
        'destination.displayOrder',
      ])
      .addSelect('COUNT(*) OVER ()', 'total_count')
      .orderBy('destination.displayOrder', 'ASC')
      .addOrderBy('destination.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawAndEntities<{ total_count: string }>();
    // Trang vượt phạm vi không có dòng để mang theo tổng.
    const total = raw.length
      ? Number(raw[0].total_count)
      : page === 1
        ? 0
        : await query.getCount();
    return {
      items: destinations.map(destinationSummary),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async detail(slug: string): Promise<DestinationDetailDto> {
    // Slug unique nên không cần LIMIT trên JOIN một-nhiều.
    const destination = await this.database
      .getRepository(Destination)
      .createQueryBuilder('destination')
      .leftJoinAndSelect('destination.media', 'media')
      .where('destination.slug = :slug AND destination.isActive = :active', {
        slug,
        active: true,
      })
      .orderBy('media.displayOrder', 'ASC')
      .addOrderBy('media.id', 'ASC')
      .getOne();
    if (!destination) throw new NotFoundException('Không tìm thấy điểm đến.');
    return Object.assign(destinationSummary(destination), {
      detail: destination.detail,
      media: destination.media.map((media) => ({
        id: media.id,
        mediaType: media.mediaType,
        mediaUrl: media.mediaUrl,
        caption: media.caption,
        displayOrder: media.displayOrder,
      })),
    });
  }
}
