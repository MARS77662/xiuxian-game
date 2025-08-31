"use client";

function SwordStreakFX() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* 劍光主體 */}
      <div className="sword-streak" />
      <div className="sword-streak delay-700" />
      <div className="sword-streak delay-1000" />
      {/* 你也可以再加殘影或火花 */}
    </div>
  );
}

export default function Landing({ onEnter }) {
  return (
    <div className="min-h-screen relative text-slate-100">
      <img
        src="/bg/landing.jpg"
        alt="背景"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/55" />
      <SwordStreakFX />

      <div className="relative z-10 h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide mb-4">
          修仙 · 啟程
        </h1>
        <button
          onClick={onEnter}
          className="mt-8 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-900/30 text-lg"
        >
          進入修仙世界
        </button>
      </div>
    </div>
  );
}
