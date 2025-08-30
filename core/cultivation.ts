// /core/cultivation.ts
// 臨時 shim：讓 core/game/actions.ts 可編譯；之後你要用真的核心再換掉。

export function start(_player: any): void {
  // 可留白（或寫入初始化邏輯）
}

export function tick(_player: any, _dtSec: number): void {
  // 可留白（或寫入每幀邏輯）
}

export function addQi(player: any, amount: number): void {
  if (typeof player.qi !== "number") player.qi = 0;
  player.qi += amount;
}

export function breakthrough(_player: any): boolean {
  // 先回傳失敗（或自行替換成你的真實判定）
  return false;
}
