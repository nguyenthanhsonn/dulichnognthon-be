// Dữ liệu từ tài liệu người dùng cung cấp; giữ nguyên tên/mã/địa chỉ và toàn văn.
// Chưa có ảnh/video. Không suy đoán tỉnh khi nguồn không nêu rõ.
export const contestSource = {
  url: 'https://docs.google.com/document/d/11gw7XpG78qNzzGM5q1OIpAfIGvjsn6j2/edit',
  reportDate: '2026-10-27',
  sourceModifiedAt: '2026-11-02T08:08:20.658Z',
  textSha256:
    '0d2ce5159fe36366deab553eae94f39c3a2caf92a70fa408fc4be243b3ce148e',
};

export interface ContestEntry {
  sourceOrder: number;
  sourceCode: string;
  title: string;
  address: string;
  slug: string;
  brief: string;
  detail: string;
  province: string | null;
}

export const contestEntries: ContestEntry[] = [
  {
    sourceOrder: 1,
    sourceCode: 'DLNT2026-001',
    title:
      'Làng văn hóa du lịch cộng đồng thôn Bản Khun, xã Bằng Lang, tỉnh Tuyên Quang',
    address: 'Thôn Bản Khun, xã Bằng Lang, tỉnh Tuyên Quang',
    slug: 'dlnt2026-001-lang-van-hoa-du-lich-cong-dong-thon-ban-khun-xa-bang-lang-tinh-tuyen-quang',
    brief:
      'Cảnh quan thung lũng nguyên sơ kết hợp không gian văn hóa bản Tày, Dao cổ truyền; trải nghiệm hát Then, đàn Tính, dệt thổ cẩm; chuỗi sản phẩm OCOP rượu ngô men lá, thịt trâu gác bếp, măng rừng và ẩm thực nếp nương phục vụ lưu trú homestay.',
    detail:
      '**Mã hồ sơ:** DLNT2026-001\n\n**Địa chỉ:** Thôn Bản Khun, xã Bằng Lang, tỉnh Tuyên Quang\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Cảnh quan thung lũng nguyên sơ kết hợp không gian văn hóa bản Tày, Dao cổ truyền; trải nghiệm hát Then, đàn Tính, dệt thổ cẩm; chuỗi sản phẩm OCOP rượu ngô men lá, thịt trâu gác bếp, măng rừng và ẩm thực nếp nương phục vụ lưu trú homestay.\n\nSự tham gia cộng đồng: Hợp tác xã/Tổ hợp tác du lịch cộng đồng điều phối; trên 30 hộ dân tham gia cung ứng dịch vụ buồng phòng, ẩm thực, tổ văn nghệ bản địa; cơ chế phân chia tour tuyến và doanh thu minh bạch giữa các gia đình đón khách và hộ phụ trợ.\n\nBền vững & Quản trị rủi ro: Quy chế hương ước giữ gìn kiến trúc nhà sàn gỗ lợp cọ, cấm bê tông hóa; định kỳ thu gom rác thải, xử lý nước thải sinh hoạt; tổ tự quản an ninh trật tự cơ sở và cam kết 100% hộ dân ký biên bản ATTP nguyên liệu sạch.\n\nXúc tiến & CĐS: Thiết lập Fanpage và kênh mạng xã hội quảng bá; điểm check-in có gắn mã QR thông tin văn hóa; triển khai quét mã QR thanh toán không tiền mặt và kết nối nhận khách qua Zalo/OTA.\n\nChủ thể; BQL và Điều hành làng văn hoá du lịch cộng đồng bản Kun\n\nQuy mô cộng đồng: 183 hộ\n\nSố hộ làm du lịch: 30 (16,4%)\n\nSố Lđ làm du lịch: 50\n\nHÌnh thành: 2021\n\nĐiểm nổi bật: Cảnh quan và hoạt động trải nghiệm\n\nTrò chơi dân gian\n\nThắng cảnh: Hang Bó Mì, Đồi cọ, Cầu tình yêu',
    province: 'Tuyên Quang',
  },
  {
    sourceOrder: 2,
    sourceCode: 'DLNT2026-002',
    title:
      'Nà Tông nước non đại ngàn, điểm đến du lịch nông thôn xanh (nộp lại do lần 1 gửi thiếu ảnh)',
    address: 'Thôn Nà Tông - xã Thượng Lâm - Tỉnh Tuyên Quang',
    slug: 'dlnt2026-002-na-tong-nuoc-non-dai-ngan-diem-den-du-lich-nong-thon-xanh-nop-lai-do-lan-1-gui-thieu-anh',
    brief:
      'Sản phẩm du lịch sinh thái nông nghiệp gắn với vùng hồ sinh thái Na Hang; trải nghiệm canh tác lúa nước, chèo kayak/thuyền nan, thưởng thức chè Shan tuyết cổ thụ OCOP 4 sao và đặc sản cá lăng nướng.',
    detail:
      '**Mã hồ sơ:** DLNT2026-002\n\n**Địa chỉ:** Thôn Nà Tông - xã Thượng Lâm - Tỉnh Tuyên Quang\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Sản phẩm du lịch sinh thái nông nghiệp gắn với vùng hồ sinh thái Na Hang; trải nghiệm canh tác lúa nước, chèo kayak/thuyền nan, thưởng thức chè Shan tuyết cổ thụ OCOP 4 sao và đặc sản cá lăng nướng.\n\nSự tham gia cộng đồng: Tổ hợp tác du lịch Na Tông vận hành; quy tụ hơn 40 hộ người Tày tham gia làm dịch vụ homestay, đội thuyền vận chuyển, hướng dẫn viên cộng đồng; tạo việc làm trực tiếp cho trên 70% lao động nữ và thanh niên địa phương.\n\nBền vững & Quản trị rủi ro: Thực hiện "du lịch không rác thải nhựa" vùng lòng hồ; 100% thuyền bè trang bị phao cứu sinh đạt chuẩn; định kỳ diễn tập cứu hộ sông nước, an toàn cháy nổ nhà sàn gỗ.\n\nXúc tiến & CĐS : Số hóa điểm đến qua bản đồ du lịch Tuyên Quang; toàn bộ homestay phủ sóng Wi-Fi miễn phí, tiếp nhận đặt phòng trực tuyến qua nền tảng số và thanh toán điện tử linh hoạt.\n\nChủ thể: Thôn Nà Tông -UBND xã Thượng Lâm\n\nQuy mô: 154 hộ (698 khẩu)\n\nDân tộc: 152 hộ (686 khẩu)\n\nSố hộ làm homestay: 20 hộ\n\nCông suất lưu trú: 450 khách\n\nNổi bật: 07 mô hình trải nghiệm, sinh thái cảnh quan, di sản kiến trúc nhà sàn',
    province: 'Tuyên Quang',
  },
  {
    sourceOrder: 3,
    sourceCode: 'DLNT2026-003',
    title:
      'Điểm du lịch cộng đồng gắn với trải nghiệm sinh thái nông nghiệp và bảo tồn văn hóa dân tộc Mông, tại Bản Lao Chải, xã Khun Há, tỉnh Lai Châu.',
    address: 'Tỉnh Lai Châu',
    slug: 'dlnt2026-003-diem-du-lich-cong-dong-gan-voi-trai-nghiem-sinh-thai-nong-nghiep-va-bao-ton-van-hoa-dan-toc-mong-tai-ban-lao-chai-xa-khun-ha-tinh-lai-chau',
    brief:
      'Bản Lao Chải phát triển du lịch cộng đồng gắn với trải nghiệm sinh thái nông nghiệp và bảo tồn văn hóa dân tộc Mông. Du khách có thể trekking qua ruộng bậc thang, trải nghiệm mùa vàng, lưu trú homestay, thưởng thức ẩm thực bản địa, thêu hoa văn, vẽ sáp ong, làm bánh giày, tìm hiểu nhạc cụ truyền thống và tắm lá thuốc…',
    detail:
      '**Mã hồ sơ:** DLNT2026-003\n\n**Địa chỉ:** Tỉnh Lai Châu\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Bản Lao Chải phát triển du lịch cộng đồng gắn với trải nghiệm sinh thái nông nghiệp và bảo tồn văn hóa dân tộc Mông. Du khách có thể trekking qua ruộng bậc thang, trải nghiệm mùa vàng, lưu trú homestay, thưởng thức ẩm thực bản địa, thêu hoa văn, vẽ sáp ong, làm bánh giày, tìm hiểu nhạc cụ truyền thống và tắm lá thuốc thảo mộc. Sự kết hợp giữa cảnh quan, nông nghiệp và văn hóa tạo nên sản phẩm du lịch giàu bản sắc.\n\nSự tham gia cộng đồng: Cộng đồng địa phương giữ vai trò chủ thể trong tổ chức và cung cấp dịch vụ du lịch. Hiện có 30 hộ tham gia trực tiếp, khoảng 80 hộ tham gia chuỗi cung ứng và khoảng 100 lao động trực tiếp, trong đó trên 60% là lao động nữ. Các hộ cung cấp dịch vụ lưu trú, ẩm thực, thổ cẩm, nông sản và trải nghiệm văn hóa, góp phần tạo sinh kế tại chỗ và nâng cao giá trị sản phẩm địa phương.\n\nBền vững và quản trị rủi ro: Điểm đến chú trọng bảo tồn nhà ở, cảnh quan bản làng, văn hóa truyền thống, thu gom rác và hạn chế nhựa dùng một lần. Năm 2026, Lao Chải được lựa chọn xây dựng mô hình du lịch cộng đồng không khói thuốc lá. Công tác quản lý định hướng bảo đảm an toàn thực phẩm, phòng cháy chữa cháy, an ninh và ứng phó các rủi ro vùng núi như mưa lớn, sạt lở, lũ quét.\n\nXúc tiến và chuyển đổi số: Lao Chải từng bước quảng bá qua mạng xã hội, bản đồ trực tuyến và thanh toán không dùng tiền mặt. Định hướng tiếp theo là hoàn thiện bản đồ số, mã QR, thư viện ảnh và video, kết nối nền tảng đặt phòng và doanh nghiệp lữ hành nhằm mở rộng thị trường, nâng cao nhận diện điểm đến.\n\nQuy mô cộng đồng: 284 hộ, 1.500 nhân khẩu (100% đồng bào Mông); diện tích khoảng 320 ha.\n\nSố hộ tham gia du lịch: 30 hộ trực tiếp; khoảng 80 hộ thuộc chuỗi cung ứng.\n\nSố lao động làm du lịch: 100 người trực tiếp (trên 60% là nữ).\n\nDịch vụ: 08 homestay (phục vụ trên 400 khách lưu trú/đêm); 01 hộ tắm lá thuốc; 11 hộ ẩm thực, giải khát; 10 hộ bán nông sản, thổ cẩm, quà lưu niệm.\n\nHình thành: Năm 2019 được công nhận điểm du lịch cấp tỉnh, khởi đầu với 03 hộ homestay.\n\nLượng khách: 29.400 lượt (2025); 31.225 lượt (9/2026).\n\nDoanh thu: 34,2 tỷ đồng (2025); 32,7 tỷ đồng (9/2026).\n\nĐiểm nổi bật: Ruộng bậc thang vùng núi Hoàng Liên Sơn (độ cao khoảng 1.200 m); văn hóa Mông, thêu hoa văn, vẽ sáp ong, ẩm thực mèn mén, bánh giày, tắm lá thuốc.\n\nSự kiện: Giải chạy “Dấu chân mùa vàng Khun Há 2026” trên cung đường 15 km.\n\nGiải thưởng: VITA Awards 2026 – “Điểm đến có sản phẩm du lịch có nội hàm văn hóa sâu sắc”.\n\nMô hình đặc trưng: Được lựa chọn xây dựng thí điểm khu du lịch cộng đồng không khói thuốc lá năm 2026.',
    province: 'Lai Châu',
  },
  {
    sourceOrder: 4,
    sourceCode: 'DLNT2026-004',
    title:
      'Điểm du lịch Sì Thâu Chải, tại Bản Sì Thâu Chải, xã Tả Lèng, tỉnh Lai Châu.',
    address: 'Tỉnh Lai Châu',
    slug: 'dlnt2026-004-diem-du-lich-si-thau-chai-tai-ban-si-thau-chai-xa-ta-leng-tinh-lai-chau',
    brief:
      'Sì Thâu Chải nổi bật với cảnh quan núi cao trên 1.400 m, khí hậu mát mẻ và bản sắc văn hóa dân tộc Dao. Các sản phẩm tiêu biểu gồm lưu trú homestay, thưởng thức ẩm thực bản địa, tìm hiểu nghề thêu dệt, nghề rèn, trang phục truyền thống, lễ hội Tủ Cải, nhảy lửa, trekking, leo núi và dù lượn. Sự kết hợp giữa trải nghiệm…',
    detail:
      '**Mã hồ sơ:** DLNT2026-004\n\n**Địa chỉ:** Tỉnh Lai Châu\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Sì Thâu Chải nổi bật với cảnh quan núi cao trên 1.400 m, khí hậu mát mẻ và bản sắc văn hóa dân tộc Dao. Các sản phẩm tiêu biểu gồm lưu trú homestay, thưởng thức ẩm thực bản địa, tìm hiểu nghề thêu dệt, nghề rèn, trang phục truyền thống, lễ hội Tủ Cải, nhảy lửa, trekking, leo núi và dù lượn. Sự kết hợp giữa trải nghiệm văn hóa và khám phá thiên nhiên tạo tiềm năng hình thành các chương trình du lịch đa dạng.\n\nSự tham gia cộng đồng: Theo hồ sơ, bản có 63 hộ dân, trong đó 40 hộ tham gia hoạt động du lịch và khoảng 120 lao động. Tổ hợp tác du lịch cộng đồng gồm 17 thành viên hỗ trợ phối hợp dịch vụ, kết nối các hộ và chia sẻ lợi ích. Người dân trực tiếp tham gia lưu trú, ẩm thực, giới thiệu văn hóa và phục vụ các hoạt động trải nghiệm, góp phần tạo việc làm và nâng cao thu nhập tại địa phương.\n\nBền vững và quản trị rủi ro: Điểm đến định hướng phát triển du lịch gắn với bảo tồn văn hóa Dao, giữ gìn cảnh quan và xây dựng môi trường xanh, sạch, đẹp. Công tác quản lý cần chú trọng vệ sinh môi trường, an toàn thực phẩm, phòng cháy chữa cháy, kiểm soát sức chứa và bảo đảm an toàn cho trekking, leo núi, dù lượn. Việc hoàn thiện quy chế phối hợp và phương án ứng phó rủi ro là cơ sở để phát triển lâu dài.\n\nXúc tiến và chuyển đổi số: Sì Thâu Chải định hướng quảng bá qua Facebook, TikTok, Zalo và các nền tảng số; cập nhật thông tin điểm đến, phát triển nội dung giới thiệu văn hóa, cảnh quan và dịch vụ. Đồng thời, tăng cường kết nối doanh nghiệp lữ hành, số hóa thông tin và nâng cao kỹ năng truyền thông cho người dân nhằm mở rộng thị trường, xây dựng thương hiệu du lịch cộng đồng.\n\nQuy mô cộng đồng: 63 hộ, 100% đồng bào Dao; diện tích tự nhiên 309 ha, độ cao trên 1.400 m.\n\nSố hộ tham gia du lịch: 40 hộ (khoảng 63,5% tổng số hộ); Tổ hợp tác du lịch cộng đồng có 17 thành viên.\n\nSố lao động làm du lịch: 120 người (9/2026).\n\nLưu trú: 20 hộ kinh doanh homestay, 120 phòng nghỉ; sức chứa khoảng 500 lượt khách/ngày.\n\nHình thành: Được UBND tỉnh Lai Châu công nhận điểm du lịch cộng đồng và chính thức hoạt động năm 2016.\n\nLượng khách: 45.000 lượt, trong đó 1.720 khách quốc tế (2025); 53.515 lượt, trong đó 2.290 khách quốc tế (9/2026).\n\nDoanh thu: 25,78 tỷ đồng (2025); 52,67 tỷ đồng (9/2026).\n\nThu nhập bình quân lao động: 8 triệu đồng/tháng (9/2026).\n\nĐiểm nổi bật: Bản vùng cao của người Dao, cảnh quan núi trên 1.400 m; lễ Tủ Cải, nhảy lửa, nghề thêu dệt và rèn; trekking, leo núi, dù lượn.\n\nSự kiện tiêu biểu: Được lựa chọn làm địa điểm tổ chức giải dù lượn quốc tế năm 2022.\n\nCông nhận tiêu biểu: Điểm du lịch cộng đồng Sì Thâu Chải đạt sản phẩm OCOP 3 sao năm 2024.\n\nChuyển đổi số: Năm 2026 triển khai mã QR thông tin cho 20 hộ kinh doanh homestay và dịch vụ.',
    province: 'Lai Châu',
  },
  {
    sourceOrder: 5,
    sourceCode: 'DLNT2026-005',
    title: 'Điểm đến du lịch Khu nghỉ dưỡng chăm sóc sức khỏe Đại Phú An',
    address: 'Thôn Mậu A 5, Xã Mậu A, tỉnh Lào Cai',
    slug: 'dlnt2026-005-diem-den-du-lich-khu-nghi-duong-cham-soc-suc-khoe-dai-phu-an',
    brief:
      'Tổ hợp du lịch chăm sóc sức khỏe (Wellness Tourism) chuyên sâu y học cổ truyền; hệ sinh thái vườn thảo dược hữu cơ, tắm thuốc trị liệu, xông hơi, châm cứu bấm huyệt; chuỗi sản phẩm OCOP tinh dầu thực vật và cao thảo dược dưỡng sinh.',
    detail:
      '**Mã hồ sơ:** DLNT2026-005\n\n**Địa chỉ:** Thôn Mậu A 5, Xã Mậu A, tỉnh Lào Cai\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Tổ hợp du lịch chăm sóc sức khỏe (Wellness Tourism) chuyên sâu y học cổ truyền; hệ sinh thái vườn thảo dược hữu cơ, tắm thuốc trị liệu, xông hơi, châm cứu bấm huyệt; chuỗi sản phẩm OCOP tinh dầu thực vật và cao thảo dược dưỡng sinh.\n\nSự tham gia cộng đồng: Doanh nghiệp liên kết với HTX dược liệu và hàng trăm hộ nông dân Tày, Dao; tạo việc làm ổn định cho hơn 60 lao động địa phương từ khâu trồng trọt, sơ chế nguyên liệu đến kỹ thuật viên trị liệu.\n\nBền vững & Quản trị rủi ro: Quy trình trồng trọt đạt chuẩn GACP-WHO khép kín, không hóa chất độc hại; hệ thống xử lý bã dược liệu và nước thải đạt chuẩn ISO; quy trình nghiêm ngặt về vệ sinh dịch tễ, an toàn trị liệu và ATTP dược trà.\n\nXúc tiến & CĐS : Hệ sinh thái website đa ngôn ngữ, hệ thống đặt lịch khám - nghỉ dưỡng trực tuyến tự động; truyền thông đa kênh chuyên đề du lịch chữa lành; tích hợp cổng thanh toán trực tuyến và thẻ số hóa dữ liệu khách hàng.\n\nQuy mô cộng đồng tại địa bàn: khoảng 2.150 hộ.\n\nSố nhóm hộ tham gia du lịch và chuỗi cung ứng: khoảng 25 nhóm hộ (9/2026).\n\nLao động tham gia du lịch: khoảng 60 người (9/2026).\n\nHình thành: Khu nghỉ dưỡng chính thức hoạt động từ năm 2018; kế thừa nền tảng nghề Y dược cổ truyền Đỗ Gia.\n\nLượng khách: 5.800 lượt, gồm 122 khách quốc tế (2025); 5.200 lượt, gồm 168 khách quốc tế (9/2026).\n\nThu nhập bình quân lao động: 8 triệu đồng/người/tháng (9/2026).\n\nĐiểm khác biệt: Chuỗi trải nghiệm khép kín từ vùng quế – dược liệu, chế biến tinh dầu đến chăm sóc sức khỏe, ẩm thực và nghỉ dưỡng theo thông điệp “Thân khỏe – Tâm an”.\n\nSản phẩm tiêu biểu: Tinh dầu thực vật, tinh dầu quế, tinh dầu sả chanh, các sản phẩm dược liệu; dịch vụ xông, tắm thảo dược, ngâm chân, dưỡng sinh, yoga và thiền.\n\nChứng nhận sản phẩm: Tinh dầu thực vật Đại Phú An và Tinh dầu Quế Đại Phú An đạt OCOP 4 sao năm 2026.\n\nĐặc trưng tài nguyên: Gắn với vùng quế Văn Yên và tri thức Y học cổ truyền; kết nối người trồng quế, dược liệu với trải nghiệm du lịch.',
    province: 'Lào Cai',
  },
  {
    sourceOrder: 6,
    sourceCode: 'DLNT2026-006',
    title: 'Điểm đến du lịch thôn Sả Xéng, xã Tả Phìn, tỉnh Lào Cai',
    address: 'Thôn Sả Xéng, xã Tả Phìn, tỉnh Lào Cai',
    slug: 'dlnt2026-006-diem-den-du-lich-thon-sa-xeng-xa-ta-phin-tinh-lao-cai',
    brief:
      'Sản phẩm văn hóa bản địa độc đáo của người Dao Đỏ và H’Mông; bài thuốc tắm ngâm thùng gỗ Pơ-mu bí truyền hơn 30 vị lá rừng; trải nghiệm may thêu thổ cẩm thủ công và trekking ruộng bậc thang, tu viện cổ.',
    detail:
      '**Mã hồ sơ:** DLNT2026-006\n\n**Địa chỉ:** Thôn Sả Xéng, xã Tả Phìn, tỉnh Lào Cai\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Sản phẩm văn hóa bản địa độc đáo của người Dao Đỏ và H’Mông; bài thuốc tắm ngâm thùng gỗ Pơ-mu bí truyền hơn 30 vị lá rừng; trải nghiệm may thêu thổ cẩm thủ công và trekking ruộng bậc thang, tu viện cổ.\n\nSự tham gia cộng đồng: HTX Thổ cẩm và HTX Du lịch Tả Phìn với gần 100 hộ dân tham gia; phân chia đều các tổ: tổ hái lá thuốc, tổ homestay, tổ dịch vụ văn nghệ dân gian; giải quyết sinh kế bền vững cho phụ nữ DTTS.\n\nBền vững & Quản trị rủi ro: Quy hoạch vùng khoanh nuôi cây thuốc tự nhiên, chống khai thác tận diệt; tổ đội phòng cháy chữa cháy rừng thường trực; tập huấn định kỳ vệ sinh an toàn thực phẩm và đảm bảo an ninh cho du khách quốc tế.\n\nXúc tiến & CĐS: Mã QR giới thiệu thông tin tại các điểm tham quan chính; phủ sóng thanh toán mã VietQR/MoMo tại các quầy thổ cẩm; liên kết bán gói trải nghiệm trên các sàn Booking, Agoda, mạng xã hội.\n\nChủ thể đại diện: UBND xã Tả Phìn\n\nQuy mô cộng đồng: 319 hộ (1.604 nhân khẩu)\n\nSố hộ làm du lịch: 312 hộ (97,8%)\n\nNổi bật: Độ cao 1.410 m so mặt biên, trải nghiệm thung lũng mây, cư dân người Dao đỏ, H Mông đen\n\nKhi thức dân tộc, nghệ thuật khắc bạc, lế hội, nghi lễ cấp sắc…',
    province: 'Lào Cai',
  },
  {
    sourceOrder: 7,
    sourceCode: 'DLNT2026-007',
    title: 'Khu bảo tồn làng nhà sàn dân tộc sinh thái Thái Hải',
    address: 'xóm Phú, xã Tân Cương, tỉnh Thái Nguyên',
    slug: 'dlnt2026-007-khu-bao-ton-lang-nha-san-dan-toc-sinh-thai-thai-hai',
    brief:
      'Làng du lịch cộng đồng sinh thái bảo tồn nguyên vẹn 30 nếp nhà sàn cổ Tày - Nùng; trải nghiệm văn hóa tâm linh, nghi thức then cúng, ẩm thực rượu men lá ủ chum và quy trình sao chè búp Tân Cương OCOP truyền thống.',
    detail:
      '**Mã hồ sơ:** DLNT2026-007\n\n**Địa chỉ:** xóm Phú, xã Tân Cương, tỉnh Thái Nguyên\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Làng du lịch cộng đồng sinh thái bảo tồn nguyên vẹn 30 nếp nhà sàn cổ Tày - Nùng; trải nghiệm văn hóa tâm linh, nghi thức then cúng, ẩm thực rượu men lá ủ chum và quy trình sao chè búp Tân Cương OCOP truyền thống.\n\nSự tham gia cộng đồng: Mô hình quản trị gia đình - bộ tộc độc đáo với hơn 100 thành viên 4 thế hệ cùng chung sống, làm việc và hưởng lợi tập thể; phân chia 5 ban chuyên môn phụ trách văn hóa, ẩm thực, vệ sinh, nông nghiệp và đón tiếp.\n\nBền vững & Quản trị rủi ro: Thực hiện tự cung tự cấp hữu cơ (rau xanh, lúa, gia cầm tự nuôi trồng khép kín); tuyệt đối không rác thải vô cơ vứt bừa bãi; hệ thống ao trữ nước và bể cứu hỏa bố trí đều quanh các nhà sàn gỗ.\n\nXúc tiến & CĐS: Fanpage, Kênh Youtube/TikTok cập nhật liên tục câu chuyện văn hóa Tày; bản đồ tham quan số hóa qua QR; tiếp cận đón các đoàn khách ngoại giao, học sinh - sinh viên và du khách quốc tế qua tiếp thị liên kết.\n\nChủ thể: Thôn Nà Tông -UBND xã Thượng Lâm\n\nGiải thường UNTourism 2022\n\n05 giải thưởng du lịch ASEAN\n\nCộng đồng: 40 hộ\n\nHộ làm du lich: 40 hộ (100%)\n\nLĐ làm du lịch: 46 người\n\nNổi bật: bảo tồn nhà sàn DT Tày\n\nTính cộng đồng cao, ăn ở, kiếm tiền tập trung\n\nHoạt đồng trải nghiệm',
    province: 'Thái Nguyên',
  },
  {
    sourceOrder: 8,
    sourceCode: 'DLNT2026-008',
    title: 'Làng văn hóa du lịch cộng đồng Quỳnh Sơn',
    address: 'Thôn Quỳnh Sơn, xã Bắc Sơn, tỉnh Lạng Sơn',
    slug: 'dlnt2026-008-lang-van-hoa-du-lich-cong-dong-quynh-son',
    brief:
      'Quần thể hơn 400 nóc nhà sàn ngói âm dương đồng nhất bên thung lũng lúa Bắc Sơn; lễ hội Lồng Tồng, làm bánh chưng đen; thưởng thức lợn quay mác mật OCOP giòn bì, rượu ngô men lá.',
    detail:
      '**Mã hồ sơ:** DLNT2026-008\n\n**Địa chỉ:** Thôn Quỳnh Sơn, xã Bắc Sơn, tỉnh Lạng Sơn\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Quần thể hơn 400 nóc nhà sàn ngói âm dương đồng nhất bên thung lũng lúa Bắc Sơn; lễ hội Lồng Tồng, làm bánh chưng đen; thưởng thức lợn quay mác mật OCOP giòn bì, rượu ngô men lá.\n\nSự tham gia cộng đồng : Tổ liên kết du lịch cộng đồng Quỳnh Sơn với hơn 15 hộ homestay đạt chuẩn và trên 30 hộ cung cấp nông sản sạch; đội thợ nướng lợn quay, đội làm bánh truyền thống tạo việc làm tại chỗ cho người dân nông nhàn.\n\nBền vững & Quản trị rủi ro: Nghị quyết cộng đồng gìn giữ mái ngói âm dương truyền thống; đường làng ngõ xóm đạt chuẩn NTM sáng - xanh - sạch; kiểm soát ATTP nguồn lợn quay bằng tem nhãn truy xuất nguồn gốc.\n\nXúc tiến & CĐS : Lắp đặt trạm Wi-Fi công cộng miễn phí tại Nhà văn hóa; số hóa tài liệu thuyết minh du lịch bằng bảng quét mã QR; phối hợp cùng các hãng lữ hành chào bán tour săn mây - mùa lúa chín trực tuyến.\n\nChủ thể: HTX Du lịch cộng đồng Quỳnh Sơn\n\nGiải thường du lịch UN Tourism 2025\n\nLượng khách: 115.000 (2025)\n\nDoanh thu: 57.000. triệu\n\nSố hộ làm du lịch: 12\n\nSố lao động tham gia: 315 người\n\nThu nhập bình quan: 15 triệu/tháng\n\nNổi bật: gìn giữ phong tục theo dòng họ\n\nTrải nghiệm nông thôn, cưỡi ngựa…',
    province: 'Lạng Sơn',
  },
  {
    sourceOrder: 9,
    sourceCode: 'DLNT2026-009',
    title: 'Làng du lịch cộng đồng Hữu Liên',
    address: 'xã Hữu Liên, tỉnh Lạng Sơn',
    slug: 'dlnt2026-009-lang-du-lich-cong-dong-huu-lien',
    brief:
      'Du lịch sinh thái dã ngoại thảo nguyên Đồng Lâm - hồ Nong Dùng; trải nghiệm cưỡi ngựa ngắm đồng cỏ, chèo kayak, cắm trại dã ngoại kết hợp ngủ nhà sàn người Dao/Tày; đặc sản OCOP nem nướng Hữu Lũng, măng ớt mác mật.',
    detail:
      '**Mã hồ sơ:** DLNT2026-009\n\n**Địa chỉ:** xã Hữu Liên, tỉnh Lạng Sơn\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch sinh thái dã ngoại thảo nguyên Đồng Lâm - hồ Nong Dùng; trải nghiệm cưỡi ngựa ngắm đồng cỏ, chèo kayak, cắm trại dã ngoại kết hợp ngủ nhà sàn người Dao/Tày; đặc sản OCOP nem nướng Hữu Lũng, măng ớt mác mật.\n\nSự tham gia cộng đồng: HTX Du lịch cộng đồng Hữu Liên điều phối hơn 25 hộ homestay; lập tổ xe ôm trung chuyển, tổ hướng dẫn viên bản địa, tổ chăn dắt ngựa chụp ảnh; đảm bảo chia đều lượt đón khách tránh cạnh tranh không lành mạnh.\n\nBền vững & Quản trị rủi ro: Quy chế kiểm soát xả rác tại thung lũng Đồng Lâm (du khách ký cam kết dọn sạch lều trại); phương án di dời người và tài sản khi nước dâng mùa lũ tại vùng ngập nước; an toàn áo phao tuyệt đối khi bơi thuyền.\n\nXúc tiến & CĐS: Cổng thông tin Fanpage cập nhật tình hình mực nước Đồng Lâm theo thời gian thực; số hóa bản đồ các điểm cắm trại; toàn bộ các điểm cung cấp dịch vụ sử dụng QR code thanh toán nhanh.\n\nChủ thể: HTX Du lịch - Dịch vụ Hữu Liên\n\nGiải thường du lịch ASEAN 2025\n\nQuy mô cộng đồng: 1.887 hộ\n\nSố hộ làm du lịch: 40 hộ\n\nSố LĐ làm du lịch: 400\n\nSố có sở lưu trú: 40 (28 đạt chuẩn)\n\nNổi bật: Trải nghiệm cảnh quan, nông nghiệp nông thôn, cưỡi ngựa…',
    province: 'Lạng Sơn',
  },
  {
    sourceOrder: 10,
    sourceCode: 'DLNT2026-010',
    title: 'Điểm du lịch đồi chè Long Cốc',
    address: 'Xã Long Cốc- tỉnh Phú Thọ',
    slug: 'dlnt2026-010-diem-du-lich-doi-che-long-coc',
    brief:
      'Tuyệt cảnh "ốc đảo chè" vùng trung du với hàng trăm đồi chè bát úp nhấp nhô; trải nghiệm hóa thân thợ hái chè cùng phụ nữ Mường, ngắm bình minh trên đồi chè; thưởng thức chè Đinh Bát Tiên OCOP, thịt chua Thanh Sơn và cá suối nướng.',
    detail:
      '**Mã hồ sơ:** DLNT2026-010\n\n**Địa chỉ:** Xã Long Cốc- tỉnh Phú Thọ\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Tuyệt cảnh "ốc đảo chè" vùng trung du với hàng trăm đồi chè bát úp nhấp nhô; trải nghiệm hóa thân thợ hái chè cùng phụ nữ Mường, ngắm bình minh trên đồi chè; thưởng thức chè Đinh Bát Tiên OCOP, thịt chua Thanh Sơn và cá suối nướng.\n\nSự tham gia cộng đồng: HTX Nông nghiệp và Du lịch Long Cốc liên kết hơn 50 hộ gia đình; hình thành các tổ: tổ hái và chế biến chè mẫu, tổ lưu trú homestay, tổ văn nghệ cồng chiêng Mường; tạo việc làm trực tiếp cho phụ nữ dân tộc.\n\nBền vững & Quản trị rủi ro: Chuyển đổi phương thức canh tác chè sang hữu cơ không thuốc bảo vệ thực vật độc hại; quy định đường dẫn lên đồi chè hạn chế phương tiện xả khói; rà soát an toàn sạt lở đồi dốc trong mùa mưa bão.\n\nXúc tiến & CĐS: Hình ảnh Long Cốc phủ sóng rộng khắp trên các nền tảng mạng xã hội và báo chí du lịch; tem QR code truy xuất nguồn gốc chè OCOP gắn với điểm du lịch; 100% homestay niêm yết giá và nhận cọc qua tài khoản số.\n\nQuy mô cộng đồng: hơn 2.000 hộ dân.\n\nSố hộ làm du lịch: 56 hộ; số lao động tham gia: 120 người (9/2026).\n\nHình thành du lịch: từ năm 2019.\n\nQuy mô vùng chè: khoảng 677 ha, trong đó 610 ha đang cho thu hoạch; hàng trăm đồi chè hình bát úp.\n\nLưu trú cộng đồng: 12 nhà sàn homestay; trên 50 nếp nhà sàn Mường được lưu giữ.\n\nVăn hóa đặc sắc: 57 nghệ nhân bảo tồn hát Ví, hát Rang, cồng chiêng, đâm đuống, chạm ống; trên 300 bộ trang phục Mường.\n\nLượng khách: 4.500 lượt (2025), trên 12.000 lượt (số liệu mốc 9/2026); khách quốc tế 900 lượt (mốc 9/2026).\n\nDoanh thu du lịch: 2.000 triệu đồng theo bảng số liệu mốc 9/2026; thu nhập bình quân lao động: 3,515 triệu đồng/người/tháng.\n\nSản phẩm OCOP: 01 sản phẩm chè 4 sao; 01 sản phẩm của tổ hợp tác 3 sao; 01 sản phẩm thịt chua 3 sao.\n\nĐiểm nổi bật: Săn mây, đón bình minh trên đồi chè, trải nghiệm hái - sao - thưởng chè; bản sắc văn hóa Mường và các địa danh Đình Măng, Giếng Tiên.',
    province: 'Phú Thọ',
  },
  {
    sourceOrder: 11,
    sourceCode: 'DLNT2026-011',
    title: 'Điểm du lịch văn hóa cộng đồng Hùng Lô',
    address: 'Tổ dân phố Hùng Lô, phường Vân Phú, tỉnh Phú Thọ',
    slug: 'dlnt2026-011-diem-du-lich-van-hoa-cong-dong-hung-lo',
    brief:
      'Du lịch di sản tâm linh gắn với Đình cổ 300 năm tuổi và hát Xoan Đất Tổ (Di sản UNESCO); tour trải nghiệm làng nghề mì gạo Hùng Lô truyền thống hơn 100 năm; ẩm thực bánh chưng dâng Vua, mì sợi OCOP nấu gà ri.',
    detail:
      '**Mã hồ sơ:** DLNT2026-011\n\n**Địa chỉ:** Tổ dân phố Hùng Lô, phường Vân Phú, tỉnh Phú Thọ\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch di sản tâm linh gắn với Đình cổ 300 năm tuổi và hát Xoan Đất Tổ (Di sản UNESCO); tour trải nghiệm làng nghề mì gạo Hùng Lô truyền thống hơn 100 năm; ẩm thực bánh chưng dâng Vua, mì sợi OCOP nấu gà ri.\n\nSự tham gia cộng đồng: Câu lạc bộ Hát Xoan làng Hùng Lô phối hợp cùng Hiệp hội Làng nghề mì gạo; thu hút hơn 30 hộ làm nghề mì mở cửa xưởng đón khách trải nghiệm; tạo thu nhập gia tăng cho các nghệ nhân cao tuổi và thanh thiếu niên hát Xoan.\n\nBền vững & Quản trị rủi ro: Không gian bảo tồn nghiêm ngặt kiến trúc gỗ đình làng; dây chuyền sấy mì năng lượng mặt trời giảm bụi bẩn, 100% xưởng sản xuất có giấy chứng nhận ATTP; hệ thống PCCC di tích lịch sử được kiểm tra thường xuyên.\n\nXúc tiến & CĐS: Đưa Hùng Lô vào tuyến City tour di sản Việt Trì; số hóa bài giới thiệu Hát Xoan và lịch sử Đình bằng mã QR đa ngữ; sản phẩm mì gạo Hùng Lô bán rộng rãi trên sàn TMĐT Shopee, TikTok Shop.\n\nQuy mô cộng đồng: Gần 2.000 hộ dân; số hộ tham gia du lịch: 20 hộ; số lao động trực tiếp: 60 người (9 tháng năm 2026).\n\nHình thành: Đón khách từ năm 2015; được công nhận điểm du lịch ngày 24/9/2021 (Quyết định 2406/QĐ-UBND).\n\nKhách du lịch: 12.500 lượt (2025); 8.000 lượt trong 9 tháng đầu năm 2026, gồm 400 lượt khách quốc tế.\n\nDi sản nổi bật: Đình Hùng Lô xây dựng năm 1697, được xếp hạng di tích quốc gia năm 1984; không gian thực hành Hát Xoan Phú Thọ.\n\nKiến trúc: Còn lưu giữ khoảng 50 ngôi nhà gỗ cổ và các nghi lễ, phong tục làng Việt vùng Đất Tổ.\n\nSản phẩm trải nghiệm: Hát Xoan tại đình cổ; thăm nhà cổ; trải nghiệm nghề sản xuất mì gạo, bánh chưng, bánh giầy làng Xốm.\n\nSản phẩm OCOP: Có 5 sản phẩm được công nhận; mì gạo sạch sợi nhỏ làng Hùng Lô đạt 5 sao (2025), mì gạo Hùng Lô loại đặc biệt đạt 4 sao (2025).\n\nCơ sở phục vụ: 3 nhà hàng, 86 cơ sở kinh doanh/mua sắm và 2 hướng dẫn viên được cấp thẻ tại điểm.\n\nXúc tiến, chuyển đổi số: Có mã QR thuyết minh tự động tại đình cổ Hùng Lô.',
    province: 'Phú Thọ',
  },
  {
    sourceOrder: 12,
    sourceCode: 'DLNT2026-012',
    title: 'Điểm du lịch sinh thái văn hóa Bản Meo',
    address: 'Thôn Nam Sơn, xã Nam Dương, thành phố Bắc Ninh',
    slug: 'dlnt2026-012-diem-du-lich-sinh-thai-van-hoa-ban-meo',
    brief:
      'Mô hình nông nghiệp trải nghiệm, dã ngoại nông thôn Bắc Bộ; các hoạt động be mương bắt cá, cấy lúa, nặn gốm, gói bánh phu thê và giao lưu hát Quan họ trên thuyền rồng; đặc sản ẩm thực nem Bùi, gà đồi, bánh đa nem truyền thống.',
    detail:
      '**Mã hồ sơ:** DLNT2026-012\n\n**Địa chỉ:** Thôn Nam Sơn, xã Nam Dương, thành phố Bắc Ninh\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Mô hình nông nghiệp trải nghiệm, dã ngoại nông thôn Bắc Bộ; các hoạt động be mương bắt cá, cấy lúa, nặn gốm, gói bánh phu thê và giao lưu hát Quan họ trên thuyền rồng; đặc sản ẩm thực nem Bùi, gà đồi, bánh đa nem truyền thống.\n\nSự tham gia cộng đồng: Doanh nghiệp du lịch hợp tác với Tổ khuyến nông xã và hơn 20 hộ nông dân; nông dân trực tiếp làm hướng dẫn viên nông nghiệp cho học sinh, phụ huynh trải nghiệm thực tế.\n\nBền vững & Quản trị rủi ro: Khu nông trại canh tác theo mô hình sinh thái hữu cơ (nói không với thuốc trừ sâu hóa học); bể lọc sinh học xử lý nước thải ao nuôi; trang bị đầy đủ cứu hộ đuối nước cho trẻ em tại các khu vực mương rãnh.\n\nXúc tiến & CĐS: Kênh truyền thông chuyên biệt cho du lịch học đường, team building; đặt tour và thanh toán trọn gói qua cổng số; ứng dụng QR check-in học tập tìm hiểu thế giới thực vật, côn trùng cho học sinh.\n\nQuy mô điểm đến: 9 ha; theo hồ sơ, cộng đồng tại bản có 25 hộ.\n\nHợp tác xã Du lịch Cộng đồng Bản Meo: 25 thành viên điều phối hoạt động.\n\nSố hộ tham gia du lịch và chuỗi cung ứng: 155 hộ (bao gồm các hộ liên kết ngoài bản); số lao động: 235 người trực tiếp và thời vụ (9 tháng 2026).\n\nHình thành: Bắt đầu đón khách từ năm 2022; được công nhận điểm du lịch ngày 25/6/2025 (Quyết định 371/QĐ-SVHTTDL).\n\nLượng khách: 10.400 lượt (2025); 14.000 lượt, trong đó có 320 lượt khách quốc tế (9 tháng năm 2026).\n\nDoanh thu du lịch: 950 triệu đồng (9 tháng năm 2026); thu nhập bình quân lao động du lịch: 12 triệu đồng/người/tháng.\n\nĐiểm nổi bật: Vườn vải thiều tại Bản Meo rộng hơn 2 ha, trải nghiệm thu hái trái cây; không gian nhà sàn, du lịch sinh thái và văn hóa cộng đồng.\n\nTuyến kết nối: Di tích quốc gia chùa Am Vãi, làng nghề Mỳ gạo Thủ Dương, nem ngựa Nam Dương và các sản phẩm OCOP địa phương.\n\nBản sắc văn hóa: Dân ca Sán Dìu là di sản văn hóa phi vật thể quốc gia; 56 lượt hoạt động văn hóa truyền thống trong 9 tháng năm 2026.\n\nChuyển đổi số: Có trang Du lịch Bản Meo và giới thiệu điểm đến qua mã QR; bản đồ số đang được xây dựng.',
    province: 'Bắc Ninh',
  },
  {
    sourceOrder: 13,
    sourceCode: 'DLNT2026-013',
    title: 'Làng du lịch cộng đồng Yên Đức',
    address: 'Khu Yên Đức 1, phường Hoàng Quế, thành phố Quảng Ninh',
    slug: 'dlnt2026-013-lang-du-lich-cong-dong-yen-duc',
    brief:
      'Không gian làng quê truyền thống châu thổ sông Hồng với cây đa, giếng nước, sân đình; thưởng thức biểu diễn múa rối nước tại thủy đình giữa hồ làng; trải nghiệm tát nước gàu sòng, giã gạo, thưởng thức xôi nếp quạt, chả mực OCOP Quảng Ninh.',
    detail:
      '**Mã hồ sơ:** DLNT2026-013\n\n**Địa chỉ:** Khu Yên Đức 1, phường Hoàng Quế, thành phố Quảng Ninh\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Không gian làng quê truyền thống châu thổ sông Hồng với cây đa, giếng nước, sân đình; thưởng thức biểu diễn múa rối nước tại thủy đình giữa hồ làng; trải nghiệm tát nước gàu sòng, giã gạo, thưởng thức xôi nếp quạt, chả mực OCOP Quảng Ninh.\n\nSự tham gia cộng đồng : Mô hình liên kết bền vững giữa Công ty Cổ phần Du thuyền Đông Dương và cộng đồng cư dân xã Yên Đức; hơn 70 hộ dân tham gia trực tiếp làm nghệ nhân múa rối, đội phục vụ tiệc quê, chủ nhà đón khách tham quan.\n\nBền vững & Quản trị rủi ro : Giữ gìn vệ sinh đường hoa, ngõ xóm kiểu mẫu; kiểm soát nghiêm ngặt vệ sinh an toàn thực phẩm theo tiêu chuẩn đón khách quốc tế cao cấp; xây dựng quỹ phúc lợi từ du lịch hỗ trợ người già neo đơn và trẻ em vượt khó tại làng.\n\nXúc tiến & CĐS : Tích hợp điểm đến vào chuỗi hành trình tour du lịch Hạ Long - Hà Nội của các hãng lữ hành quốc tế; hệ thống đánh giá dịch vụ du khách điện tử (Guest Feedback); phủ sóng thanh toán thẻ quốc tế và ví điện tử.\n\nChủ thể: Công ty TNHH Du lịch Làng quê Yên Đức\n\nQuy mô cộng đồng: 721 hộ\n\nSố hộ làm trực tiếp du lịch: 28 hộ\n\nSố hộ gián tiếp: 200 hộ\n\nTrải nghiệm: bắt cá, làm chổi rơm, thăm nhà cổ.\n\nĐịa danh: Chùa Cảnh Huống, Núi Thung\n\nNổi bật: nét văn hoá đồng bằng Bắc bộ',
    province: 'Quảng Ninh',
  },
  {
    sourceOrder: 14,
    sourceCode: 'DLNT2026-014',
    title: 'Điểm du lịch Làng nghề Khảm trai - Sơn mài Chuyên Mỹ',
    address: 'Xã Chuyên Mỹ, thành phố Hà Nội',
    slug: 'dlnt2026-014-diem-du-lich-lang-nghe-kham-trai-son-mai-chuyen-my',
    brief:
      'Du lịch làng nghề thủ công mỹ nghệ di sản khảm trai, xà cừ Chuôn Ngọ nghìn năm tuổi; trải nghiệm tự tay cưa, đục, mài ốc xà cừ dưới sự chỉ dẫn của nghệ nhân ưu tú; mua sắm đồ mỹ nghệ cao cấp, tranh gỗ chạm khảm ốc đỏ đạt chuẩn OCOP 4 - 5 sao.',
    detail:
      '**Mã hồ sơ:** DLNT2026-014\n\n**Địa chỉ:** Xã Chuyên Mỹ, thành phố Hà Nội\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc : Du lịch làng nghề thủ công mỹ nghệ di sản khảm trai, xà cừ Chuôn Ngọ nghìn năm tuổi; trải nghiệm tự tay cưa, đục, mài ốc xà cừ dưới sự chỉ dẫn của nghệ nhân ưu tú; mua sắm đồ mỹ nghệ cao cấp, tranh gỗ chạm khảm ốc đỏ đạt chuẩn OCOP 4 - 5 sao.\n\nSự tham gia cộng đồng : Hiệp hội Làng nghề khảm trai Chuôn Ngọ điều hành mạng lưới hơn 40 xưởng sản xuất lớn nhỏ đón khách; giải quyết việc làm cho hàng trăm lao động chạm khảm, đánh bóng tại gia đình.\n\nBền vững & Quản trị rủi ro: Quy hoạch hệ thống hút bụi xà cừ, máy lọc khí tại các xưởng nghề khép kín để bảo vệ sức khỏe thợ và môi trường khu dân cư; bảo đảm an toàn điện công nghiệp và công tác phòng cháy chữa cháy xưởng gỗ.\n\nXúc tiến & CĐS : Số hóa câu chuyện cụ tổ nghề Trương Công Thành qua video VR/AR; gian hàng làng nghề trên các sàn thương mại điện tử xuất khẩu quốc tế (Amazon, Etsy); mã QR định danh bảo hành sản phẩm mỹ nghệ.\n\nQuy mô cộng đồng: 2.817 hộ dân; phạm vi điểm đến khoảng 793 ha.\n\nSố hộ tham gia du lịch: 420 hộ; số lao động tham gia du lịch: 630 người (9/2026).\n\nHình thành: Hoạt động du lịch từ năm 2019; được UBND TP Hà Nội công nhận điểm du lịch làng nghề cấp thành phố ngày 25/10/2019 (QĐ 5927/QĐ-UBND).\n\nKết quả hoạt động: 1.750 lượt khách năm 2025; 1.570 lượt trong 9 tháng năm 2026, trong đó 100 lượt khách quốc tế.\n\nDoanh thu du lịch: 2.625 triệu đồng (2025); 2.041 triệu đồng (9 tháng năm 2026). Thu nhập bình quân lao động: 12 triệu đồng/người/tháng (9/2026).\n\nNét đặc trưng: Nghề khảm trai – sơn mài truyền thống gần 1.000 năm; sản phẩm thủ công mỹ nghệ từ gỗ, trai, ốc, sơn; kỹ thuật khảm và sơn mài tinh xảo.\n\nTrải nghiệm nổi bật: Tham quan xưởng sản xuất, giao lưu nghệ nhân, tìm hiểu và thử các công đoạn khảm trai – sơn mài; trưng bày, mua sắm sản phẩm làng nghề.\n\nKhông gian tham quan: Đền thờ Tổ nghề khảm trai, không gian làng cổ và các di tích, điểm văn hóa; kết nối trải nghiệm nông nghiệp tại vùng rau sạch.\n\nGhi nhận quốc tế: Theo hồ sơ, ngày 17/01/2026, Hội đồng Thủ công Thế giới (WCC) công nhận Chuyên Mỹ là thành viên Mạng lưới các Thành phố thủ công sáng tạo trên thế giới.\n\nChuyển đổi số: Sử dụng mã QR giới thiệu sản phẩm, di tích và thông tin tham quan; truyền thông trên website, mạng xã hội.',
    province: 'Hà Nội',
  },
  {
    sourceOrder: 15,
    sourceCode: 'DLNT2026-015',
    title: 'Tinh hoa làng nghề xã Lê Lợi',
    address: 'Xã Lê Lợi, tỉnh Hưng Yên',
    slug: 'dlnt2026-015-tinh-hoa-lang-nghe-xa-le-loi',
    brief:
      'Du lịch làng nghề truyền thống kết nối ba làng nghề chạm bạc Đồng Xâm, mây tre đan Thượng Hiền và lụa đũi Nam Cao; tổ chức trải nghiệm tìm hiểu kỹ thuật làm nghề, gặp gỡ nghệ nhân, tham quan nhà cổ và khám phá văn hóa địa phương. Sản phẩm nổi bật có chăn ga lụa đũi Nam Cao đạt OCOP 4 sao; nghề dệt đũi Nam Cao được ghi…',
    detail:
      '**Mã hồ sơ:** DLNT2026-015\n\n**Địa chỉ:** Xã Lê Lợi, tỉnh Hưng Yên\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch làng nghề truyền thống kết nối ba làng nghề chạm bạc Đồng Xâm, mây tre đan Thượng Hiền và lụa đũi Nam Cao; tổ chức trải nghiệm tìm hiểu kỹ thuật làm nghề, gặp gỡ nghệ nhân, tham quan nhà cổ và khám phá văn hóa địa phương. Sản phẩm nổi bật có chăn ga lụa đũi Nam Cao đạt OCOP 4 sao; nghề dệt đũi Nam Cao được ghi danh Di sản văn hóa phi vật thể quốc gia năm 2023.\n\nSự tham gia cộng đồng: Theo hồ sơ, khoảng 200 hộ tham gia hoạt động du lịch, với 500 lao động liên quan. Nghệ nhân, hộ sản xuất, hợp tác xã và người dân cùng tham gia hướng dẫn trải nghiệm, giới thiệu sản phẩm, cung cấp dịch vụ và truyền dạy nghề truyền thống, góp phần tạo sinh kế và mở rộng đầu ra cho sản phẩm địa phương.\n\nBền vững và quản trị rủi ro: Phát triển du lịch gắn với bảo tồn nghề truyền thống, gìn giữ nhà cổ, văn hóa làng quê và tri thức của nghệ nhân. Định hướng chú trọng vệ sinh môi trường, sử dụng nguyên liệu hợp lý, bảo đảm an toàn thực phẩm, phòng cháy chữa cháy và an toàn cho du khách khi trải nghiệm tại cơ sở sản xuất.\n\nXúc tiến và chuyển đổi số: Xây dựng thương hiệu chung “Tinh hoa làng nghề xã Lê Lợi”, quảng bá sản phẩm qua hội chợ, triển lãm và các kênh truyền thông. Tăng cường giới thiệu sản phẩm trên nền tảng số, ứng dụng Google Maps hỗ trợ tìm kiếm điểm đến, kết nối khách hàng và mở rộng thị trường tiêu thụ sản phẩm làng nghề.\n\nQuy mô: 8.300 hộ dân; 200 hộ tham gia du lịch, với 500 lao động.\n\nHình thành: Phát triển du lịch làng nghề từ năm 2021.\n\nĐiểm nổi bật: Kết nối ba làng nghề truyền thống: chạm bạc Đồng Xâm, mây tre đan Thượng Hiền và lụa đũi Nam Cao.\n\nGiá trị đặc trưng: Nghề dệt đũi Nam Cao có lịch sử hơn 400 năm, được ghi danh Di sản văn hóa phi vật thể quốc gia năm 2023; sản phẩm chăn ga lụa đũi đạt OCOP 4 sao. Du khách được trực tiếp trải nghiệm nghề và giao lưu với nghệ nhân.',
    province: 'Hưng Yên',
  },
  {
    sourceOrder: 16,
    sourceCode: 'DLNT2026-016',
    title: 'Khu Du lịch Hang Múa',
    address: 'Phường Hoa Lư, tỉnh Ninh Bình',
    slug: 'dlnt2026-016-khu-du-lich-hang-mua',
    brief:
      'Danh thắng sinh thái - check-in cảnh quan đỉnh núi Ngọa Long với 486 bậc đá uốn lượn nhìn toàn cảnh Di sản Tràng An - Tam Cốc; điểm nhấn đầm sen Bích Động dưới chân núi; ẩm thực OCOP dê núi 7 món, cơm cháy Ninh Bình nức tiếng.',
    detail:
      '**Mã hồ sơ:** DLNT2026-016\n\n**Địa chỉ:** Phường Hoa Lư, tỉnh Ninh Bình\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc : Danh thắng sinh thái - check-in cảnh quan đỉnh núi Ngọa Long với 486 bậc đá uốn lượn nhìn toàn cảnh Di sản Tràng An - Tam Cốc; điểm nhấn đầm sen Bích Động dưới chân núi; ẩm thực OCOP dê núi 7 món, cơm cháy Ninh Bình nức tiếng.\n\nSự tham gia cộng đồng : Doanh nghiệp phối hợp chặt chẽ với người dân thôn Khê Hạ; tuyển dụng hơn 80% lao động địa phương làm nhân viên vận hành, cứu hộ leo núi, làm vườn sen và chế biến ẩm thực đặc sản.\n\nBền vững & Quản trị rủi ro: Lan can bậc đá có lưới an toàn chống trơn trượt trên vách núi dựng đứng; chốt trực bảo hộ, cung cấp nước và cảnh báo thời tiết sấm sét cho du khách leo đỉnh; quy trình xử lý rác thải trên cao đưa xuống chân núi mỗi ngày.\n\nXúc tiến & CĐS : Cổng vé điện tử quét mã QR tự động chống ùn tắc; kênh truyền thông mạng xã hội đạt hàng triệu lượt tương tác của giới trẻ và khách quốc tế; tích hợp thanh toán số POS/QR đa phương thức.\n\nQuy mô: Diện tích 15.712 m²; hoạt động từ năm 2007; có 35 hộ tham gia và 62 lao động du lịch.\n\nĐiểm nhấn: Nằm trong vùng lõi Quần thể danh thắng Tràng An, nổi bật với hành trình chinh phục 486 bậc đá lên đỉnh Ngọa Long, ngắm toàn cảnh Tam Cốc và cánh đồng lúa.\n\nTrải nghiệm: Kết hợp tham quan đầm sen, cánh đồng lúa theo mùa, lưu trú sinh thái Hang Múa Ecolodge và thưởng thức ẩm thực địa phương.\n\nGiá trị riêng: Kết nối cảnh quan karst, di sản văn hóa – lịch sử Hoa Lư với du lịch nông nghiệp, nổi bật với tượng Rồng Chầu trên đỉnh núi và trải nghiệm ngắm cảnh từ trên cao.',
    province: 'Ninh Bình',
  },
  {
    sourceOrder: 17,
    sourceCode: 'DLNT2026-017',
    title: 'Làng nghề Sinh Dược',
    address: 'Phường Tây Hoa Lư, tỉnh Ninh Bình',
    slug: 'dlnt2026-017-lang-nghe-sinh-duoc',
    brief:
      'Du lịch nông nghiệp xanh gắn với hợp tác xã vùng trồng thảo dược bản địa; trải nghiệm tự làm xà bông thảo mộc Sinh Dược, ngâm chân muối khoáng trị liệu truyền thống; chuỗi sản phẩm OCOP danh tiếng: muối ngâm chân, tinh dầu, xà bông mướp đắng/bồ kết, cao thực vật.',
    detail:
      '**Mã hồ sơ:** DLNT2026-017\n\n**Địa chỉ:** Phường Tây Hoa Lư, tỉnh Ninh Bình\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch nông nghiệp xanh gắn với hợp tác xã vùng trồng thảo dược bản địa; trải nghiệm tự làm xà bông thảo mộc Sinh Dược, ngâm chân muối khoáng trị liệu truyền thống; chuỗi sản phẩm OCOP danh tiếng: muối ngâm chân, tinh dầu, xà bông mướp đắng/bồ kết, cao thực vật.\n\nSự tham gia cộng đồng : HTX Sinh Dược hoạt động theo Luật HTX với hơn 50 thành viên là nông dân địa phương; mô hình chuỗi giá trị: nông dân cung ứng dược liệu - HTX chế biến công nghệ - cộng đồng cùng làm du lịch trải nghiệm; trích lập quỹ phát triển cộng đồng bền vững.\n\nBền vững & Quản trị rủi ro: Canh tác dược liệu hoàn toàn không sử dụng thuốc trừ sâu hóa học; mô hình kinh tế tuần hoàn: bã thảo dược được ủ làm phân bón hữu cơ vi sinh bón lại cho cây thuốc; kiểm định chất lượng sản phẩm an toàn y tế nghiêm ngặt.\n\nXúc tiến & CĐS: 100% sản phẩm có tem chống hàng giả và mã QR truy xuất vùng trồng; phát triển hệ thống bán buôn - bán lẻ trên nền tảng thương mại điện tử đa kênh; ứng dụng hóa đơn điện tử, quản lý kho số và đặt lịch tour trải nghiệm trực tuyến\n\nQuy mô: Diện tích 5 ha; hoạt động du lịch từ năm 2014; có 30 hộ tham gia và 60 lao động.\n\nĐiểm nhấn: Làng nghề dưới chân núi Bái Đính, gắn với tri thức cây thuốc bản địa và truyền thuyết về Thiền sư, danh y Nguyễn Minh Không.\n\nTrải nghiệm: Tìm hiểu cây thuốc, tự làm xà phòng thảo dược, vẽ tranh lá bồ đề, làm đèn thủ công và trải nghiệm trò chơi dân gian.\n\nGiá trị riêng: Kết hợp thảo dược, nghề thủ công và văn hóa Hoa Lư; nổi bật với tranh lá bồ đề Vạn Hạnh đạt OCOP 5 sao cấp quốc gia.',
    province: 'Ninh Bình',
  },
  {
    sourceOrder: 18,
    sourceCode: 'DLNT2026-018',
    title:
      'Bản du lịch cộng đồng Hoa Tiến và Hành tình trải nghiệm Sen Quê Bác',
    address:
      'Bản Hoa Tiến, xã Châu Tiến và xóm Mậu Tài, xã Kim Liên, tỉnh Nghệ An',
    slug: 'dlnt2026-018-ban-du-lich-cong-dong-hoa-tien-va-hanh-tinh-trai-nghiem-sen-que-bac',
    brief:
      'Du lịch cộng đồng gắn với nghề dệt thổ cẩm truyền thống của đồng bào Thái; trải nghiệm dệt vải, trồng dâu nuôi tằm, tham quan cọn nước, nhà sàn, thưởng thức ẩm thực bản địa, dân ca, dân vũ và lễ hội truyền thống. Sản phẩm thổ cẩm đa dạng như khăn, túi, ví, váy, chăn, gối, đệm; kết nối trải nghiệm văn hóa với du lịch…',
    detail:
      '**Mã hồ sơ:** DLNT2026-018\n\n**Địa chỉ:** Bản Hoa Tiến, xã Châu Tiến và xóm Mậu Tài, xã Kim Liên, tỉnh Nghệ An\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch cộng đồng gắn với nghề dệt thổ cẩm truyền thống của đồng bào Thái; trải nghiệm dệt vải, trồng dâu nuôi tằm, tham quan cọn nước, nhà sàn, thưởng thức ẩm thực bản địa, dân ca, dân vũ và lễ hội truyền thống. Sản phẩm thổ cẩm đa dạng như khăn, túi, ví, váy, chăn, gối, đệm; kết nối trải nghiệm văn hóa với du lịch sinh thái và nông nghiệp.\n\nSự tham gia cộng đồng: 08 hộ kinh doanh du lịch cộng đồng, 35 lao động trực tiếp; người dân, nghệ nhân, hợp tác xã, đội văn nghệ và câu lạc bộ bảo tồn văn hóa cùng tham gia cung cấp dịch vụ, truyền dạy nghề, biểu diễn nghệ thuật và giới thiệu sản phẩm địa phương. Cộng đồng vừa bảo tồn bản sắc vừa tạo sinh kế từ du lịch.\n\nBền vững và quản trị rủi ro: Bảo tồn nghề dệt thổ cẩm được công nhận làng nghề năm 2010, duy trì nhà sàn truyền thống, lễ hội và tri thức bản địa. Điểm đến chú trọng gìn giữ cảnh quan sông suối, cánh đồng, phát triển trải nghiệm gắn với sản xuất nông nghiệp; đầu tư hạ tầng phục vụ du lịch, nâng cao chất lượng dịch vụ và bảo đảm an toàn cho du khách.\n\nXúc tiến và chuyển đổi số: Điểm du lịch cộng đồng Hoa Tiến được UBND tỉnh Nghệ An công nhận năm 2024; kết nối tham quan hang Bua, đền Chiêng Ngam, hang Thẩm Ồm để hình thành tour tuyến. Quảng bá nghề dệt, sản phẩm thổ cẩm và văn hóa Thái thông qua hoạt động đón khách, giao lưu văn nghệ, trưng bày sản phẩm và các chương trình xúc tiến du lịch.\n\nQuy mô: Hoa Tiến có khoảng 387 hộ dân, 8 hộ kinh doanh du lịch cộng đồng; Sen Quê Bác phát triển du lịch nông nghiệp gắn với HTX Nông nghiệp Sen Quê Bác.\n\nĐiểm nhấn: Kết hợp bản văn hóa người Thái với làng nghề dệt thổ cẩm truyền thống và hành trình trải nghiệm cây sen tại Kim Liên.\n\nTrải nghiệm đặc trưng: Dệt thổ cẩm, ở nhà sàn, thưởng thức ẩm thực Thái, tham gia hoạt động nông nghiệp; tham quan hơn 60 giống sen, làm trà sen và khám phá sản phẩm OCOP từ sen.\n\nGiá trị riêng: Kết nối bản sắc văn hóa dân tộc, nghề truyền thống và nông nghiệp với câu chuyện quê hương Chủ tịch Hồ Chí Minh, tạo hành trình trải nghiệm đa dạng mang dấu ấn xứ Nghệ.',
    province: 'Nghệ An',
  },
  {
    sourceOrder: 19,
    sourceCode: 'DLNT2026-019',
    title: 'Làng Tân Hóa',
    address: 'Thôn Tân Hóa, xã Kim Phú, tỉnh Quảng Trị',
    slug: 'dlnt2026-019-lang-tan-hoa',
    brief:
      'Du lịch nông thôn thích ứng thời tiết tại làng Tân Hóa, kết hợp khám phá hệ thống hang động Tú Làn – Hang Tiên, lưu trú tại nhà nổi Tân Hóa Homestay, nghỉ dưỡng Tú Làn Lodge và trải nghiệm ẩm thực tại nhà dân. Du khách có thể tìm hiểu đời sống người Nguồn, thưởng thức cơm Pồi, nghe điệu hò Thuốc cá và trải nghiệm sinh…',
    detail:
      '**Mã hồ sơ:** DLNT2026-019\n\n**Địa chỉ:** Thôn Tân Hóa, xã Kim Phú, tỉnh Quảng Trị\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch nông thôn thích ứng thời tiết tại làng Tân Hóa, kết hợp khám phá hệ thống hang động Tú Làn – Hang Tiên, lưu trú tại nhà nổi Tân Hóa Homestay, nghỉ dưỡng Tú Làn Lodge và trải nghiệm ẩm thực tại nhà dân. Du khách có thể tìm hiểu đời sống người Nguồn, thưởng thức cơm Pồi, nghe điệu hò Thuốc cá và trải nghiệm sinh hoạt nông nghiệp địa phương.\n\nSự tham gia cộng đồng: Theo hồ sơ, 150 hộ tham gia trực tiếp và gián tiếp vào hoạt động du lịch, với trên 170 lao động địa phương trực tiếp làm trợ lý an toàn hang động, porter, đầu bếp, lễ tân và phục vụ homestay. Mô hình liên kết giữa cộng đồng, chính quyền và Oxalis Adventure giúp tạo việc làm, tăng thu nhập và chuyển đổi sinh kế từ khai thác rừng sang dịch vụ du lịch.\n\nBền vững và quản trị rủi ro: Điểm đến nổi bật với mô hình nhà nổi thích ứng lũ lụt; hồ sơ ghi nhận 620 căn nhà nổi giúp người dân chủ động ứng phó thiên tai. Du lịch gắn với bảo vệ rừng, không săn bắt động vật hoang dã, kiểm soát sức chứa tour hang động và phối hợp chuyên gia khí hậu để dự báo thời tiết, vận hành an toàn.\n\nXúc tiến và chuyển đổi số: Tân Hóa được UN Tourism vinh danh là “Làng du lịch tốt nhất thế giới” năm 2023. Hình ảnh điểm đến được quảng bá qua phim ảnh và truyền thông quốc tế. Theo hồ sơ, 100% sản phẩm tour, homestay và dịch vụ ăn uống được tích hợp trên nền tảng đặt trực tuyến, kết hợp thanh toán không tiền mặt và bản đồ số.\n\nChủ thể: Làng Tân Hoá – UBND xã Kim Phú, Quảng Trị\n\nGiải thưởng UN Tourrism 2023\n\nQuy mô cộng động: 720 hộ (3.364 nhân khẩu)\n\nSố hộ làm du lịch: 170 hộ\n\nSố người làm du lịch: 170 lao động\n\nNổi bật: Làng du lịch thích ứng biến đổi khỉ hậu;\n\nTrải nghiệm nông nghiệp, nông thôn, homestay.',
    province: 'Quảng Trị',
  },
  {
    sourceOrder: 20,
    sourceCode: 'DLNT2026-020',
    title: 'Điểm du lịch cộng đồng Ngư Mỹ Thạnh',
    address: 'thôn Thạnh Lợi, xã Đan Điền, thành phố Huế',
    slug: 'dlnt2026-020-diem-du-lich-cong-dong-ngu-my-thanh',
    brief:
      'Du lịch cộng đồng gắn với hệ sinh thái đầm phá Tam Giang và đời sống làng chài Ngư Mỹ Thạnh. Trải nghiệm nổi bật gồm chợ nổi buổi sáng, ngắm bình minh, đi thuyền khám phá rừng ngập mặn, đánh bắt thủy sản cùng ngư dân, tham quan làng bích họa, trải nghiệm nông nghiệp và thưởng thức ẩm thực địa phương.',
    detail:
      '**Mã hồ sơ:** DLNT2026-020\n\n**Địa chỉ:** thôn Thạnh Lợi, xã Đan Điền, thành phố Huế\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch cộng đồng gắn với hệ sinh thái đầm phá Tam Giang và đời sống làng chài Ngư Mỹ Thạnh. Trải nghiệm nổi bật gồm chợ nổi buổi sáng, ngắm bình minh, đi thuyền khám phá rừng ngập mặn, đánh bắt thủy sản cùng ngư dân, tham quan làng bích họa, trải nghiệm nông nghiệp và thưởng thức ẩm thực địa phương.\n\nSự tham gia cộng đồng: Theo báo cáo, điểm đến có 300 hộ tham gia hoạt động du lịch, khoảng 1.200 lao động và Hợp tác xã Dịch vụ du lịch cộng đồng Tam Giang Quảng Lợi giữ vai trò liên kết. Người dân trực tiếp cung cấp dịch vụ thuyền, hướng dẫn trải nghiệm, chế biến ẩm thực và giới thiệu văn hóa, sinh kế địa phương.\n\nBền vững và quản trị rủi ro: Du lịch gắn với bảo vệ hệ sinh thái đầm phá, duy trì hơn 30 ha rừng ngập mặn, thu gom rác và hạn chế nhựa dùng một lần. Điểm đến chú trọng an toàn đường thủy, trang thiết bị cứu sinh, an toàn thực phẩm và phòng chống thiên tai. Giai đoạn 2015–2018, dự án hỗ trợ cộng đồng góp phần trồng rừng ngập mặn, tập huấn bảo vệ môi trường và cải thiện hạ tầng du lịch.\n\nXúc tiến và chuyển đổi số: Điểm du lịch được công nhận theo Quyết định số 1007/QĐ-UBND ngày 06/5/2023. Định hướng quảng bá qua mạng xã hội, video ngắn, bản đồ số, mã QR; kết nối doanh nghiệp lữ hành và các làng nghề, sản phẩm OCOP để mở rộng thị trường khách.\n\nQuy mô: 780 hộ dân, 300 hộ làm du lịch, 1.200 lao động tham gia.\n\nHình thành: Du lịch cộng đồng từ năm 2008; HTX thành lập năm 2021.\n\nĐiểm nổi bật: Chợ nổi họp từ 4–7 giờ sáng, làng bích họa, trải nghiệm đánh bắt cùng ngư dân, khám phá rừng ngập mặn hơn 30 ha.\n\nĐặc trưng: Kết hợp sinh thái phá Tam Giang, văn hóa làng chài và ẩm thực thủy sản địa phương.',
    province: 'Huế',
  },
  {
    sourceOrder: 21,
    sourceCode: 'DLNT2026-21',
    title: 'Du lịch sinh thái cộng đồng A Nôr',
    address: 'Thôn A Nôr, xã A Lưới 1, thành phố Huế',
    slug: 'dlnt2026-021-du-lich-sinh-thai-cong-dong-a-nor',
    brief:
      'Du lịch sinh thái cộng đồng Thác A Nôr kết hợp khám phá thác nước, suối tự nhiên, trải nghiệm gội đầu thảo mộc và tìm hiểu văn hóa Pa Cô. Du khách có thể thưởng thức ẩm thực địa phương, khám phá nghề dệt zèng, đan lát, nhạc cụ và các làn điệu dân ca truyền thống.',
    detail:
      '**Mã hồ sơ:** DLNT2026-21\n\n**Địa chỉ:** Thôn A Nôr, xã A Lưới 1, thành phố Huế\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch sinh thái cộng đồng Thác A Nôr kết hợp khám phá thác nước, suối tự nhiên, trải nghiệm gội đầu thảo mộc và tìm hiểu văn hóa Pa Cô. Du khách có thể thưởng thức ẩm thực địa phương, khám phá nghề dệt zèng, đan lát, nhạc cụ và các làn điệu dân ca truyền thống.\n\nSự tham gia cộng đồng: Theo hồ sơ, có 24 hộ tham gia hoạt động du lịch, với khoảng 40 lao động thường xuyên và bán thời gian. Hợp tác xã Du lịch sinh thái cộng đồng A Nôr được thành lập năm 2021, kết nối các hộ dân cung cấp dịch vụ lưu trú, ăn uống, hướng dẫn trải nghiệm và giới thiệu văn hóa bản địa, góp phần tạo việc làm, tăng thu nhập cho người dân.\n\nBền vững và quản trị rủi ro: Mô hình gắn phát triển du lịch với bảo vệ rừng, nguồn nước, cảnh quan thác suối và bảo tồn văn hóa Pa Cô. Điểm đến chú trọng vệ sinh môi trường, thu gom rác, gìn giữ nghề truyền thống và bảo đảm an toàn khi tắm suối, trekking; đồng thời cần chủ động ứng phó thời tiết bất lợi, lũ quét và sạt lở.\n\nXúc tiến và chuyển đổi số: Tăng cường quảng bá cảnh quan và văn hóa bản địa qua mạng xã hội, hình ảnh, video; kết nối doanh nghiệp lữ hành và các điểm du lịch lân cận để hình thành tour trải nghiệm. Hồ sơ định hướng ứng dụng công nghệ số trong giới thiệu sản phẩm, cung cấp thông tin và hỗ trợ đặt dịch vụ.\n\nQuy mô: 23 hộ dân với gần 69 nhân khẩu; 24 hộ tham gia du lịch, khoảng 40 lao động thường xuyên và bán thời gian.\n\nHình thành: Hợp tác xã Du lịch sinh thái cộng đồng A Nơr thành lập cuối năm 2021.\n\nĐiểm nổi bật: Kết hợp cảnh quan thác A Nơr, suối rừng Trường Sơn với trải nghiệm tắm suối, khám phá thiên nhiên, gội đầu thảo mộc và tìm hiểu văn hóa cộng đồng Pa Cô.\n\nGiá trị đặc trưng: Du lịch dựa trên tài nguyên thiên nhiên và bản sắc Pa Cô, với ẩm thực, nghề thủ công, dân ca, dân vũ và sự tham gia trực tiếp của người dân địa phương.',
    province: 'Huế',
  },
  {
    sourceOrder: 22,
    sourceCode: 'DLNT2026-022',
    title: 'Điểm đến du lịch nông thôn Sơn Tây Thượng',
    address: 'Xã Sơn Tây Thượng, tỉnh Quảng Ngãi',
    slug: 'dlnt2026-022-diem-den-du-lich-nong-thon-son-tay-thuong',
    brief:
      'Du lịch nông thôn Sơn Tây Thượng kết nối Chợ phiên, văn hóa Ca Dong, nông sản, ẩm thực và cảnh quan đại ngàn. Trải nghiệm nổi bật gồm giao lưu cồng chiêng, nhảy sạp, thưởng thức cơm lam, gà nướng, cá niên; khám phá hồ Đăkđrinh, suối Nước Tua và tìm hiểu 9 sản phẩm OCOP 3 sao của địa phương.',
    detail:
      '**Mã hồ sơ:** DLNT2026-022\n\n**Địa chỉ:** Xã Sơn Tây Thượng, tỉnh Quảng Ngãi\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch nông thôn Sơn Tây Thượng kết nối Chợ phiên, văn hóa Ca Dong, nông sản, ẩm thực và cảnh quan đại ngàn. Trải nghiệm nổi bật gồm giao lưu cồng chiêng, nhảy sạp, thưởng thức cơm lam, gà nướng, cá niên; khám phá hồ Đăkđrinh, suối Nước Tua và tìm hiểu 9 sản phẩm OCOP 3 sao của địa phương.\n\nSự tham gia cộng đồng: Theo hồ sơ, có 42 hộ tham gia tại phiên chợ gần nhất, đại diện 9 thôn, cùng 2 hợp tác xã và các tổ hợp tác; khoảng 200 lao động tham gia hoạt động du lịch. Người dân trực tiếp bán nông sản, chế biến ẩm thực, giới thiệu sản phẩm và thực hành văn hóa. Địa phương duy trì 11 câu lạc bộ cồng chiêng, góp phần trao truyền bản sắc Ca Dong giữa các thế hệ.\n\nBền vững và quản trị rủi ro: Phát triển du lịch gắn với bảo tồn văn hóa, bảo vệ rừng, hồ, suối và cảnh quan tự nhiên. Chợ phiên bố trí 10 thùng rác, 1 khu tập kết rác; hoạt động thu gom rác được thực hiện định kỳ. Công tác quản lý chú trọng an toàn thực phẩm, phòng cháy chữa cháy, an ninh trật tự và kiểm soát rủi ro khi tổ chức trải nghiệm tại khu vực tự nhiên.\n\nXúc tiến và chuyển đổi số: Tăng cường quảng bá Chợ phiên, nông sản, sản phẩm OCOP và văn hóa Ca Dong qua các kênh truyền thông địa phương. Điểm đến bước đầu ứng dụng mã QR trong thanh toán, khảo sát trực tuyến để tiếp nhận phản hồi; định hướng hoàn thiện bản đồ số, thông tin điểm đến và kết nối doanh nghiệp lữ hành nhằm mở rộng thị trường khách du lịch.\n\nQuy mô: 1.848 hộ dân, 7.627 nhân khẩu; đồng bào Ca Dong chiếm khoảng 92%; 42 hộ tham gia Chợ phiên, khoảng 200 lao động du lịch.\n\nĐiểm nhấn: Chợ phiên tổ chức định kỳ 2 lần/tháng, kết nối nông sản, ẩm thực, sản phẩm OCOP và giao lưu văn hóa cộng đồng.\n\nBản sắc: 11 câu lạc bộ cồng chiêng đang sinh hoạt, gắn với văn hóa Ca Dong; nổi bật với ẩm thực núi rừng như cơm lam, cá niên, ốc đá và gà nướng.\n\nTrải nghiệm riêng: Kết nối Chợ phiên với hồ thủy điện Đăkđrinh, suối Nước Tua, vườn cây và sinh kế nông nghiệp trong hành trình “Một ngày chạm Sơn Tây Thượng”.',
    province: 'Quảng Ngãi',
  },
  {
    sourceOrder: 23,
    sourceCode: 'DLNT2026-023',
    title:
      'Công viên di sản Làng Gò Cỏ của HTX Cộng đồng  điều phối Làng Gò Cỏ.',
    address: 'TDP Long Thạnh, phường Sa Huỳnh, Quảng Ngãi',
    slug: 'dlnt2026-023-cong-vien-di-san-lang-go-co-cua-htx-cong-dong-dieu-phoi-lang-go-co',
    brief:
      'Du lịch cộng đồng gắn với di sản văn hóa Sa Huỳnh – Chăm Pa – Đại Việt, trải nghiệm làm gốm tiền sử, làm muối trên trảng đá cổ, chèo thuyền nan, tìm hiểu nghề đánh bắt ven bờ, thưởng thức ẩm thực làng biển và hát bài chòi. Điểm nhấn gồm nhà tranh vách đất, hệ thống giếng cổ Chăm, đường đá và cảnh quan ghềnh đá ven…',
    detail:
      '**Mã hồ sơ:** DLNT2026-023\n\n**Địa chỉ:** TDP Long Thạnh, phường Sa Huỳnh, Quảng Ngãi\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch cộng đồng gắn với di sản văn hóa Sa Huỳnh – Chăm Pa – Đại Việt, trải nghiệm làm gốm tiền sử, làm muối trên trảng đá cổ, chèo thuyền nan, tìm hiểu nghề đánh bắt ven bờ, thưởng thức ẩm thực làng biển và hát bài chòi. Điểm nhấn gồm nhà tranh vách đất, hệ thống giếng cổ Chăm, đường đá và cảnh quan ghềnh đá ven biển.\n\nSự tham gia cộng đồng: Có 37/58 hộ tham gia du lịch, với khoảng 100 lao động. Hợp tác xã cộng đồng điều phối làng Gò Cỏ tổ chức các nhóm dịch vụ lưu trú, ăn uống, hướng dẫn và trải nghiệm nghề truyền thống. Người dân trực tiếp quản lý, cung cấp dịch vụ, truyền dạy văn hóa và hưởng 90% doanh thu dịch vụ; chú trọng tạo cơ hội cho phụ nữ, thanh niên và người yếu thế.\n\nBền vững và quản trị rủi ro: Phát triển du lịch gắn với bảo tồn di sản, cảnh quan và sinh kế ven biển; ưu tiên vật liệu địa phương, hạn chế bê tông hóa, thu gom rác và giảm nhựa dùng một lần. Điểm đến quy định sức chứa homestay 4–5 người, cơ sở ăn uống tối đa 20–25 khách, đồng thời chú trọng an toàn đường biển, thuyền nan, thực phẩm và phòng cháy chữa cháy.\n\nXúc tiến và chuyển đổi số: Quảng bá qua Facebook, website langgoco.com, video và nội dung đa ngôn ngữ; kết nối doanh nghiệp lữ hành, trường học và các điểm di sản Sa Huỳnh. Định hướng số hóa thông tin di sản, sử dụng mã QR và bản đồ số để nâng cao trải nghiệm, mở rộng thị trường.\n\nChủ thể: HTX Cộng đồng điều phối làng Gò Cỏ\n\nQuy mô cộng đồng: 58 hộ\n\nSố hộ làm du lịch: 37 hộ\n\nSố lao động làm du lịch: 100\n\nNổi bật: Văn hoá Sa Huỳnh, hoạt động trải nghiệm cộng đồng: thuyền ven biển, ẩm thực, cảnh quan, địa chất, làng cổ Chăm Pa\n\nHoạt động cộng đồng tại HTX',
    province: 'Quảng Ngãi',
  },
  {
    sourceOrder: 24,
    sourceCode: 'DLNT2026-024',
    title: 'Khu Du Lịch Canh Nông BB Farm',
    address: 'thôn Vân Hòa, xã Vân Hòa, tỉnh Đắk Lắk',
    slug: 'dlnt2026-024-khu-du-lich-canh-nong-bb-farm',
    brief:
      'Du lịch trải nghiệm nông nghiệp công nghệ cao trên diện tích khoảng 4,5 ha, kết hợp tham quan vườn rau, cây ăn trái, tìm hiểu quy trình canh tác và ứng dụng công nghệ trong sản xuất. Du khách có thể trải nghiệm thu hoạch nông sản, chụp ảnh, thưởng thức và mua sản phẩm tại chỗ; kết hợp cắm trại, lưu trú và hoạt động…',
    detail:
      '**Mã hồ sơ:** DLNT2026-024\n\n**Địa chỉ:** thôn Vân Hòa, xã Vân Hòa, tỉnh Đắk Lắk\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch trải nghiệm nông nghiệp công nghệ cao trên diện tích khoảng 4,5 ha, kết hợp tham quan vườn rau, cây ăn trái, tìm hiểu quy trình canh tác và ứng dụng công nghệ trong sản xuất. Du khách có thể trải nghiệm thu hoạch nông sản, chụp ảnh, thưởng thức và mua sản phẩm tại chỗ; kết hợp cắm trại, lưu trú và hoạt động tập thể.\n\nSự tham gia cộng đồng: Có 5–7 hộ tham gia cung cấp dịch vụ, khoảng 35 lao động vào năm 2026. Hợp tác xã Nông nghiệp và Dịch vụ BB điều phối hoạt động sản xuất, đón khách và tổ chức trải nghiệm. Mô hình tạo việc làm, tăng thu nhập và kết nối hoạt động nông nghiệp với dịch vụ du lịch địa phương.\n\nBền vững và quản trị rủi ro: Điểm đến định hướng phát triển nông nghiệp xanh, phân loại và thu gom rác thải, hạn chế nhựa dùng một lần, tiết kiệm nước và bảo vệ tài nguyên đất. Công tác quản lý chú trọng an toàn thực phẩm, vệ sinh môi trường, phòng cháy chữa cháy, an ninh và kiểm soát rủi ro trong quá trình tham quan, lưu trú, trải nghiệm sản xuất.\n\nXúc tiến và chuyển đổi số: Quảng bá qua Facebook, Zalo OA và Agoda; áp dụng mã QR, thanh toán điện tử và đặt dịch vụ trực tuyến. Điểm đến từng bước mở rộng liên kết với doanh nghiệp lữ hành, cơ sở lưu trú và các điểm du lịch lân cận, đa dạng hóa sản phẩm, tăng khả năng tiếp cận khách hàng và phát triển thị trường.\n\nQuy mô: Diện tích 4,5 ha; hoạt động du lịch từ năm 2020; có 5–7 hộ tham gia và 35 lao động.\n\nĐiểm nhấn: Kết hợp sản xuất nông nghiệp công nghệ cao với du lịch trải nghiệm, tham quan nhà kính, tìm hiểu quy trình trồng và thu hoạch nông sản.\n\nSản phẩm đặc trưng: Trải nghiệm vườn chanh dây, dâu tây, dưa lưới, cà chua bi, ớt chuông và xà lách thủy canh; kết hợp lưu trú, ẩm thực và hoạt động ngoài trời.\n\nGiá trị khác biệt: Du khách trực tiếp khám phá quy trình sản xuất nông nghiệp, trải nghiệm thu hoạch và mua nông sản tại vườn; kết nối nông nghiệp công nghệ cao với nghỉ dưỡng và giáo dục trải nghiệm.',
    province: 'Đắk Lắk',
  },
  {
    sourceOrder: 25,
    sourceCode: 'DLNT2026-025',
    title: 'Điểm du lịch “Vườn hồng Lê Phúc”',
    address: '20/1 Tổ dân phố Trạm Hành, phường Xuân Trường - Đà Lạt,',
    slug: 'dlnt2026-025-diem-du-lich-vuon-hong-le-phuc',
    brief:
      'Du lịch nông nghiệp bốn mùa trên diện tích hơn 2 ha, kết hợp tham quan vườn hồng cổ, trải nghiệm thu hoạch hồng, cà phê, bơ, ổi và tìm hiểu quy trình chế biến nông sản. Du khách có thể săn mây, ngắm bình minh và hoàng hôn, tham quan nhà gỗ cổ, nghỉ dưỡng tại Glamping/Bungalow, thưởng thức BBQ và mua sản phẩm hồng…',
    detail:
      '**Mã hồ sơ:** DLNT2026-025\n\n**Địa chỉ:** 20/1 Tổ dân phố Trạm Hành, phường Xuân Trường - Đà Lạt,\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch nông nghiệp bốn mùa trên diện tích hơn 2 ha, kết hợp tham quan vườn hồng cổ, trải nghiệm thu hoạch hồng, cà phê, bơ, ổi và tìm hiểu quy trình chế biến nông sản. Du khách có thể săn mây, ngắm bình minh và hoàng hôn, tham quan nhà gỗ cổ, nghỉ dưỡng tại Glamping/Bungalow, thưởng thức BBQ và mua sản phẩm hồng treo, hồng ủ giòn mang đặc trưng địa phương.\n\nSự tham gia cộng đồng: Theo hồ sơ, khu vực có 18 hộ dân, trong đó 9 hộ tham gia hoạt động du lịch. Điểm đến có 6 lao động trực tiếp vận hành và 10 lao động thời vụ. Người dân có cơ hội tham gia cung ứng nông sản, thực phẩm và dịch vụ, góp phần tạo việc làm, tăng thu nhập và nâng cao giá trị nông sản thông qua trải nghiệm, chế biến và tiêu thụ tại chỗ.\n\nBền vững và quản trị rủi ro: Mô hình khai thác cảnh quan nông nghiệp hiện hữu, bảo tồn vườn hồng lâu năm, nhà gỗ cổ và đa dạng cây trồng. Điểm đến chú trọng xử lý chất thải, giữ gìn vệ sinh môi trường, sử dụng tài nguyên hợp lý; đồng thời trang bị camera giám sát, bình chữa cháy, phương án cứu nạn cứu hộ và giấy chứng nhận đủ điều kiện an toàn thực phẩm.\n\nXúc tiến và chuyển đổi số: Quảng bá qua Facebook, Zalo, Google Maps, website và các nền tảng đặt phòng trực tuyến. Điểm đến đã triển khai mã QR, hệ thống quản lý tập trung thông tin đặt phòng, bán hàng và dịch vụ, đặt dịch vụ trực tuyến, thanh toán điện tử và chăm sóc khách hàng tự động, góp phần nâng cao hiệu quả vận hành và mở rộng khả năng tiếp cận thị trường.\n\nQuy mô: Không gian hơn 2 ha; du lịch hoạt động từ năm 2023; 9 hộ dân tham gia.\n\nĐiểm nhấn: Vườn hồng cổ hàng thế kỷ, nhà gỗ xưa và trải nghiệm săn mây trên vùng cao Trạm Hành.\n\nSản phẩm đặc trưng: Kết hợp trải nghiệm nông nghiệp bốn mùa, thu hoạch hồng, cà phê, bơ, đào; chế biến hồng treo gió Lê Phúc, hồng ủ giòn và nghỉ dưỡng giữa vườn.\n\nGiá trị khác biệt: Khai thác cảnh quan và chu kỳ mùa vụ quanh năm, kết hợp săn mây, trải nghiệm làm vườn, lưu trú Glamping/Bungalow và lửa trại BBQ',
    // Tỉnh/thành do người dùng bổ sung ngày 04/11/2026.
    province: 'Đà Lạt',
  },
  {
    sourceOrder: 26,
    sourceCode: 'DLNT2026-026',
    title: 'KHU DU LỊCH SINH THÁI CÁNH ĐỒNG BẤT TẬN',
    address: 'Ấp Bình Phong Thạnh 3, Xã Mộc Hóa, Tỉnh Tây Ninh',
    slug: 'dlnt2026-026-khu-du-lich-sinh-thai-canh-dong-bat-tan',
    brief:
      'Du lịch sinh thái kết hợp bảo tồn dược liệu và chăm sóc sức khỏe trên diện tích 1.029 ha. Trải nghiệm nổi bật gồm khám phá rừng tràm gió, vườn bảo tồn hơn 80 loài cây dược liệu, tìm hiểu nghề chưng cất tinh dầu tràm, ngâm chân thảo dược, xông hơi, thưởng thức ẩm thực dược thiện, chèo xuồng và tham quan cánh đồng cỏ…',
    detail:
      '**Mã hồ sơ:** DLNT2026-026\n\n**Địa chỉ:** Ấp Bình Phong Thạnh 3, Xã Mộc Hóa, Tỉnh Tây Ninh\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch sinh thái kết hợp bảo tồn dược liệu và chăm sóc sức khỏe trên diện tích 1.029 ha. Trải nghiệm nổi bật gồm khám phá rừng tràm gió, vườn bảo tồn hơn 80 loài cây dược liệu, tìm hiểu nghề chưng cất tinh dầu tràm, ngâm chân thảo dược, xông hơi, thưởng thức ẩm thực dược thiện, chèo xuồng và tham quan cánh đồng cỏ bàng từng là bối cảnh phim Cánh Đồng Bất Tận. Điểm đến có 19 sản phẩm dược liệu đạt OCOP 3–4 sao.\n\nSự tham gia cộng đồng: Khu vực có 246 hộ dân, trong đó 23 hộ tham gia hoạt động du lịch, với 41 lao động. Người dân địa phương tham gia vận hành dịch vụ, chăm sóc cảnh quan, cung ứng nông sản, thực phẩm và giới thiệu sinh hoạt đặc trưng vùng Đồng Tháp Mười. Điểm đến còn tạo điều kiện cho hộ khó khăn khai thác cỏ bàng để đan đệm, giỏ, võng, góp phần tạo sinh kế và duy trì nghề thủ công.\n\nBền vững và quản trị rủi ro: Bảo tồn hệ sinh thái đất ngập nước, rừng tràm gió và nguồn gen cây dược liệu trên cơ sở phân khu bảo vệ nghiêm ngặt, phục hồi sinh thái và nghiên cứu khoa học. Hoạt động du lịch gắn với giáo dục môi trường, sử dụng tài nguyên hợp lý, bảo vệ rừng và phòng cháy chữa cháy; đồng thời chú trọng an toàn thực phẩm, vệ sinh và an toàn trải nghiệm.\n\nXúc tiến và chuyển đổi số: Tăng cường quảng bá qua website, Facebook, Google Maps, hình ảnh, video và câu chuyện trải nghiệm. Định hướng nâng cấp đặt dịch vụ trực tuyến, ứng dụng mã QR thuyết minh, số hóa quản lý và chăm sóc khách hàng; mở rộng kết nối doanh nghiệp lữ hành, trường học, viện nghiên cứu nhằm phát triển thị trường du lịch sinh thái – chăm sóc sức khỏe.\n\nQuy mô: Diện tích 1.029 ha; hoạt động du lịch từ năm 2017; 23 hộ dân tham gia, với 41 lao động.\n\nĐiểm nhấn: Nằm trong Khu Bảo tồn Đa dạng sinh học cây dược liệu Đồng Tháp Mười, nổi bật với rừng tràm gió bản địa và hơn 80 loài cây dược liệu.\n\nSản phẩm đặc trưng: Kết hợp khám phá rừng tràm, tìm hiểu nghề chưng cất dầu tràm, trải nghiệm ngâm chân và xông hơi dược liệu, ẩm thực dược thiện, chèo xuồng và giăng lưới bắt cá.\n\nGiá trị khác biệt: Gắn bảo tồn thiên nhiên với nghiên cứu, sản xuất dược liệu và chăm sóc sức khỏe; cảnh đồng cỏ bàng từng là bối cảnh phim Cánh Đồng Bất Tận. Điểm đến có 19 sản phẩm OCOP đạt chuẩn 3–4 sao.',
    province: 'Tây Ninh',
  },
  {
    sourceOrder: 27,
    sourceCode: 'DLNT2026-027',
    title: 'Khu du lịch sinh thái giáo dục trải nghiệm Chavi (Chavi Garden)',
    address: 'Quốc lộ N2, ấp 5, xã Thạnh Lợi, tỉnh Tây Ninh',
    slug: 'dlnt2026-027-khu-du-lich-sinh-thai-giao-duc-trai-nghiem-chavi-chavi-garden',
    brief:
      'Du lịch nông nghiệp lấy quả chanh làm sản phẩm đặc trưng, kết hợp tham quan vườn chanh vàng, tự tay thu hoạch, trải nghiệm làm trà chanh giã tay và tìm hiểu quy trình chế biến. Điểm đến còn cung cấp các sản phẩm từ chanh như nước cốt, trà chanh, bột chanh, tinh dầu, syrup; kết hợp vui chơi ngoài trời, chèo xuồng, tắm…',
    detail:
      '**Mã hồ sơ:** DLNT2026-027\n\n**Địa chỉ:** Quốc lộ N2, ấp 5, xã Thạnh Lợi, tỉnh Tây Ninh\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch nông nghiệp lấy quả chanh làm sản phẩm đặc trưng, kết hợp tham quan vườn chanh vàng, tự tay thu hoạch, trải nghiệm làm trà chanh giã tay và tìm hiểu quy trình chế biến. Điểm đến còn cung cấp các sản phẩm từ chanh như nước cốt, trà chanh, bột chanh, tinh dầu, syrup; kết hợp vui chơi ngoài trời, chèo xuồng, tắm thảo dược, chăm sóc sức khỏe và lưu trú glamping.\n\nSự tham gia cộng đồng: Chavi Garden hiện có 36 lao động tham gia hoạt động du lịch. Sự kết nối với các hợp tác xã, đại lý và hộ nông dân thông qua thu mua chanh góp phần tạo đầu ra cho nông sản, nâng cao giá trị sản phẩm địa phương. Tuy nhiên, người dân chưa trực tiếp tham gia cung ứng, vận hành dịch vụ du lịch; điểm đến định hướng mở rộng liên kết để cộng đồng cùng xây dựng trải nghiệm tại vườn và hưởng lợi từ du lịch.\n\nBền vững và quản trị rủi ro: Điểm đến được hình thành từ quá trình cải tạo vùng đất phèn thành không gian xanh rộng hơn 40 ha, kết hợp vườn chanh, vườn hoa và khu trải nghiệm. Công tác quản lý chú trọng vệ sinh, bảo trì cơ sở vật chất, kiểm tra chất lượng dịch vụ và tiếp nhận phản hồi. Các hoạt động dưới nước, vui chơi và lưu trú được quản lý thông qua hướng dẫn an toàn, sử dụng áo phao, kiểm tra thiết bị và xây dựng phương án ứng phó sự cố.\n\nXúc tiến và chuyển đổi số: Quảng bá qua website, Facebook, TikTok, YouTube, Instagram và Google Maps; kết hợp nhà sáng tạo nội dung, doanh nghiệp lữ hành và các chương trình xúc tiến du lịch. Điểm đến hỗ trợ đặt dịch vụ trực tuyến, thanh toán điện tử, Wi-Fi và tiếp nhận đánh giá trực tuyến nhằm nâng cao chất lượng phục vụ, mở rộng thị trường khách.\n\nQuy mô: Hơn 40 ha, hoạt động du lịch từ năm 2022, có 36 lao động.\n\nĐiểm nhấn: Cải tạo vùng đất phèn thành không gian xanh, lấy quả chanh làm sản phẩm chủ đạo.\n\nTrải nghiệm: Tự hái chanh, làm trà chanh giã tay, khám phá sản phẩm chế biến từ chanh; kết hợp vui chơi, tắm thảo dược và Glamping.\n\nGiá trị riêng: Kết hợp du lịch nông nghiệp, giáo dục trải nghiệm và chăm sóc sức khỏe.',
    province: 'Tây Ninh',
  },
  {
    sourceOrder: 28,
    sourceCode: 'DLNT2026-028',
    title: 'Du lịch Vườn Hồng Tư Tôn',
    address:
      'Đường vành đai DT 852B, nằm giữa cầu Sa Đéc 2 và cầu Cai Dao 2, phường Sa Đéc, tỉnh Đồng Tháp.',
    slug: 'dlnt2026-028-du-lich-vuon-hong-tu-ton',
    brief:
      'Du lịch trải nghiệm làng hoa Sa Đéc trên diện tích 3 ha, kết hợp tham quan vườn hồng, ngắm hoa theo mùa, check-in các tiểu cảnh và trải nghiệm bơi xuồng ngắm hoa. Điểm nhấn là giá trị lịch sử của nghệ nhân Tư Tôn – người có công phát triển nhiều giống hoa hồng thích nghi với khí hậu Sa Đéc – cùng không gian sông nước…',
    detail:
      '**Mã hồ sơ:** DLNT2026-028\n\n**Địa chỉ:** Đường vành đai DT 852B, nằm giữa cầu Sa Đéc 2 và cầu Cai Dao 2, phường Sa Đéc, tỉnh Đồng Tháp.\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch trải nghiệm làng hoa Sa Đéc trên diện tích 3 ha, kết hợp tham quan vườn hồng, ngắm hoa theo mùa, check-in các tiểu cảnh và trải nghiệm bơi xuồng ngắm hoa. Điểm nhấn là giá trị lịch sử của nghệ nhân Tư Tôn – người có công phát triển nhiều giống hoa hồng thích nghi với khí hậu Sa Đéc – cùng không gian sông nước miền Tây và các loài hoa đặc trưng như muồng hoa đào.\n\nSự tham gia cộng đồng: Theo hồ sơ, cộng đồng có khoảng 4.000 hộ dân, trong đó 14 hộ tham gia hoạt động du lịch và 10 lao động thường xuyên. Người dân làng hoa trực tiếp trồng, chăm sóc hoa, đón tiếp khách, giới thiệu nghề truyền thống và cung cấp sản phẩm địa phương. Vào mùa cao điểm, hoạt động du lịch tạo việc làm cho hơn 30 lao động, góp phần tăng thu nhập và duy trì nghề trồng hoa truyền thống.\n\nBền vững và quản trị rủi ro: Điểm đến định hướng phát triển xanh, gắn bảo tồn giống hoa, cảnh quan sinh thái và văn hóa làng hoa với sinh kế cộng đồng. Các giải pháp gồm tăng diện tích cây xanh, tiết kiệm nước và năng lượng, hạn chế nhựa dùng một lần, phân loại và xử lý rác thải; đồng thời chú trọng quản lý rủi ro về môi trường, thời tiết, an toàn du khách và hoạt động vận hành.\n\nXúc tiến và chuyển đổi số: Tăng cường quảng bá hình ảnh Vườn Hồng Tư Tôn trên các nền tảng số, kết nối doanh nghiệp lữ hành và mở rộng thị trường khách trong nước, quốc tế. Điểm đến định hướng ứng dụng công nghệ trong truyền thông, bán vé, đặt dịch vụ, chăm sóc khách hàng và quản lý vận hành nhằm nâng cao trải nghiệm, hiệu quả kinh doanh và sức lan tỏa của thương hiệu làng hoa Sa Đéc.\n\nQuy mô: Diện tích 3 ha; hoạt động du lịch từ năm 2021; có 14 hộ dân tham gia, 10 lao động.\n\nĐiểm nhấn: Gắn với lịch sử làng hoa Sa Đéc, tiếp nối truyền thống trồng hoa của nghệ nhân Tư Tôn từ giữa thế kỷ XX.\n\nTrải nghiệm: Tham quan vườn hồng, ngắm hoa theo mùa, chụp ảnh tại các tiểu cảnh và chèo xuồng ngắm hoa.\n\nGiá trị riêng: Bảo tồn thương hiệu vườn hồng lâu đời, nổi bật với hoa muồng anh đào nở rộ vào tháng 4, kết hợp cảnh quan hoa và văn hóa sông nước miền Tây.',
    province: 'Đồng Tháp',
  },
  {
    sourceOrder: 29,
    sourceCode: 'DLNT2026-029',
    title: 'Điểm du lịch cộng đồng Cồn Chim',
    address: 'Ấp Cồn Chim, xã Hòa Minh, tỉnh Vĩnh Long',
    slug: 'dlnt2026-029-diem-du-lich-cong-dong-con-chim',
    brief:
      'Du lịch cộng đồng gắn với hệ sinh thái cù lao sông nước, trải nghiệm làm nông nghiệp thuận thiên, chèo xuồng, giăng lưới, bắt cá, đặt lú, làm bánh dân gian và thưởng thức ẩm thực miệt vườn. Điểm nhấn là mô hình “con tôm ôm cây lúa”, vườn cây ăn trái, homestay và các hoạt động trải nghiệm đời sống dân dã của người dân…',
    detail:
      '**Mã hồ sơ:** DLNT2026-029\n\n**Địa chỉ:** Ấp Cồn Chim, xã Hòa Minh, tỉnh Vĩnh Long\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch cộng đồng gắn với hệ sinh thái cù lao sông nước, trải nghiệm làm nông nghiệp thuận thiên, chèo xuồng, giăng lưới, bắt cá, đặt lú, làm bánh dân gian và thưởng thức ẩm thực miệt vườn. Điểm nhấn là mô hình “con tôm ôm cây lúa”, vườn cây ăn trái, homestay và các hoạt động trải nghiệm đời sống dân dã của người dân địa phương.\n\nSự tham gia cộng đồng: Theo hồ sơ, Cồn Chim có 54 hộ dân với 220 nhân khẩu, trong đó 25 hộ tham gia hoạt động du lịch, tạo việc làm cho 52 lao động. Hợp tác xã Nông nghiệp, Du lịch cộng đồng Cồn Chim giữ vai trò liên kết, điều phối dịch vụ và kết nối doanh nghiệp lữ hành. Người dân trực tiếp đón khách, chế biến món ăn, hướng dẫn trải nghiệm và giới thiệu văn hóa địa phương, góp phần tăng thu nhập và duy trì sinh kế truyền thống.\n\nBền vững và quản trị rủi ro: Phát triển du lịch thuận thiên gắn với bảo vệ hệ sinh thái, hạn chế hóa chất trong sản xuất, sử dụng phân hữu cơ, giảm nhựa dùng một lần và thu gom rác thải. Điểm đến chú trọng bảo vệ nguồn nước, đa dạng sinh học, an toàn thực phẩm, phòng cháy chữa cháy và an toàn đường thủy; đồng thời xây dựng quy trình ứng phó thiên tai, duy trì cảnh quan xanh, sạch và bảo tồn văn hóa cộng đồng.\n\nXúc tiến và chuyển đổi số: Quảng bá qua mạng xã hội, website, video và các nền tảng đặt dịch vụ trực tuyến; kết nối doanh nghiệp lữ hành, trường học và đơn vị truyền thông. Điểm đến ứng dụng thanh toán điện tử, Wi-Fi, Internet và công cụ tiếp nhận phản hồi trực tuyến, đồng thời định hướng số hóa thông tin, nâng cao chất lượng dịch vụ và mở rộng thị trường khách.\n\nChủ thể: HTX nông nghiệp, du lịch cồng đồng Cồn Chim\n\nDiện tích: 62 ha\n\nQuy mô cộng đồng: 54 hộ\n\nSố nhân khẩu: 220 nhân khẩu\n\nSố hộ làm du lịch: 25 hộ\n\nSố lao động làm du lịch: 52\n\nNổi bật: sông nước, miệt vườn\n\nHomestay: 05\n\nLượng khách: 136.620 (7 năm từ 2019-2026) với 10%  khách nước ngoài',
    province: 'Vĩnh Long',
  },
  {
    sourceOrder: 30,
    sourceCode: 'DLNT2026-030',
    title: 'Hợp tác xã Mây Tre Đan Thủy Tuyết',
    address: 'ấp Phước Hòa, xã Thuận Hòa, thành phố Cần Thơ',
    slug: 'dlnt2026-030-hop-tac-xa-may-tre-dan-thuy-tuyet',
    brief:
      'Du lịch làng nghề mây tre đan Thủy Tuyết kết hợp trải nghiệm làm nghề, khám phá văn hóa Khmer và đời sống nông thôn miền Tây. Du khách có thể tham quan không gian trưng bày, tìm hiểu nguyên liệu tre, mây, lục bình; trực tiếp chẻ, vót, đan sản phẩm, gặp gỡ nghệ nhân, thưởng thức ẩm thực và mua quà lưu niệm thủ công.…',
    detail:
      '**Mã hồ sơ:** DLNT2026-030\n\n**Địa chỉ:** ấp Phước Hòa, xã Thuận Hòa, thành phố Cần Thơ\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch làng nghề mây tre đan Thủy Tuyết kết hợp trải nghiệm làm nghề, khám phá văn hóa Khmer và đời sống nông thôn miền Tây. Du khách có thể tham quan không gian trưng bày, tìm hiểu nguyên liệu tre, mây, lục bình; trực tiếp chẻ, vót, đan sản phẩm, gặp gỡ nghệ nhân, thưởng thức ẩm thực và mua quà lưu niệm thủ công. Điểm nhấn là hơn 700 mẫu sản phẩm, kết hợp giá trị truyền thống với thiết kế hiện đại.\n\nSự tham gia cộng đồng: Theo hồ sơ, điểm đến có 32 hộ tham gia hoạt động du lịch và khoảng 120 lao động. Hợp tác xã Mây Tre Đan Thủy Tuyết liên kết nghệ nhân, hộ sản xuất và người dân Khmer, tạo việc làm, duy trì nghề truyền thống và tăng thu nhập. Phụ nữ, người cao tuổi và thanh niên cùng tham gia sản xuất, hướng dẫn trải nghiệm, giới thiệu văn hóa và cung ứng dịch vụ.\n\nBền vững và quản trị rủi ro: Mô hình ưu tiên nguyên liệu tự nhiên, tận dụng tre, lục bình và vật liệu địa phương; tái sử dụng phụ phẩm, hạn chế hóa chất và giảm chất thải. Điểm đến chú trọng bảo tồn nghề đan lát, văn hóa Khmer, vệ sinh môi trường, an toàn lao động, phòng cháy chữa cháy và an toàn thực phẩm, đồng thời xây dựng quy trình ứng phó rủi ro trong hoạt động trải nghiệm.\n\nXúc tiến và chuyển đổi số: Quảng bá qua Facebook, TikTok, website, video và các kênh truyền thông; kết nối doanh nghiệp lữ hành, trường học và đối tác xuất khẩu. Định hướng triển khai mã QR, website đặt lịch, thanh toán điện tử, bản đồ số và bán sản phẩm trực tuyến để mở rộng thị trường, nâng cao trải nghiệm khách hàng và phát triển du lịch làng nghề bền vững.\n\nQuy mô: Khoảng 200 người trong cộng đồng; 32 hộ tham gia, 12 lao động du lịch.\n\nĐiểm nhấn: Kết hợp làng nghề mây tre đan truyền thống với du lịch trải nghiệm và kinh tế xanh tại vùng đất Thuận Hòa, Cần Thơ.\n\nTrải nghiệm: Tham quan xưởng, tự tay đan sản phẩm, giao lưu nghệ nhân, tìm hiểu văn hóa Khmer và thưởng thức ẩm thực địa phương.\n\nGiá trị riêng: Bảo tồn nghề đan lát, phát triển hơn 700 mẫu sản phẩm thủ công và tạo sinh kế cho phụ nữ, người Khmer; gắn thông điệp “Tre nuôi người – Người giữ tre – Văn hóa giữ hồn tre”.',
    province: 'Cần Thơ',
  },
  {
    sourceOrder: 31,
    sourceCode: 'DLNT2026-031',
    title: 'Khu du lịch Mũi Cà Mau',
    address: 'ấp Mũi, xã Đất Mũi, tỉnh Cà Mau',
    slug: 'dlnt2026-031-khu-du-lich-mui-ca-mau',
    brief:
      'Du lịch sinh thái gắn với hệ sinh thái rừng ngập mặn và văn hóa sông nước vùng cực Nam Tổ quốc. Du khách có thể tham quan Cột mốc tọa độ Quốc gia GPS 0001, biểu tượng Mũi Cà Mau, đi xuồng xuyên rừng, trải nghiệm giăng lưới, đặt lú, tìm hiểu nghề nuôi thủy sản, thưởng thức đặc sản địa phương và khám phá các sản phẩm…',
    detail:
      '**Mã hồ sơ:** DLNT2026-031\n\n**Địa chỉ:** ấp Mũi, xã Đất Mũi, tỉnh Cà Mau\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch sinh thái gắn với hệ sinh thái rừng ngập mặn và văn hóa sông nước vùng cực Nam Tổ quốc. Du khách có thể tham quan Cột mốc tọa độ Quốc gia GPS 0001, biểu tượng Mũi Cà Mau, đi xuồng xuyên rừng, trải nghiệm giăng lưới, đặt lú, tìm hiểu nghề nuôi thủy sản, thưởng thức đặc sản địa phương và khám phá các sản phẩm OCOP. Điểm nhấn là sự kết hợp giữa cảnh quan rừng – biển, sinh kế ngư dân và giá trị chủ quyền lãnh thổ.\n\nSự tham gia cộng đồng: Theo hồ sơ, có 88 hộ tham gia hoạt động du lịch, với 210 lao động. Người dân trực tiếp cung cấp dịch vụ vận chuyển, ăn uống, lưu trú, hướng dẫn trải nghiệm và giới thiệu sản vật địa phương. Hoạt động du lịch góp phần tạo việc làm, tăng thu nhập và duy trì các nghề truyền thống như đánh bắt, nuôi trồng thủy sản, làm khô và chế biến hải sản.\n\nBền vững và quản trị rủi ro: Phát triển du lịch gắn với bảo tồn Vườn quốc gia Mũi Cà Mau, hệ sinh thái rừng ngập mặn và đa dạng sinh học. Điểm đến chú trọng bảo vệ môi trường, tiết kiệm tài nguyên, thu gom rác, hạn chế nhựa dùng một lần; đồng thời triển khai các biện pháp bảo đảm an toàn đường thủy, phòng cháy chữa cháy, an ninh và ứng phó thiên tai.\n\nXúc tiến và chuyển đổi số: Quảng bá qua website, Facebook, bản đồ tuyến tham quan và các chương trình xúc tiến du lịch. Điểm đến định hướng ứng dụng mã QR, số hóa thông tin di sản, tăng cường đặt dịch vụ trực tuyến, thanh toán điện tử và kết nối doanh nghiệp lữ hành nhằm mở rộng thị trường khách.\n\nChủ thể: Vuờn Quốc gia Mũi Cà Mau\n\nDiện tích: 12.203 ha\n\nBát. đầu hoạt động:  năm 2000\n\nQuy mô cộng đồng: 1.615 hộ\n\nSố hộ làm du lịch: 88 hộ\n\nSố người làm du lịch: 210 người\n\nNổi bật: địa đầu đất nước, đất mũi\n\nRừng ngập mặn, sinh thái miệt vườn\n\nLiên kết lữ hành: 11 công ty',
    province: 'Cà Mau',
  },
  {
    sourceOrder: 32,
    sourceCode: 'DLNT2026-032',
    title: 'Điểm du lịch sinh thái cộng đồng Mười Ngọt',
    address: 'Xã Đá Bạc, Tỉnh Cà Mau',
    slug: 'dlnt2026-032-diem-du-lich-sinh-thai-cong-dong-muoi-ngot',
    brief:
      'Du lịch sinh thái gắn với rừng tràm U Minh Hạ và đời sống cộng đồng địa phương. Du khách có thể đi xuồng khám phá rừng, trải nghiệm gác kèo ong, bắt cá đồng, tham quan vườn cây ăn trái, thưởng thức mật ong rừng, cá lóc đồng nướng trui và các món ăn dân dã. Điểm nhấn là sự kết hợp giữa thiên nhiên, nghề truyền thống và…',
    detail:
      '**Mã hồ sơ:** DLNT2026-032\n\n**Địa chỉ:** Xã Đá Bạc, Tỉnh Cà Mau\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch sinh thái gắn với rừng tràm U Minh Hạ và đời sống cộng đồng địa phương. Du khách có thể đi xuồng khám phá rừng, trải nghiệm gác kèo ong, bắt cá đồng, tham quan vườn cây ăn trái, thưởng thức mật ong rừng, cá lóc đồng nướng trui và các món ăn dân dã. Điểm nhấn là sự kết hợp giữa thiên nhiên, nghề truyền thống và văn hóa sông nước U Minh.\n\nSự tham gia cộng đồng: Theo hồ sơ, có 10 hộ tham gia hoạt động du lịch, với 20 lao động. Người dân trực tiếp hướng dẫn trải nghiệm, cung cấp dịch vụ ăn uống, lưu trú và giới thiệu nghề gác kèo ong, đánh bắt cá đồng, khai thác sản vật rừng. Mô hình góp phần tạo việc làm, tăng thu nhập và khuyến khích cộng đồng gìn giữ tri thức bản địa.\n\nBền vững và quản trị rủi ro: Phát triển du lịch gắn với bảo tồn hệ sinh thái rừng tràm, đa dạng sinh học và nghề gác kèo ong truyền thống. Điểm đến chú trọng hạn chế rác thải, sử dụng vật liệu thân thiện môi trường, bảo vệ rừng và nguồn nước; đồng thời nâng cao an toàn thực phẩm, an toàn khi di chuyển bằng xuồng, phòng cháy chữa cháy và quản lý rủi ro trong các hoạt động trải nghiệm.\n\nXúc tiến và chuyển đổi số: Quảng bá qua Facebook, TikTok, YouTube và các video giới thiệu trải nghiệm rừng tràm. Điểm đến tham gia hoạt động xúc tiến du lịch, hội chợ và kết nối doanh nghiệp lữ hành; định hướng phát triển website, bản đồ số, nội dung đa phương tiện và liên kết các điểm du lịch sinh thái lân cận để mở rộng thị trường.\n\nQuy mô: Diện tích 60,8 ha; hoạt động du lịch từ năm 2015; có 10 hộ dân và 20 lao động tham gia.\n\nĐiểm nhấn: Nằm giữa hệ sinh thái rừng tràm U Minh Hạ, gắn với bảo tồn thiên nhiên và sinh kế người dân địa phương.\n\nTrải nghiệm: Gác kèo ong lấy mật, bắt cá đồng, chèo xuồng xuyên rừng, thưởng thức mật ong rừng và ẩm thực dân dã.\n\nGiá trị riêng: Khai thác tri thức bản địa về nghề gác kèo ong, kết hợp trải nghiệm sinh thái rừng tràm, văn hóa U Minh và sản phẩm địa phương.',
    province: 'Cà Mau',
  },
  {
    sourceOrder: 33,
    sourceCode: 'DLNT2026-033',
    title: 'Điểm du lịch sinh thái Rừng tràm Trà Sư, An Giang',
    address: 'Ấp Văn Trà, xã Văn Giáo, thị xã Tịnh Biên, tỉnh An Giang',
    slug: 'dlnt2026-033-diem-du-lich-sinh-thai-rung-tram-tra-su-an-giang',
    brief:
      'Du lịch sinh thái gắn với hệ sinh thái rừng tràm ngập nước, cảnh quan kênh rạch và văn hóa sông nước Nam Bộ. Du khách có thể đi xuồng ba lá, xuồng máy xuyên rừng, tham quan cầu tre vạn bước, ngắm chim hoang dã, trải nghiệm ẩm thực địa phương và tìm hiểu nghề nuôi ong, khai thác mật tràm. Điểm đến còn kết nối trải…',
    detail:
      '**Mã hồ sơ:** DLNT2026-033\n\n**Địa chỉ:** Ấp Văn Trà, xã Văn Giáo, thị xã Tịnh Biên, tỉnh An Giang\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Du lịch sinh thái gắn với hệ sinh thái rừng tràm ngập nước, cảnh quan kênh rạch và văn hóa sông nước Nam Bộ. Du khách có thể đi xuồng ba lá, xuồng máy xuyên rừng, tham quan cầu tre vạn bước, ngắm chim hoang dã, trải nghiệm ẩm thực địa phương và tìm hiểu nghề nuôi ong, khai thác mật tràm. Điểm đến còn kết nối trải nghiệm văn hóa Khmer tại làng nghề dệt thổ cẩm Châu Phong, tạo chuỗi sản phẩm đa dạng.\n\nSự tham gia cộng đồng: Theo hồ sơ, địa phương có 95 hộ dân, trong đó 80 hộ tham gia hoạt động du lịch, tạo việc làm cho 98 lao động thường xuyên và 15 hộ cung ứng sản phẩm, dịch vụ. Người dân tham gia vận chuyển, ăn uống, lưu trú, cung cấp nông sản, thủ công mỹ nghệ và hướng dẫn trải nghiệm, góp phần tạo sinh kế và nâng cao thu nhập.\n\nBền vững và quản trị rủi ro: Điểm đến chú trọng bảo tồn rừng tràm, đa dạng sinh học, cảnh quan và môi trường nước; tăng cường thu gom rác, hạn chế nhựa dùng một lần và sử dụng vật liệu thân thiện môi trường. Công tác quản lý tập trung vào an toàn đường thủy, trang bị áo phao, kiểm soát sức chứa, an toàn thực phẩm, phòng cháy chữa cháy và ứng phó thời tiết bất lợi.\n\nXúc tiến và chuyển đổi số: Trà Sư quảng bá qua website, Facebook, TikTok, Zalo OA, Google Maps và bản đồ 360 độ; ứng dụng mã QR, vé điện tử, thanh toán không tiền mặt và hệ thống quản lý dịch vụ trực tuyến. Điểm đến kết nối doanh nghiệp lữ hành, phát triển tour liên tuyến và đa dạng hóa thị trường khách trong nước, quốc tế, hướng tới nâng cao chất lượng trải nghiệm và hiệu quả vận hành.\n\nChủ thể: Công ty CP Du lịch An Giang\n\nQuy mô rừng tràm: 845 ha\n\nNội bật: sinh thái miệt vường, xuồng ba lá, vườn chim, ẩm thực miền tây. Hệ sinh thái ngập nước đặc trưng, nơi đây được xem như “phòng thí nghiệm tự nhiên” quý giá cho các nhà nghiên cứu đa dạng sinh học, đặc biệt về các loài chim, cá và thực vật đặc hữu.',
    province: 'An Giang',
  },
  {
    sourceOrder: 34,
    sourceCode: 'DLNT2026-034',
    title: 'Điểm du lịch Cồn Én, An Giang',
    address: 'Ấp Tấn Long, xã Cù Lao Giêng, tỉnh An Giang',
    slug: 'dlnt2026-034-diem-du-lich-con-en-an-giang',
    brief:
      'Cồn Én khai thác lợi thế cảnh quan cù lao ven sông Tiền, vườn cây, không gian sông nước và văn hóa bản địa để phát triển du lịch nông thôn gắn với sinh thái, trải nghiệm và khám phá đời sống địa phương. Các sản phẩm nổi bật gồm tham quan bằng thuyền, trải nghiệm không gian sinh thái, tìm hiểu nghề thủ công từ gỗ lũa,…',
    detail:
      '**Mã hồ sơ:** DLNT2026-034\n\n**Địa chỉ:** Ấp Tấn Long, xã Cù Lao Giêng, tỉnh An Giang\n\n## Nội dung hồ sơ\n\nSản phẩm đặc sắc: Cồn Én khai thác lợi thế cảnh quan cù lao ven sông Tiền, vườn cây, không gian sông nước và văn hóa bản địa để phát triển du lịch nông thôn gắn với sinh thái, trải nghiệm và khám phá đời sống địa phương. Các sản phẩm nổi bật gồm tham quan bằng thuyền, trải nghiệm không gian sinh thái, tìm hiểu nghề thủ công từ gỗ lũa, thưởng thức ẩm thực miền Tây và tham gia hoạt động dân gian. Điểm đến từng bước hình thành sản phẩm kết hợp giữa thiên nhiên, văn hóa và trải nghiệm cộng đồng, tạo dấu ấn riêng cho du lịch vùng cù lao.\n\nSự tham gia cộng đồng: Theo hồ sơ, Cồn Én có 905 hộ dân trong cộng đồng, trong đó 13 hộ tham gia hoạt động du lịch; điểm đến tạo việc làm cho 60 lao động, gồm 50 lao động địa phương. Người dân tham gia phục vụ khách, cung cấp nông sản, nguyên liệu và các dịch vụ hỗ trợ. Việc khai thác nguồn lực tại chỗ góp phần tạo sinh kế, tăng thu nhập và khuyến khích cộng đồng tham gia gìn giữ cảnh quan, văn hóa địa phương.\n\nBền vững và quản trị rủi ro: Điểm đến chú trọng vệ sinh môi trường, thu gom rác, giữ gìn cảnh quan sông nước và bảo tồn giá trị văn hóa bản địa. Hồ sơ đề cập các biện pháp bảo đảm an ninh trật tự, phòng cháy chữa cháy, cứu nạn cứu hộ, camera giám sát và theo dõi thời tiết đối với hoạt động ngoài trời, trên sông.\n\nXúc tiến và chuyển đổi số: Cồn Én sử dụng Facebook, TikTok, Zalo, Google Maps và các kênh truyền thông trực tuyến để quảng bá sản phẩm. Hồ sơ ghi nhận lượng khách tăng từ 10.658 lượt năm 2024 lên 17.004 lượt năm 2025 và 21.123 lượt trong 9 tháng đầu năm 2026. Doanh thu tương ứng đạt 852,64 triệu đồng, 1,36 tỷ đồng và 1,556 tỷ đồng. Điểm đến có tiềm năng tiếp tục nâng cao chất lượng sản phẩm, liên kết cộng đồng và mở rộng tiếp thị số.\n\nQuy mô: Diện tích 6,6 ha; hoạt động du lịch từ năm 2023; có 13 hộ tham gia và 60 lao động.\n\nĐiểm nhấn: Không gian sinh thái ven sông Tiền, kết hợp cảnh quan bãi bồi, vườn cây và trải nghiệm sông nước miền Tây.\n\nSản phẩm đặc trưng: Tham quan bằng xuồng, trải nghiệm nghề thủ công từ gỗ lũa, vui chơi dưới nước, thưởng thức ẩm thực địa phương và nghỉ dưỡng.\n\nGiá trị riêng: Kết hợp nghệ thuật gỗ lũa với du lịch sinh thái cộng đồng, tạo điểm nhấn từ các tác phẩm điêu khắc gỗ và không gian trải nghiệm ven sông.',
    province: 'An Giang',
  },
  {
    sourceOrder: 35,
    sourceCode: 'DLNT2026-35',
    title: 'Hành trình trải nghiệm Sen Quê Bác',
    address: 'HTX Sen Quê Bác tại Kim Liên, Nghệ An',
    slug: 'dlnt2026-035-hanh-trinh-trai-nghiem-sen-que-bac',
    brief:
      'Mô hình tại Kim Liên gắn cây sen, vùng nguyên liệu, chế biến, sản phẩm OCOP và trải nghiệm; bảng kết quả nêu 20 hộ tham gia và 25 lao động.',
    detail:
      '**Mã hồ sơ:** DLNT2026-35\n\n**Địa chỉ:** HTX Sen Quê Bác tại Kim Liên, Nghệ An\n\n## Nội dung hồ sơ\n\nHoạt động: Mô hình tại Kim Liên gắn cây sen, vùng nguyên liệu, chế biến, sản phẩm OCOP và trải nghiệm; bảng kết quả nêu 20 hộ tham gia và 25 lao động.\n\nSản phẩm: Tham quan, tìm hiểu cây sen, trải nghiệm làm trà, thưởng thức và chế biến sản phẩm, giao lưu với người làm và mua sản phẩm từ sen.\n\nCộng đồng cung cấp dịch vụ: Người trồng cung ứng sen, HTX hướng dẫn quy trình, kiểm soát đầu vào và tổ chức bao tiêu; hồ sơ có hợp đồng thu mua, thuê ruộng và liên kết sản xuất, tạo nền cho kết nối nông nghiệp với du lịch.\n\nKhách và doanh thu: Năm 2025: 5.250 lượt, 2.500 triệu đồng; 9 tháng 2026: 3.966 lượt, 2.100 triệu đồng doanh thu du lịch. Số liệu riêng Sen Quê Bác.',
    province: 'Nghệ An',
  },
];
