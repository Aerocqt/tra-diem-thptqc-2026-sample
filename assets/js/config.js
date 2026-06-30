/**
 * config.js
 * ------------------------------------------------------------------
 * Cấu hình toàn cục cho hệ thống tra cứu điểm thi.
 * Mọi giá trị "thay đổi được khi lên production" đều gom ở đây để
 * dễ thay thế khi gắn vào nguồn dữ liệu thật.
 * ------------------------------------------------------------------
 */

const APP_CONFIG = {
  // Thời điểm công bố điểm (giờ Việt Nam, UTC+7).
  // Đổi giá trị này khi triển khai cho năm/đợt thi khác.
  RELEASE_TIME_ISO: "2026-07-01T01:00:00Z", // = 08:00:00 01/07/2026 (UTC+7)

  // Danh sách API đồng bộ giờ thực, thử lần lượt theo thứ tự.
  TIME_SOURCES: [
    {
      name: "worldtimeapi",
      url: "https://worldtimeapi.org/api/timezone/Asia/Ho_Chi_Minh",
      parse: (json) => new Date(json.utc_datetime).getTime(),
    },
    {
      name: "worldclockapi",
      url: "https://worldclockapi.com/api/json/utc/now",
      parse: (json) => new Date(json.currentDateTime).getTime(),
    },
  ],

  // Tần suất đồng bộ lại giờ máy chủ (ms) để bù trừ độ trễ/đồng hồ trôi.
  RESYNC_INTERVAL_MS: 5 * 60 * 1000,

  // Mẫu đường dẫn dữ liệu tĩnh. {maTinh} và {prefix} sẽ được thay thế.
  // => data/{maTinh}/{prefix}.json
  DATA_URL_TEMPLATE: "data/{maTinh}/{prefix}.json",

  // Số chữ số của SBD dùng làm "khoá phân mảnh" file JSON, tính từ
  // ký tự ngay sau 2 số đầu (mã tỉnh). Giúp mỗi file chỉ chứa một
  // nhóm nhỏ thí sinh thay vì toàn bộ tỉnh trong 1 file nặng.
  SBD_PREFIX_LENGTH: 4,

  TOTAL_SBD_DIGITS: 8,
};

/**
 * Danh sách 63 tỉnh/thành.
 * LƯU Ý: mã số dưới đây (01..63) là mã DEMO, đánh theo thứ tự để
 * minh hoạ cấu trúc thư mục dữ liệu. Khi triển khai thật, hãy thay
 * bằng mã tỉnh chính thức do Bộ GD&ĐT công bố trong quy chế thi
 * từng năm và đổi tên thư mục /data/{maTinh}/ tương ứng.
 */
const PROVINCES = [
  "Hà Nội","TP. Hồ Chí Minh","Hải Phòng","Đà Nẵng","Cần Thơ",
  "Hà Giang","Cao Bằng","Lai Châu","Lào Cai","Tuyên Quang",
  "Lạng Sơn","Bắc Kạn","Thái Nguyên","Yên Bái","Sơn La",
  "Phú Thọ","Vĩnh Phúc","Quảng Ninh","Bắc Giang","Bắc Ninh",
  "Hải Dương","Hưng Yên","Hòa Bình","Hà Nam","Nam Định",
  "Thái Bình","Ninh Bình","Thanh Hóa","Nghệ An","Hà Tĩnh",
  "Quảng Bình","Quảng Trị","Thừa Thiên Huế","Quảng Nam","Quảng Ngãi",
  "Kon Tum","Bình Định","Gia Lai","Phú Yên","Đắk Lắk",
  "Khánh Hòa","Lâm Đồng","Bình Phước","Bình Dương","Ninh Thuận",
  "Tây Ninh","Bình Thuận","Đồng Nai","Long An","Đắk Nông",
  "Bà Rịa - Vũng Tàu","An Giang","Tiền Giang","Vĩnh Long","Đồng Tháp",
  "Kiên Giang","Bến Tre","Trà Vinh","Sóc Trăng","Bạc Liêu",
  "Cà Mau","Hậu Giang","Điện Biên",
].map((name, i) => ({
  code: String(i + 1).padStart(2, "0"),
  name,
}));
