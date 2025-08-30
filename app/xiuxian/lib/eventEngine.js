"use client";
import { readSave, writeSave, readEventsState, writeEventsState, spendTime } from "./save";

// 讀事件包
async function loadPacks() {
  const res = await fetch("/data/events/core.json", { cache: "no-store" });
  if (!res.ok) throw new Error("載入事件失敗");
  const data = await res.json();
  return data?.events || [];
}

// 解析境界等級
function realmRank(save) {
  const key = save?.realm?.key || "";
  const name = (save?.realm?.name || "").replace(/\s/g, "");
  const map = { lianqi:1, 煉氣:1, zhujii:2, 筑基:2, jindan:3, 金丹:3, yuanying:4, 元嬰:4, huashen:5, 化神:5, heiti:6, 合體:6, dacheng:7, 大乘:7, dujie:8, 渡劫:8 };
  return map[key] || map[name] || 1;
}

// 條件檢查
function ok(save, flags, req = {}) {
  if (req.minRealm && realmRank(save) < (req.minRealmRank || 1)) return false;
  if (Array.isArray(req.requiredFlags) && req.requiredFlags.some(f => !flags[f])) return false;
  if (Array.isArray(req.absentFlags) && req.absentFlags.some(f => !!flags[f])) return false;
  if (typeof req.minGold === "number" && Number(save?.gold || 0) < req.minGold) return false;
  return true;
}

// 權重抽取
function pickWeighted(list) {
  const total = list.reduce((s, e) => s + (e.weight || 1), 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const e of list) {
    r -= (e.weight || 1);
    if (r <= 0) return e;
  }
  return list[0] || null;
}

// 套用效果
function applyEffects(effects = {}) {
  const save = readSave();
  let next = { ...save };

  // 數值
  if (typeof effects.gold === "number") next.gold = Number(next.gold || 0) + effects.gold;
  if (typeof effects.qi === "number")   next.qi   = Number(next.qi   || 0) + effects.qi;
  if (typeof effects.xp === "number")   next.xp   = Number(next.xp   || 0) + effects.xp;

  // karma
  if (effects.merit || effects.sin) {
    next.merit = Number(next.merit || 0) + (effects.merit || 0);
    next.sin   = Number(next.sin   || 0) + (effects.sin   || 0);
  }

  // 時間/壽元
  if (effects.time) spendTime(effects.time);

  // 寫回
  writeSave(next);

  // 旗標 & 追加事件
  const es = readEventsState();
  const nf = { ...(es.flags || {}) };
  (effects.flagsAdd || []).forEach(k => nf[k] = true);
  const nq = [...(es.queue || [])];
  (effects.enqueue || []).forEach(id => nq.push(id));
  writeEventsState({ queue: nq, flags: nf });

  return next;
}

// 對外 API
export async function getEligible(save, flags) {
  const pool = await loadPacks();
  return pool.filter(e => ok(save, flags, e.requires));
}

export async function drawRandom(save, flags) {
  const list = await getEligible(save, flags);
  if (!list.length) return null;
  return pickWeighted(list);
}

export function enqueueEvent(id) {
  const es = readEventsState();
  es.queue = es.queue || [];
  if (!es.queue.includes(id)) es.queue.push(id);
  writeEventsState(es);
  return es.queue;
}

export async function getById(id) {
  const pool = await loadPacks();
  return pool.find(e => e.id === id) || null;
}

export function resolveChoice(event, choiceKey) {
  const choice = (event.choices || []).find(c => c.key === choiceKey);
  if (!choice) return { ok: false, message: "沒有這個選項" };

  // 檢查需求
  const save = readSave();
  const es = readEventsState();
  if (!ok(save, es.flags || {}, choice.requires)) {
    return { ok: false, message: "條件不足" };
  }

  // 套用效果
  applyEffects(choice.effects || {});

  // 移除佇列中的該事件（如果是從佇列打開）
  const q = (es.queue || []).filter(id => id !== event.id);
  writeEventsState({ ...es, queue: q });

  return { ok: true, message: choice.resultText || "已處理" };
}
