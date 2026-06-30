# Tra cứu điểm thi THPTQG 2026 — Material 3

Trang web tĩnh tra điểm thi, thiết kế theo Material Design 3, triển khai trực tiếp trên GitHub Pages (không cần backend).

## 1. Cấu trúc thư mục

```
index.html
assets/
  css/styles.css      # design tokens M3 + toàn bộ component
  js/config.js        # ⚙️ cấu hình: giờ công bố, nguồn time API, danh sách tỉnh
  js/clock.js         # đồng bộ giờ thực, chống chỉnh giờ máy
  js/captcha.js       # sinh & vẽ captcha canvas
  js/scoring.js       # tính điểm khối xét tuyển A00/A01/B00/C00/D01
  js/app.js           # điều phối UI + fetch dữ liệu
data/
  {maTinh}/{prefix}.json   # dữ liệu điểm, chia nhỏ theo tỉnh + 4 số đầu của phần số SBD
```

## 2. Cách dữ liệu được truy vấn

Số báo danh (SBD) gồm 8 chữ số: 2 số đầu = mã tỉnh, 6 số sau là số thứ tự.
Ứng dụng lấy 4 chữ số ngay sau mã tỉnh làm "khoá phân mảnh" (`prefix`) để mỗi
file JSON chỉ chứa khoảng 100 thí sinh thay vì cả tỉnh:

```
SBD = 01 0012 34
       │   │   └─ 2 số cuối, không dùng để chọn file
       │   └───── prefix → tên file data/01/0012.json
       └───────── mã tỉnh → tên thư mục data/01/
```

File JSON là một object, key là SBD đầy đủ:

```json
{
  "01001234": {
    "hoTen": "Nguyễn Văn An",
    "ngaySinh": "15/03/2008",
    "diem": {
      "toan": 8.6, "van": 7.75, "ngoaiNgu": 9.2,
      "vatLy": 8.25, "hoaHoc": 7.5, "sinhHoc": 6.75,
      "lichSu": null, "diaLy": null, "gdcd": null
    }
  }
}
```

Môn không thi để `null` — hệ thống tự ẩn khỏi bảng điểm và loại khối xét
tuyển liên quan nếu thiếu môn.

Hai bộ dữ liệu mẫu có sẵn để test: `01/0012.json` (SBD `01001234`,
`01001235`) và `02/0056.json` (SBD `02005678`).

> Mã tỉnh trong `assets/js/config.js` hiện đánh số tuần tự 01–63 để minh
> hoạ cấu trúc. Trước khi triển khai thật, thay bằng mã tỉnh chính thức
> theo quy chế thi của Bộ GD&ĐT năm tương ứng, và đổi tên thư mục
> `data/{maTinh}/` cho khớp.

## 3. Đổi nguồn dữ liệu sau này

Chỉ cần sửa một dòng trong `assets/js/config.js`:

```js
DATA_URL_TEMPLATE: "data/{maTinh}/{prefix}.json",
```

Ví dụ đổi sang API thật: `"https://api.example.com/scores/{maTinh}/{prefix}"`.
Toàn bộ phần còn lại của app không cần sửa.

## 4. Khoá thời gian chống gian lận

`assets/js/clock.js` lấy giờ thực từ `worldtimeapi.org`, dự phòng bằng
`worldclockapi.com`. App tự tính độ lệch (offset) giữa giờ máy chủ và giờ
máy người dùng, rồi dùng `ServerClock.now()` thay cho `Date.now()` ở mọi
nơi — vì vậy chỉnh giờ hệ điều hành không giúp xem điểm sớm. Nếu cả hai
API đều lỗi, hệ thống cảnh báo rõ trên UI thay vì âm thầm tin giờ máy.

Đổi mốc công bố điểm tại `RELEASE_TIME_ISO` trong `config.js` (định dạng
UTC, ví dụ `08:00 01/07/2026` giờ Việt Nam = `2026-07-01T01:00:00Z`).

## 5. Captcha

Captcha vẽ hoàn toàn trên `<canvas>` (`assets/js/captcha.js`): ký tự xoay/lệch
ngẫu nhiên, nền gradient, nhiễu đường cong + chấm. Đây là lớp cản bot ở mức
client — chỉ mang tính UX/giảm spam cơ bản. Nếu cần chống bot thực sự
nghiêm ngặt, hãy xác thực captcha lại ở server (reCAPTCHA/hCaptcha hoặc
captcha server-side) trước khi trả dữ liệu, vì logic JS phía client luôn
có thể bị đọc/bypass.

## 6. Triển khai lên GitHub Pages

1. Đẩy toàn bộ thư mục này lên một repo GitHub.
2. Vào **Settings → Pages**, chọn nhánh chứa code (vd. `main`) và thư mục `/ (root)`.
3. Đợi vài phút, trang sẽ có sẵn tại `https://<username>.github.io/<repo>/`.

Không cần build step, không cần server — toàn bộ là HTML/CSS/JS tĩnh + file JSON tĩnh.
