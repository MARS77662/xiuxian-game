// app/xiuxian/world/page.jsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useGame } from "../lib/gameState";

export default function WorldPage() {
  const router = useRouter();
  const { s, setS } = useGame();

  // 進入大地圖時標記當前場景
  useEffect(() => {
    setS(prev => ({ ...(prev ?? {}), phase: "world" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 回到門派大廳（主頁 /xiuxian）
  const backToSect = () => {
    setS(prev => ({ ...(prev ?? {}), phase: "sect" }));
    router.push("/xiuxian");
  };

  // 前往某個區域（若你有 /xiuxian/world/[region] 動態路由）
  const goToRegion = (key) => {
    router.push(`/xiuxian/world/${key}`);
  };

  // 大地圖節點（先放靜態，之後接資料即可；用 useMemo 保持決定性，避免 hydration 警告）
  const regions = useMemo(() => ([
    { key: "north", name: "北域 · 玄冰荒原", level: "練氣 3+" },
    { key: "east",  name: "東海 · 沉龍海溝", level: "築基 1+" },
    { key: "south", name: "南境 · 朱炎砂海", level: "練氣 7+" },
    { key: "west",  name: "西陸 · 風沙古道", level: "煉體 9+" },
  ]), []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">大地圖</h1>
        <button
          onClick={backToSect}
          className="px-3 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
        >
          回到門派大廳
        </button>
      </div>

      <ol className="space-y-2">
        {regions.map(r => (
          <li
            key={r.key}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60"
          >
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="text-xs text-slate-400">建議境界：{r.level}</div>
            </div>
            <button
              onClick={() => goToRegion(r.key)}
              className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              前往
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
