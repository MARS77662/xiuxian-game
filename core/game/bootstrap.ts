import { createCtx, toName, setName, toFaction, chooseFaction, toAllocate, allocate, toScene } from "./stateMachine";
import { GameCtx, Attributes, Faction, FactionsJson } from "./types";
import { setCurrentPlayer, bindEventRollers } from "./randomEvents";

export async function bootGame(loadFactions: ()=>Promise<FactionsJson>){
  const ctx = createCtx();
  const data = await loadFactions();
  bindEventRollers();
  toName(ctx);

  // —— 這段交給你的 UI （示例用途）——
  // 1) 命名
  // setName(ctx, "張三"); 
  // 2) 選派
  // chooseFaction(ctx, "正派", data.factions["正派"][0]);
  // 3) 配點
  // allocate(ctx, {體質:4,智力:6,才貌:4,家境:2});
  // 4) 進場景
  // toScene(ctx);

  // 讓事件系統能拿到 player
  setCurrentPlayer(ctx.player);

  return { ctx, data };
}
