import type { Destination } from '../../../database/entities/voting.entities.js';

export class DestinationSummaryDto {
  id: string;
  title: string;
  slug: string;
  brief: string;
  province: string | null;
  thumbnailUrl: string | null;
  displayOrder: number;
}

export class DestinationMediaDto {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  caption: string | null;
  displayOrder: number;
}

export class DestinationDetailDto extends DestinationSummaryDto {
  detail: string;
  media: DestinationMediaDto[];
}

export class DestinationListDto {
  items: DestinationSummaryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Chọn field tường minh để API không vô tình trả toàn bộ entity/quan hệ. */
export function destinationSummary(
  destination: Destination,
): DestinationSummaryDto {
  return {
    id: destination.id,
    title: destination.title,
    slug: destination.slug,
    brief: destination.brief,
    province: destination.province,
    thumbnailUrl: destination.thumbnailUrl,
    displayOrder: destination.displayOrder,
  };
}
