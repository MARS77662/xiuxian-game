"use client";

// 與現有 SAVE_KEY 對齊
export const SAVE_KEY = "xiuxian-save-v1";
export const EVENTS_KEY = "xiuxian-events-v1";

export function readSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "null") || {}; }
  catch { return {}; }
}
export function writeSave(next) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(next || {})); } catch {}
}
export function patchSave(patch) {
  const cur = readSave();
  const next = { ...cur, ...patch };
  writeSave(next);
  return next;
}

// 事件狀態（佇列與旗標）
export function readEventsState() {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || "null") || { queue: [], flags: {} };
  } catch {
    return { queue: [], flags: {} };
  }
}
export function writeEventsState(state) {
  try { localStorage.setItem(EVENTS_KEY, JSON.stringify(state)); } catch {}
}

// 小工具：壽元/時間結算（天、炷香）
export function spendTime({ days = 0, incense = 0 } = {}) {
  const save = readSave();
  const time = { ...(save.time || {}) };
  time.days = Number(time.days || 0) + days + Math.floor((incense || 0) / 12);
  time.incense = ((Number(time.incense || 0) + (incense || 0)) % 12);

  // 壽元扣減（只在行動時扣）
  const life = { ...(save.lifespan || { max: 120, leftDays: 120 * 365 }) };
  const usedDays = days + Math.floor((incense || 0) / 12);
  life.leftDays = Math.max(0, Number(life.leftDays || 0) - usedDays);

  writeSave({ ...save, time, lifespan: life });
  return { time, lifespan: life };
}
