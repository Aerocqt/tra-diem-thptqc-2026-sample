/**
 * scoring.js
 * ------------------------------------------------------------------
 * Tính tổng điểm theo các khối xét tuyển truyền thống dựa trên điểm
 * thực tế trả về từ JSON. Khối nào thiếu môn (thí sinh không thi)
 * sẽ tự động bị loại khỏi danh sách hiển thị.
 * ------------------------------------------------------------------
 */

const SUBJECT_LABELS = {
  toan: "Toán",
  van: "Ngữ văn",
  ngoaiNgu: "Ngoại ngữ",
  vatLy: "Vật lý",
  hoaHoc: "Hóa học",
  sinhHoc: "Sinh học",
  lichSu: "Lịch sử",
  diaLy: "Địa lý",
  gdcd: "GDKT&PL",
};

const SCORE_BLOCKS = [
  { code: "A00", name: "Khối A00", subjects: ["toan", "vatLy", "hoaHoc"] },
  { code: "A01", name: "Khối A01", subjects: ["toan", "vatLy", "ngoaiNgu"] },
  { code: "B00", name: "Khối B00", subjects: ["toan", "hoaHoc", "sinhHoc"] },
  { code: "C00", name: "Khối C00", subjects: ["van", "lichSu", "diaLy"] },
  { code: "D01", name: "Khối D01", subjects: ["toan", "van", "ngoaiNgu"] },
];

function computeBlockScores(diem) {
  return SCORE_BLOCKS.map((block) => {
    const values = block.subjects.map((s) => diem[s]);
    const hasAll = values.every((v) => typeof v === "number");
    if (!hasAll) return null;
    const total = values.reduce((sum, v) => sum + v, 0);
    return {
      code: block.code,
      name: block.name,
      subjects: block.subjects.map((s) => SUBJECT_LABELS[s]),
      total: Math.round(total * 100) / 100,
    };
  }).filter(Boolean);
}
