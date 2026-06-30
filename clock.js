/**
 * clock.js
 * ------------------------------------------------------------------
 * Đồng bộ thời gian thực từ API công khai để chống gian lận bằng
 * cách chỉnh giờ máy. Mọi nơi cần "giờ hiện tại" phải gọi
 * ServerClock.now() thay vì Date.now()/new Date().
 * ------------------------------------------------------------------
 */

const ServerClock = (() => {
  let offsetMs = 0;          // serverTime - clientTime tại thời điểm đồng bộ
  let lastSyncOk = false;
  let lastSyncSourceName = null;

  async function fetchFromSource(source) {
    const res = await fetch(source.url, { cache: "no-store" });
    if (!res.ok) throw new Error(`${source.name} HTTP ${res.status}`);
    const json = await res.json();
    const serverMs = source.parse(json);
    if (!serverMs || Number.isNaN(serverMs)) {
      throw new Error(`${source.name}: không đọc được thời gian`);
    }
    return serverMs;
  }

  async function sync() {
    for (const source of APP_CONFIG.TIME_SOURCES) {
      try {
        const before = Date.now();
        const serverMs = await fetchFromSource(source);
        const after = Date.now();
        // Bù trừ độ trễ round-trip của request.
        const roundTrip = after - before;
        const estimatedServerNow = serverMs + roundTrip / 2;
        offsetMs = estimatedServerNow - after;
        lastSyncOk = true;
        lastSyncSourceName = source.name;
        return { ok: true, source: source.name, offsetMs };
      } catch (err) {
        console.warn(`[ServerClock] Nguồn "${source.name}" lỗi:`, err.message);
      }
    }
    lastSyncOk = false;
    lastSyncSourceName = null;
    return { ok: false };
  }

  function now() {
    return Date.now() + offsetMs;
  }

  function isSynced() {
    return lastSyncOk;
  }

  function sourceName() {
    return lastSyncSourceName;
  }

  // Tự động đồng bộ lại định kỳ để bù trôi đồng hồ phiên dài.
  function startAutoResync() {
    setInterval(sync, APP_CONFIG.RESYNC_INTERVAL_MS);
  }

  return { sync, now, isSynced, sourceName, startAutoResync };
})();
