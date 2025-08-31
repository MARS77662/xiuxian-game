// app/xiuxian/page.jsx
"use client";

import { useState } from "react";

/** ① 開場頁（登入/封面） */
function Landing({ onEnter }) {
  return (
    <div className="min-h-screen grid place-items-center text-slate-100 bg-gradient-to-b from-slate-900 to-black">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold">修仙論道 · MVP</h1>
        <p className="text-slate-300">修煉 → 強化 → 突破 → 飛升</p>
        <button
          onClick={onEnter}
          className="px-6 py-3 rounded-2xl bg-emerald-600/90 hover:bg-emerald-500 transition"
        >
          進入門派
        </button>
      </div>
    </div>
  );
}

/** ② 門派大廳（主 Hub） */
function SectHub({ onCultivate }) {
  return (
    <main className="min-h-screen px-4 py-8 text-slate-100">
      <header className="max-w-6xl mx-auto flex items-end gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold">門派大廳</h2>
          <p className="text-slate-300">主場景（在此導航到各子系統）</p>
        </div>
        <div className="flex-1" />
        <button
          onClick={onCultivate}
          className="px-4 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 transition"
        >
          打坐修煉
        </button>
      </header>

      <section className="max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-800/60">任務</div>
        <div className="p-4 rounded-2xl bg-slate-800/60">法寶</div>
        <div className="p-4 rounded-2xl bg-slate-800/60">功法</div>
      </section>
    </main>
  );
}

/** ③ 打坐覆蓋層 */
function CultivateOverlay({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur">
      <div className="w-[min(92vw,600px)] rounded-2xl p-6 bg-slate-900 border border-slate-700">
        <h3 className="text-2xl font-bold mb-2">打坐中…</h3>
        <p className="text-slate-300 mb-6">靈氣在經脈中流轉，心神內觀。</p>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition"
        >
          收功
        </button>
      </div>
    </div>
  );
}

/** 唯一的 default 匯出 */
export default function XiuxianPage() {
  const [phase, setPhase] = useState("landing"); // 'landing' | 'sect'
  const [showCultivate, setShowCultivate] = useState(false);

  return (
    <>
      {phase === "landing" && <Landing onEnter={() => setPhase("sect")} />}
      {phase === "sect" && (
        <>
          <SectHub onCultivate={() => setShowCultivate(true)} />
          <CultivateOverlay open={showCultivate} onClose={() => setShowCultivate(false)} />
        </>
      )}
    </>
  );
}
