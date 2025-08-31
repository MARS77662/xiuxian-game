"use client";
import { createContext, useContext, useMemo, useState } from "react";

// ==================
// 全域遊戲狀態 Context
// ==================
const GameCtx = createContext(null);

// ✅ 預設狀態（之後要加欄位就在這裡改）
function defaultState() {
  return {
    qi: 0,
    stones: 0,
    realm: "入門",
  };
}

// ==================
// Provider
// ==================
export function GameProvider({ children, initial }) {
  // 如果沒有傳 initial，就自動用 defaultState()
  const boot = useMemo(() => initial ?? defaultState(), [initial]);
  const [s, setS] = useState(boot);

  const value = useMemo(() => ({ s, setS }), [s]);
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

// ==================
// Hook：呼叫遊戲狀態
// ==================
export function useGame() {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
