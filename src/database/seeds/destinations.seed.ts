import type { DataSource } from 'typeorm';
import { Destination, DestinationMedia } from '../entities/voting.entities.js';

// Dữ liệu minh họa, không đại diện cho danh sách điểm đến dự thi chính thức.
const samples = [
  {
    slug: 'demo-lang-xanh',
    title: '[Demo] Làng Xanh',
    province: 'Tỉnh mẫu A',
    brief: 'Trải nghiệm nông nghiệp và đời sống làng quê.',
    detail: '# Làng Xanh\n\nNội dung mẫu để phát triển giao diện.',
  },
  {
    slug: 'demo-ban-may',
    title: '[Demo] Bản Mây',
    province: 'Tỉnh mẫu B',
    brief: 'Khám phá văn hóa cộng đồng và cảnh quan nông thôn.',
    detail: '# Bản Mây\n\nThay bằng nội dung chính thức trước khi công bố.',
  },
  {
    slug: 'demo-vuon-mua-thu',
    title: '[Demo] Vườn Mùa Thu',
    province: 'Tỉnh mẫu C',
    brief: 'Tham quan vườn và tìm hiểu sản phẩm địa phương.',
    detail: '# Vườn Mùa Thu\n\nDữ liệu minh họa cho trang chi tiết.',
  },
];

/** Chạy lặp an toàn: chỉ thêm slug demo chưa có, không sửa dữ liệu đang sử dụng. */
export async function seedDestinations(database: DataSource) {
  return database.transaction(async (tx) => {
    let insertedDestinations = 0;
    for (const [index, sample] of samples.entries()) {
      const thumbnailUrl = `https://placehold.co/1200x800?text=Demo+${index + 1}`;
      const result = await tx
        .createQueryBuilder()
        .insert()
        .into(Destination)
        .values({
          ...sample,
          thumbnailUrl,
          displayOrder: index + 1,
          isActive: true,
        })
        .orIgnore()
        .returning('id')
        .execute();
      const rows = result.raw as { id: string }[];
      if (!rows[0]) continue;
      await tx.insert(DestinationMedia, {
        destinationId: rows[0].id,
        mediaType: 'IMAGE',
        mediaUrl: thumbnailUrl,
        caption: 'Ảnh placeholder cho dữ liệu demo.',
        displayOrder: 1,
      });
      insertedDestinations++;
    }
    return { insertedDestinations };
  });
}
