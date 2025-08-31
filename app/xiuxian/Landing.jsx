"use client";

function SwordStreakFX() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden z-30"
    >
      {/* 三道劍光（改用 fx-* 名稱避免和 tailwind 衝突） */}
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
        /* ⚠️ 不再停用「減少動態」，確保你一定看得到 */
      `}</style>
    </div>
  );
}

export default function Landing({ onEnter }) {
  return (
    <div className="min-h-screen relative text-slate-100">
      {/* 背景圖：不存在就自動 fallback */}
      <img
        src="/bg/landing.jpg"
        onError={(e) => {
          e.currentTarget.src = "/bg/bg-clouds.jpg";
        }}
        alt="背景"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* 暗色遮罩放在 z-20，劍光 z-30 就會在上面 */}
      <div className="absolute inset-0 bg-black/55 z-20" />

      {/* 劍光 */}
      <SwordStreakFX />

      {/* 內容（z-40） */}
      <div className="relative z-40 h-screen flex flex-col items-center justify-center px-6 text-center">
        <Image
  src="/logo.png"       // 你的 Logo 圖檔
  alt="修仙啟程"
  width={260}           // 可以調大一點，取代標題文字
  height={260}
  priority
  className="mb-4 drop-shadow-[0_10px_35px_rgba(0,0,0,.6)]"
/>


        <div className="space-y-2">
          <p className="text-2xl md:text-3xl font-bold text-slate-100">
            佛非是我，凭何渡我。
          </p>
          <p className="text-xl md:text-2xl text-slate-300">
            天未助我，凭何问我。
          </p>
        </div>

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
