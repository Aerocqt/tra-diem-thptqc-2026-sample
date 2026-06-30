/**
 * app.js
 * ------------------------------------------------------------------
 * Điều phối toàn bộ luồng: đồng bộ giờ -> waiting room / form ->
 * tra cứu -> hiển thị kết quả.
 * ------------------------------------------------------------------
 */

(function () {
  const el = {
    waiting: document.getElementById("waitingRoom"),
    waitingDays: document.getElementById("cdDays"),
    waitingHours: document.getElementById("cdHours"),
    waitingMinutes: document.getElementById("cdMinutes"),
    waitingSeconds: document.getElementById("cdSeconds"),
    clockStatus: document.getElementById("clockStatus"),
    clockStatusText: document.getElementById("clockStatusText"),

    lookupSection: document.getElementById("lookupSection"),
    form: document.getElementById("lookupForm"),
    provinceSelect: document.getElementById("provinceSelect"),
    sbdInput: document.getElementById("sbdInput"),
    sbdError: document.getElementById("sbdError"),
    captchaCanvas: document.getElementById("captchaCanvas"),
    captchaRefresh: document.getElementById("captchaRefresh"),
    captchaInput: document.getElementById("captchaInput"),
    captchaError: document.getElementById("captchaError"),
    submitBtn: document.getElementById("submitBtn"),
    progress: document.getElementById("progress"),

    banner: document.getElementById("banner"),
    bannerText: document.getElementById("bannerText"),

    resultCard: document.getElementById("resultCard"),
    resultName: document.getElementById("resultName"),
    resultMeta: document.getElementById("resultMeta"),
    resultChip: document.getElementById("resultChip"),
    scoreGrid: document.getElementById("scoreGrid"),
    blockList: document.getElementById("blockList"),
  };

  /* ---------------------------------------------------------------
     Khởi tạo dropdown tỉnh/thành
  --------------------------------------------------------------- */
  function populateProvinces() {
    const fragment = document.createDocumentFragment();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Chọn tỉnh / thành phố";
    placeholder.disabled = true;
    placeholder.selected = true;
    fragment.appendChild(placeholder);

    PROVINCES.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.code;
      opt.textContent = `${p.code} — ${p.name}`;
      fragment.appendChild(opt);
    });
    el.provinceSelect.appendChild(fragment);
  }

  /* ---------------------------------------------------------------
     Ripple effect cho button (M3 style)
  --------------------------------------------------------------- */
  function attachRipple(button) {
    button.addEventListener("click", (e) => {
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height);
      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  /* ---------------------------------------------------------------
     Waiting room / Countdown
  --------------------------------------------------------------- */
  let countdownTimer = null;
  let revealed = false;

  function pad(n) { return String(n).padStart(2, "0"); }

  function renderCountdown(diffMs) {
    const totalSec = Math.max(0, Math.floor(diffMs / 1000));
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    el.waitingDays.textContent = pad(days);
    el.waitingHours.textContent = pad(hours);
    el.waitingMinutes.textContent = pad(minutes);
    el.waitingSeconds.textContent = pad(seconds);
  }

  function tick() {
    const target = new Date(APP_CONFIG.RELEASE_TIME_ISO).getTime();
    const now = ServerClock.now();
    const diff = target - now;

    if (diff <= 0 && !revealed) {
      revealed = true;
      clearInterval(countdownTimer);
      revealLookupForm();
      return;
    }
    if (!revealed) renderCountdown(diff);
  }

  function revealLookupForm() {
    el.waiting.style.display = "none";
    el.lookupSection.style.display = "block";
    el.lookupSection.classList.add("fade-in");
    setFormEnabled(true);
    Captcha.draw(el.captchaCanvas);
  }

  function setClockStatus(ok, label) {
    el.clockStatus.classList.toggle("clock-status--ok", ok === true);
    el.clockStatus.classList.toggle("clock-status--err", ok === false);
    el.clockStatusText.textContent = label;
  }

  async function initClock() {
    setClockStatus(null, "Đang đồng bộ giờ máy chủ…");
    const result = await ServerClock.sync();
    if (result.ok) {
      setClockStatus(true, `Đã đồng bộ giờ thực (nguồn: ${result.source})`);
    } else {
      setClockStatus(false, "Không thể đồng bộ giờ máy chủ — đang dùng giờ dự phòng, kết quả đếm ngược có thể không chính xác tuyệt đối.");
    }
    ServerClock.startAutoResync();

    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------------
     Form state
  --------------------------------------------------------------- */
  function setFormEnabled(enabled) {
    [el.provinceSelect, el.sbdInput, el.captchaInput, el.submitBtn].forEach((node) => {
      node.disabled = !enabled;
    });
  }

  function setFieldError(fieldWrap, errorEl, message) {
    if (message) {
      fieldWrap.classList.add("field--error");
      errorEl.textContent = message;
    } else {
      fieldWrap.classList.remove("field--error");
      errorEl.textContent = "";
    }
  }

  function validateSbd(value) {
    const re = new RegExp(`^\\d{${APP_CONFIG.TOTAL_SBD_DIGITS}}$`);
    return re.test(value);
  }

  /* ---------------------------------------------------------------
     Data fetching theo cấu trúc /data/{maTinh}/{prefix}.json
  --------------------------------------------------------------- */
  function buildDataUrl(maTinh, sbd) {
    // prefix = N chữ số ngay sau mã tỉnh, dùng để phân mảnh file dữ liệu.
    const start = 2; // 2 ký tự đầu của SBD luôn là mã tỉnh
    const prefix = sbd.substring(start, start + APP_CONFIG.SBD_PREFIX_LENGTH);
    return APP_CONFIG.DATA_URL_TEMPLATE
      .replace("{maTinh}", maTinh)
      .replace("{prefix}", prefix);
  }

  async function fetchScoreRecord(maTinh, sbd) {
    const url = buildDataUrl(maTinh, sbd);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      if (res.status === 404) return { notFound: true };
      throw new Error(`Lỗi tải dữ liệu (HTTP ${res.status})`);
    }
    const json = await res.json();
    const record = json[sbd];
    if (!record) return { notFound: true };
    return { record };
  }

  /* ---------------------------------------------------------------
     Render kết quả
  --------------------------------------------------------------- */
  function renderResult(sbd, record) {
    el.resultName.textContent = record.hoTen || "(Chưa có dữ liệu họ tên)";
    el.resultMeta.textContent = `SBD: ${sbd}${record.ngaySinh ? " · Ngày sinh: " + record.ngaySinh : ""}`;
    el.resultChip.textContent = "Đã có điểm";

    el.scoreGrid.innerHTML = "";
    Object.entries(SUBJECT_LABELS).forEach(([key, label]) => {
      const value = record.diem ? record.diem[key] : undefined;
      if (typeof value !== "number") return;
      const tile = document.createElement("div");
      tile.className = "score-tile";
      tile.innerHTML = `
        <div class="score-tile__value">${value.toFixed(2).replace(/\.?0+$/, (m) => (m === "." ? "" : m))}</div>
        <div class="score-tile__label">${label}</div>
      `;
      el.scoreGrid.appendChild(tile);
    });

    const blocks = computeBlockScores(record.diem || {});
    el.blockList.innerHTML = "";
    if (blocks.length === 0) {
      el.blockList.innerHTML = `<div class="block-row__subjects">Chưa đủ điểm để tính khối xét tuyển.</div>`;
    } else {
      blocks.forEach((b) => {
        const row = document.createElement("div");
        row.className = "block-row";
        row.innerHTML = `
          <div>
            <div class="block-row__name">${b.name}</div>
            <div class="block-row__subjects">${b.subjects.join(" · ")}</div>
          </div>
          <div class="block-row__total">${b.total.toFixed(2)}</div>
        `;
        el.blockList.appendChild(row);
      });
    }

    el.resultCard.classList.add("show", "fade-in");
  }

  function showBanner(message) {
    el.bannerText.textContent = message;
    el.banner.style.display = "flex";
  }

  function hideBanner() {
    el.banner.style.display = "none";
  }

  /* ---------------------------------------------------------------
     Submit handler
  --------------------------------------------------------------- */
  async function handleSubmit(e) {
    e.preventDefault();
    hideBanner();
    el.resultCard.classList.remove("show");

    const maTinh = el.provinceSelect.value;
    const sbd = el.sbdInput.value.trim();
    const captchaValue = el.captchaInput.value;

    let valid = true;

    if (!maTinh) {
      setFieldError(el.provinceSelect.closest(".field"), el.sbdError, "");
      showBanner("Vui lòng chọn tỉnh / thành phố.");
      valid = false;
    }

    if (!validateSbd(sbd)) {
      setFieldError(el.sbdInput.closest(".field"), el.sbdError, `SBD phải gồm đúng ${APP_CONFIG.TOTAL_SBD_DIGITS} chữ số.`);
      valid = false;
    } else {
      setFieldError(el.sbdInput.closest(".field"), el.sbdError, "");
    }

    if (!Captcha.verify(captchaValue)) {
      setFieldError(el.captchaInput.closest(".field"), el.captchaError, "Mã xác nhận không đúng.");
      Captcha.draw(el.captchaCanvas);
      el.captchaInput.value = "";
      valid = false;
    } else {
      setFieldError(el.captchaInput.closest(".field"), el.captchaError, "");
    }

    if (!valid) return;

    el.submitBtn.disabled = true;
    el.progress.classList.add("active");

    try {
      const { record, notFound } = await fetchScoreRecord(maTinh, sbd);
      if (notFound) {
        showBanner("Không tìm thấy dữ liệu cho số báo danh này. Vui lòng kiểm tra lại mã tỉnh và SBD.");
      } else {
        renderResult(sbd, record);
      }
    } catch (err) {
      console.error(err);
      showBanner("Hệ thống đang quá tải hoặc dữ liệu chưa sẵn sàng. Vui lòng thử lại sau ít phút.");
    } finally {
      el.submitBtn.disabled = false;
      el.progress.classList.remove("active");
      Captcha.draw(el.captchaCanvas);
      el.captchaInput.value = "";
    }
  }

  /* ---------------------------------------------------------------
     Init
  --------------------------------------------------------------- */
  function init() {
    populateProvinces();
    setFormEnabled(false);
    attachRipple(el.submitBtn);

    el.captchaRefresh.addEventListener("click", () => {
      Captcha.draw(el.captchaCanvas);
      el.captchaInput.value = "";
    });

    el.form.addEventListener("submit", handleSubmit);

    initClock();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
