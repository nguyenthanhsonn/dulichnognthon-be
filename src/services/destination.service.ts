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
            .orWhere('destination.brief ILIKE :search', { search })
            .orWhere('destination.province ILIKE :search', { search }),
        ),
      );
    }
    const [destinations, total] = await query
      .orderBy('destination.displayOrder', 'ASC')
      .addOrderBy('destination.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      items: destinations.map(destinationSummary),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async detail(slug: string): Promise<DestinationDetailDto> {
    const destination = await this.database.getRepository(Destination).findOne({
      where: { slug, isActive: true },
      relations: { media: true },
      order: { media: { displayOrder: 'ASC', id: 'ASC' } },
    });
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
