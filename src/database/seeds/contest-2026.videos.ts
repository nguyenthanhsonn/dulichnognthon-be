// Số thứ tự là số bài thi trong tài liệu gốc, không phải thứ tự truy vấn database.
export const contestVideoLinks = [
  'https://vimeo.com/1243184146/c3ed6d3e14?fl=ip&fe=ec',
  'https://vimeo.com/1242864293?fl=ip&fe=ec',
  'https://vimeo.com/1242865475?fl=ip&fe=ec',
  'https://vimeo.com/1242888337?fl=ip&fe=ec',
  'https://vimeo.com/1242866144?fl=ip&fe=ec',
  'https://vimeo.com/1242903358?fl=ip&fe=ec',
  'https://vimeo.com/1242903360?fl=ip&fe=ec',
  'https://vimeo.com/1242903359?fl=ip&fe=ec',
  'https://vimeo.com/1243132603?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243132606?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243132605?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243147658?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243132752?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243133252?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243134240?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243133223?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243133222?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243133225?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243133224?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243133460?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243148544?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243134240?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243133573?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243133572?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243133653?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243133650?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243133815?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243136295?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243134025?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243134026?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243134028?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243134027?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243134411?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243134408?fl=ip&fe=ec&share=copy',
  'https://vimeo.com/1243134409?fl=ip&fe=ec&share=copy',
] as const;

/** Bỏ tham số tracking, giữ hash truy cập video unlisted; đổi link manage sang link xem. */
export function normalizeVimeoUrl(input: string): string {
  const url = new URL(input);
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'vimeo.com' ||
    url.username ||
    url.password ||
    url.port
  ) {
    throw new Error('Expected an HTTPS Vimeo video URL.');
  }
  const path = url.pathname.replace(/^\/manage\/videos\//, '/');
  if (!/^\/\d+(?:\/[a-zA-Z0-9]+)?\/?$/.test(path)) {
    throw new Error('Invalid Vimeo video path.');
  }
  return `https://vimeo.com${path.replace(/\/$/, '')}`;
}
