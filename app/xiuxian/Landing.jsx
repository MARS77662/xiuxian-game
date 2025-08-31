// app/xiuxian/Landing.jsx
"use client";

import Image from "next/image";

/* —— 飛劍光效 —— */
function SwordStreakFX() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden z-30"
    >
      <div className="fx-streak" style={{ animationDelay: "0s" }} />
      <div className="fx-streak" style={{ animationDelay: "0.7s" }} />
      <div className="fx-streak" style={{ animationDelay: "1s" }} />

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

/* —— Landing —— */
export default function Landing({ onEnter }) {
  return (
    <div className="min-h-screen relative text-slate-100">
      {/* 背景（失敗 fallback） */}
      <img
        src="/bg/landing.jpg"
        alt="背景"
        onError={(e) => {
          e.currentTarget.src = "/bg/bg-clouds.jpg";
        }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/55 z-20" />

      {/* 劍光在遮罩上面 */}
      <SwordStreakFX />

      {/* 內容 */}
      <div className="relative z-40 h-screen flex flex-col items-center justify-center px-6 text-center">
        {/* ✅ Logo 外層掛動畫；也放大行動版 */}
        <div className="logo-anim">
          <Image
            src="/logo.png"
            alt="修仙啟程"
            width={1640}  // 原圖比例 1640x664
            height={664}
            priority
            className="
              mb-6 h-auto
              w-[clamp(420px,94vw,1100px)]  /* 手機更大、桌機上限更寬 */
              drop-shadow-[0_10px_35px_rgba(0,0,0,.6)]
            "
          />
        </div>

        <div className="space-y-2">
          <p className="text-2xl md:text-3xl font-bold text-slate-100">
            佛非是我，憑何渡我
          </p>
          <p className="text-xl md:text-2xl text-slate-300">
            天未助我，憑何問我
          </p>
        </div>

		{/* ✨ 漂亮的遊戲進入按鈕（圖片版） ✨ */}
		<Image
		  src="/btn-enter.png"
		  alt="進入修仙世界"
		  width={360}      // 可以調整：建議 280~400
		  height={120}
		  priority
		  className="mt-10 cursor-pointer hover:scale-105 transition-transform duration-300"
		  onClick={onEnter}
		/>


      {/* —— Logo 動效樣式 —— */}
      <style jsx global>{`
        /* 進場＋浮動＋光暈脈動（掛在 .logo-anim 外層容器） */
        .logo-anim {
          animation: logoEnter 900ms ease-out forwards,
            logoFloat 6s ease-in-out infinite 1s,
            logoGlow 2.4s ease-in-out infinite 1.2s;
          transform-origin: center center;
          will-change: transform, filter, opacity;
        }
        @keyframes logoEnter {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
            filter: drop-shadow(0 0 0 rgba(0, 255, 220, 0));
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: drop-shadow(0 0 18px rgba(0, 255, 220, 0.25));
          }
        }
        @keyframes logoFloat {
          0%,
          100% {
            transform: translateY(0) scale(1) rotate(0.02deg);
          }
          50% {
            transform: translateY(-6px) scale(1.01) rotate(0.02deg);
          }
        }
        @keyframes logoGlow {
          0%,
          100% {
            filter: drop-shadow(0 0 14px rgba(0, 255, 220, 0.22))
              drop-shadow(0 0 28px rgba(0, 255, 220, 0.1));
          }
          50% {
            filter: drop-shadow(0 0 24px rgba(0, 255, 220, 0.36))
              drop-shadow(0 0 48px rgba(0, 255, 220, 0.16));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .logo-anim {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
