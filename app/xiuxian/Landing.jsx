"use client";

import Image from "next/image";

function SwordStreakFX() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden z-30"
    >
      {/* 三道劍光 */}
      <div className="fx-streak" style={{ animationDelay: "0s" }} />
      <div className="fx-streak" style={{ animationDelay: "0.7s" }} />
      <div className="fx-streak" style={{ animationDelay: "1s" }} />

      {/* 內嵌 CSS，保證載入 */}
      <style jsx global>{`
        .fx-streak {
          position: absolute;
          left: -20vmax;
          bottom: -6vmax;
          width: 40vmax;
          height: 6px;
          transform: rotate(-12deg);
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.9) 35%,
            rgba(180, 220, 255, 0.95) 55%,
            rgba(120, 180, 255, 0.7) 70%,
            rgba(255, 255, 255, 0) 100%
          );
          filter: blur(8px) drop-shadow(0 0 12px rgba(120, 180, 255, 0.65));
          animation: swordSweep 2.4s linear infinite;
        }
        @keyframes swordSweep {
          0% {
            transform: translate3d(0, 0, 0) rotate(-12deg);
            opacity: 0;
          }
          5% {
            opacity: 0.95;
          }
          50% {
            opacity: 1;
          }
          95% {
            opacity: 0;
          }
          100% {
            transform: translate3d(140vmax, -70vmax, 0) rotate(-12deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function Landing({ onEnter }) {
  return (
    <div className="min-h-screen relative text-slate-100">
      {/* 背景圖（失敗就換雲海） */}
      <img
        src="/bg/landing.jpg"
        onError={(e) => {
          e.currentTarget.src = "/bg/bg-clouds.jpg";
        }}
        alt="背景"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* 暗色遮罩 */}
      <div className="absolute inset-0 bg-black/55 z-20" />

      {/* 劍光特效（在遮罩之上） */}
      <SwordStreakFX />

      {/* 內容層 */}
      <div className="relative z-40 h-screen flex flex-col items-center justify-center px-6 text-center">
	{/* Logo：視窗自適應大小 */}
	<div className="relative aspect-square mb-4 w-[clamp(200px,28vw,520px)]">
	  <Image
  src="/logo.png"
  alt="修仙啟程"
  width={1640}      // 原圖寬
  height={664}      // 原圖高
  priority
  className="
    mb-4 h-auto
    w-[clamp(320px,85vw,920px)]   /* 手機 85% 螢幕寬，最大 920px */
    drop-shadow-[0_10px_35px_rgba(0,0,0,.6)]
  "
/>




        {/* 副標語 */}
        <div className="space-y-2">
          <p className="text-2xl md:text-3xl font-bold text-slate-100">
            佛非是我，凭何渡我。
          </p>
          <p className="text-xl md:text-2xl text-slate-300">
            天未助我，凭何问我。
          </p>
        </div>

        {/* 進入按鈕 */}
        <button
          onClick={onEnter}
          className="mt-8 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-900/30 text-lg"
        >
          進入修仙世界
        </button>
      </div>
    </div>
  );