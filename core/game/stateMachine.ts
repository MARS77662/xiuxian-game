import { GameCtx, Player, Phase, Attributes, Faction } from "./types";
import { bus } from "./eventBus";
import * as cultivate from "@/core/cultivation"; // ← 你的核心

export function createCtx(initial?: Partial<Player>): GameCtx {
  const player: Player = initial ?? { name: "", 屬性:{體質:0,智力:0,才貌:0,家境:0} };
  return { phase:"BOOT", player, lastTick: performance.now() };
}

// —— 流程節點 —— //
export function toName(ctx: GameCtx){ ctx.phase = "NAME"; bus.emit("phase", ctx.phase); }
export function setName(ctx: GameCtx, name: string){ ctx.player.name = name.trim() || "無名散修"; toFaction(ctx); }

export function toFaction(ctx: GameCtx){ ctx.phase = "FACTION"; bus.emit("phase", ctx.phase); }
export function chooseFaction(ctx: GameCtx, type: "正派"|"邪修"|"散修", f: Faction){
  ctx.player.門派 = {...f, 類型: type};
  toAllocate(ctx);
}

export function toAllocate(ctx: GameCtx){ ctx.phase = "ALLOCATE"; bus.emit("phase", ctx.phase); }
export function allocate(ctx: GameCtx, base: Attributes){
  ctx.player.屬性 = {...base};
  // 門派加成在配點後套用
  if (ctx.player.門派?.bonuses){
    for (const k of Object.keys(ctx.player.門派.bonuses) as (keyof Attributes)[]){
      ctx.player.屬性[k] += ctx.player.門派.bonuses[k] ?? 0;
    }
  }
  toScene(ctx);
}

export function toScene(ctx: GameCtx){
  ctx.phase = "SCENE";
  // 啟動你的修煉核心（不改內部）
  cultivate.start(ctx.player);
  ctx.lastTick = performance.now();
  loop(ctx);
  bus.emit("phase", ctx.phase);
}

// —— 主循環（只呼叫你的核心 tick） —— //
function loop(ctx: GameCtx){
  const now = performance.now();
  const dt = (now - ctx.lastTick)/1000;
  ctx.lastTick = now;

  cultivate.tick(ctx.player, dt);    // ← 保持你的修煉機制

  // 機率觸發突發事件（可視需要調參）
  if (Math.random() < rollEventChance(ctx.player, dt)) bus.emit("roll:event");

  requestAnimationFrame(()=>loop(ctx));
}

function rollEventChance(p: Player, dt: number){
  // 基礎 0.5%/秒，才貌高些、家境高些會多一點奇遇
  const base = 0.005;
  const bonus = (p.屬性.才貌*0.0003 + p.屬性.家境*0.0002);
  return (base + bonus) * dt;
}
