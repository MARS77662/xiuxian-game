"use client";

function SwordStreakFX() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden z-20"
    >
      {/* 三道劍光 */}
      <div className="sword-streak" />
      <div className="sword-streak delay-700" />
      <div className="sword-streak delay-1000" />

      {/* （可選）幾顆星火 */}
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className="spark"
          style={{
            left: `${6 + i * 7}vw`,
            bottom: `${8 + i * 4}vh`,
            animationDelay: `${(i % 5) * 0.28}s`,
          }}
        />
      ))}

      {/* 內嵌 CSS，保證一定載入 */}
      <style jsx global>{`
        .sword-streak {
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
            rgba(255, 255, 255, 0.85) 35%,
            rgba(180, 220, 255, 0.95) 55%,
            rgba(120, 180, 255, 0.65) 70%,
            rgba(255, 255, 255, 0) 100%
          );
          filter: blur(8px) drop-shadow(0 0 12px rgba(120, 180, 255, 0.65));
          animation: sword-sweep 2.4s linear infinite;
        }
        .delay-700 {
          animation-delay: 0.7s;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        @keyframes sword-sweep {
          0% {
            transform: translate3d(0, 0, 0) rotate(-12deg);
            opacity: 0;
          }
          5% {
            opacity: 0.9;
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

        /* 星火 */
        .spark {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.95),
            rgba(255, 255, 255, 0) 70%
          );
          filter: drop-shadow(0 0 6px rgba(180, 220, 255, 0.9));
          animation: spark-fly 1.6s linear infinite;
        }
        @keyframes spark-fly {
          0% {
            transform: translate3d(0, 0, 0) scale(0.6);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          70% {
            opacity: 0.9;
          }
          100% {
            transform: translate3d(120vmax, -60vmax, 0) scale(0.3);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sword-streak,
          .spark {
            animation: none !important;
            opacity: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function Landing({ onEnter }) {
  return (
    <div className="min-h-screen relative text-slate-100">
      {/* 背景圖：如果 /bg/landing.jpg 不存在就換成雲海圖 */}
      <img
        src="/bg/landing.jpg"
        onError={(e) => {
          e.currentTarget.src = "/bg/bg-clouds.jpg";
        }}
        alt="背景"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* 暗色遮罩（放在劍光下面，避免蓋住劍光） */}
      <div className="absolute inset-0 bg-black/55 z-10" />

      {/* 劍光在遮罩之上 */}
      <SwordStreakFX />

      {/* 內容再往上疊 */}
      <div className="relative z-30 h-screen flex flex-col items-center justify-center px-6 text-center">
  <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide mb-4">
    修仙 · 啟程
  </h1>

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
