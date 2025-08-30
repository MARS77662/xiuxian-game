// /core/game/stateMachine.ts

import { GameCtx, Player, Phase, Attributes, Faction } from "./types";
import { bus } from "./eventBus";
import * as cultivate from "@/core/cultivation"; // 你前面已經加了 shim，OK

const DEFAULT_ATTR: Attributes = { 體質: 0, 智力: 0, 才貌: 0, 家境: 0 };

// ✅ 修正：安全合併 initial（Partial<Player>）到完整 Player
export function createCtx(initial?: Partial<Player>): GameCtx {
  const i = initial ?? {};
  const player: Player = {
    // name 與 屬性是必填，用預設補齊
    name: (i as any).name ?? "",
    屬性: { ...DEFAULT_ATTR, ...(i as any).屬性 },

    // 其餘欄位原樣帶入（不覆蓋上面兩個）
    ...(i as Omit<Partial<Player>, "name" | "屬性">),
  } as Player;

  return { phase: "BOOT", player, lastTick: performance.now() };
}

// 其餘程式碼維持原樣
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
  if (ctx.player.門派?.bonuses){
    for (const k of Object.keys(ctx.player.門派.bonuses) as (keyof Attributes)[]){
      ctx.player.屬性[k] += ctx.player.門派.bonuses[k] ?? 0;
    }
  }
  toScene(ctx);
}

export function toScene(ctx: GameCtx){
  ctx.phase = "SCENE";
  cultivate.start(ctx.player);
  ctx.lastTick = performance.now();
  loop(ctx);
  bus.emit("phase", ctx.phase);
}

function loop(ctx: GameCtx){
  const now = performance.now();
  const dt = (now - ctx.lastTick)/1000;
  ctx.lastTick = now;

  cultivate.tick(ctx.player, dt);

  if (Math.random() < rollEventChance(ctx.player, dt)) bus.emit("roll:event");

  requestAnimationFrame(()=>loop(ctx));
}

function rollEventChance(p: Player, dt: number){
  const base = 0.005;
  const bonus = (p.屬性.才貌*0.0003 + p.屬性.家境*0.0002);
  return (base + bonus) * dt;
}
