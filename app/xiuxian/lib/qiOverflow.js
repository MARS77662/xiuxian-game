"use client";
import { readSave, writeSave } from "./save";
import { enqueueEvent } from "./eventEngine";

/** 檢查並處罰：在更新 qi 後呼叫 */
export function punishQiOverflow() {
  const s = readSave();
  const qi = Number(s?.qi || 0);
  const qiMax = Number(
    s?.qiMax ?? s?.maxQi ?? s?.qi_cap ?? s?.energyMax ?? 0
  );
  if (!qiMax || qi <= qiMax) return false;

  const now = Date.now();
  s.status = s.status || {};

  // 1) 洩壓：把 70% 溢出量排掉
  const over = qi - qiMax;
  const leak = Math.ceil(over * 0.7);
  s.qi = Math.max(qiMax, qi - leak);

  // 2) 狀態：靈脈灼熱
  const ratio = Math.min(3, over / qiMax); // 最大放大到 3 倍
  const base = 30_000;                     // 30s
  const extra = Math.floor(ratio * 30_000);// 最多 +90s
  const until = now + base + extra;

  s.status.qiOverheatUntil = Math.max(s.status.qiOverheatUntil || 0, until);
  s.status.qiOverheatStacks = (s.status.qiOverheatStacks || 0) + 1;

  // 3) 修正值（僅狀態期間生效，別處讀取使用）
  s.modifiers = { ...(s.modifiers || {}) };
  s.modifiers.xpGainPct = Math.min(0, (s.modifiers.xpGainPct || 0) - 20);
  s.modifiers.breakthroughRate = (s.modifiers.breakthroughRate || 0) - 10;

  // 4) 每滿 60 秒扣 1 天壽元
  const last = s.status.lastOverheatTick || now;
  const secs = Math.floor((now - last) / 1000);
  if (secs >= 60) {
    const lossDays = Math.floor(secs / 60);
    if (s.lifespan && typeof s.lifespan.leftDays === "number") {
      s.lifespan.leftDays = Math.max(0, s.lifespan.leftDays - lossDays);
    } else {
      s.lifeDays = Math.max(0, Number(s.lifeDays || 0) - lossDays);
    }
    s.status.lastOverheatTick = now;
  } else {
    s.status.lastOverheatTick = last;
  }

  // 5) 第一次溢出時丟一個事件
  if (!s.status.firedQiOverflowEvent) {
    try { enqueueEvent("qi_overflow_warning"); } catch {}
    s.status.firedQiOverflowEvent = true;
  }

  writeSave(s);
  return true;
}

/** 是否處於灼熱 */
export function isQiOverheat(save) {
  return (save?.status?.qiOverheatUntil || 0) > Date.now();
}
