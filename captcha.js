/**
 * captcha.js
 * ------------------------------------------------------------------
 * Captcha vẽ trực tiếp trên <canvas>: ký tự xoay/lệch ngẫu nhiên +
 * nhiễu (đường kẻ, chấm) để gây khó cho OCR đơn giản.
 * Đây là lớp chống bot ở mức cơ bản (client-side); hệ thống thật
 * cần xác thực lại captcha ở server trước khi trả dữ liệu.
 * ------------------------------------------------------------------
 */

const Captcha = (() => {
  const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bỏ ký tự dễ nhầm (0,O,1,I)
  const LENGTH = 5;
  let currentText = "";

  function randomChar() {
    return CHARS[Math.floor(Math.random() * CHARS.length)];
  }

  function randomColor(alphaMin, alphaMax) {
    const r = 20 + Math.floor(Math.random() * 60);
    const g = 40 + Math.floor(Math.random() * 60);
    const b = 80 + Math.floor(Math.random() * 90);
    const a = (alphaMin + Math.random() * (alphaMax - alphaMin)).toFixed(2);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function draw(canvas) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    currentText = Array.from({ length: LENGTH }, randomChar).join("");

    // Nền: gradient nhẹ theo tông M3 surface-container.
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#E8EEF7");
    grad.addColorStop(1, "#DCE5F0");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Nhiễu: đường cong.
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = randomColor(0.25, 0.45);
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.bezierCurveTo(
        Math.random() * w, Math.random() * h,
        Math.random() * w, Math.random() * h,
        Math.random() * w, Math.random() * h
      );
      ctx.stroke();
    }

    // Nhiễu: chấm.
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = randomColor(0.2, 0.5);
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ký tự: xoay + lệch dọc ngẫu nhiên, font đậm.
    const charWidth = w / (LENGTH + 1);
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    currentText.split("").forEach((ch, i) => {
      const x = charWidth * (i + 1);
      const y = h / 2 + (Math.random() - 0.5) * 10;
      const angle = (Math.random() - 0.5) * 0.55; // ~ +-16deg
      const fontSize = 24 + Math.floor(Math.random() * 6);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.font = `700 ${fontSize}px Roboto, Arial, sans-serif`;
      ctx.fillStyle = `rgb(${20 + Math.floor(Math.random() * 40)}, ${50 + Math.floor(Math.random() * 40)}, ${110 + Math.floor(Math.random() * 60)})`;
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    });

    // Đường kẻ phủ trên cùng để tăng độ nhiễu.
    for (let i = 0; i < 2; i++) {
      ctx.strokeStyle = randomColor(0.3, 0.5);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * h);
      ctx.lineTo(w, Math.random() * h);
      ctx.stroke();
    }
  }

  function verify(input) {
    if (!input) return false;
    return input.trim().toUpperCase() === currentText;
  }

  return { draw, verify };
})();
