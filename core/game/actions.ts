import { Player } from "./types";
import { bus } from "./eventBus";
import * as cultivate from "@/core/cultivation";

// —— 斬妖除魔 —— //
export function demonHunt(p: Player, areaDifficulty = 1){
  const winP = huntWinRate(p, areaDifficulty);
  if (Math.random() < winP){
    const qi = Math.round(8 + p.屬性.智力*1.2 + p.屬性.體質*0.8);
    cultivate.addQi(p, qi);
    bus.emit("combat:win", {winP, qi});
  }else{
    // 受傷：給一個臨時負面狀態（若你的核心有 Buff/Modifier，就用核心API）
    // 這裡先示範簡化做法：少量流失 qi（不建議太狠）
    cultivate.addQi(p, -5);
    bus.emit("combat:lose", {winP});
  }
}

export function huntWinRate(p: Player, diff: number){
  const base = 0.45; // 基礎勝率
  const stat = p.屬性.體質*0.02 + p.屬性.智力*0.015;
  const faction = p.門派?.tags.includes("劍修") ? 0.05 : 0;
  const adjust = base + stat + faction - (diff*0.08);
  return clamp(adjust, 0.05, 0.95);
}

function clamp(x:number, a:number, b:number){ return Math.max(a, Math.min(b, x)); }

// —— 閉關（修煉加速一小段時間） —— //
export function meditate(p: Player){
  // 若你的核心有「短暫加速」介面，請改用核心API（ex: addModifier）
  // 這裡給個即時獎勵示範：
  const qi = Math.round(5 + p.屬性.智力*1.5);
  cultivate.addQi(p, qi);
  bus.emit("meditate:done", {qi});
}

// —— 探索（偏向觸發事件與掉落） —— //
export function explore(p: Player){
  // 交由事件系統決定結果：發一個請求事件
  bus.emit("explore");
}
