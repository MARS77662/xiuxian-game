'use client';
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

      {/* 內嵌 CSS，避免 tailwind 衝突 */}
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
      {/* 背景（失敗就換雲海） */}
      <img
        src="/bg/landing.jpg"
        alt="背景"
        onError={(e) => {
          e.currentTarget.src = "/bg/bg-clouds.jpg";
        }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* 暗色遮罩 */}
      <div className="absolute inset-0 bg-black/55 z-20" />

      {/* 劍光在遮罩上層 */}
      <SwordStreakFX />

      {/* 內容 */}
      <div className="relative z-40 h-screen flex flex-col items-center justify-center px-6 text-center">
        {/* Logo：手機可放大、桌機限制最大寬 +（新增）呼吸與流光特效 */}
        <div className="logo-wrap mb-5">
          <Image
            src="/logo.png"
            alt="修仙啟程"
            width={1640}
            height={664}
            priority
            className="logo-img h-auto w-[clamp(360px,92vw,1000px)] drop-shadow-[0_10px_35px_rgba(0,0,0,.6)]"
          />
        </div>

        {/* 副標語 */}
        <div className="space-y-2">
          <p className="text-2xl md:text-3xl font-bold text-slate-100">
            佛非是我，憑何渡我？
          </p>
          <p className="text-xl md:text-2xl text-slate-300">
            天未助我，憑何問我？
          </p>
        </div>

        {/* 圖片按鈕（/public/btn-enter.png） */}
        <div className="mt-8">
          <Image
            src="/btn-enter.png"
            alt="進入修仙世界"
            width={520}
            height={160}
            priority
            className="h-auto w-[min(80vw,520px)] cursor-pointer transition-transform duration-300 hover:scale-105"
            onClick={onEnter}
          />
        </div>
      </div>

      {/* Logo 動畫樣式（不依賴 tailwind 任意 animate，保證會動） */}
      <style jsx global>{`
  .fx-streak {
    position: absolute;
    left: -10vmax;        /* 原 -20vmax → 往右一點，避免太長的進場 */
    bottom: 0vmax;        /* 原 -6vmax → 提高路徑，較不會撞到底部 */
    width: 30vmax;        /* 原 40vmax → 縮窄光束長度 */
    height: 6px;
    transform: rotate(-10deg); /* 原 -12deg → 路徑稍微平一些 */
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0.9) 35%,
      rgba(180,220,255,0.95) 55%,
      rgba(120,180,255,0.7) 70%,
      rgba(255,255,255,0) 100%
    );
    filter: blur(8px) drop-shadow(0 0 12px rgba(120,180,255,0.65));
    animation: swordSweep 2.6s linear infinite;
  }

  @keyframes swordSweep {
    0% {
      transform: translate3d(0, 0, 0) rotate(-10deg);
      opacity: 0;
    }
    10% { opacity: .95; }
    85% { opacity: 1; }
    100% {
      /* 用視窗相對單位，保證剛好掃過畫面不溢出 */
      transform: translate3d(115vw, -52vh, 0) rotate(-10deg);
      opacity: 0;
    }
  }

  /* 超寬螢幕再多給一點位移，避免太早收束 */
  @media (min-aspect-ratio: 16/9) {
    @keyframes swordSweep {
      100% { transform: translate3d(120vw, -50vh, 0) rotate(-10deg); opacity:0; }
    }
  }

  /* 手機路徑更平、更短，避免看起來掃太快 */
  @media (max-width: 480px) {
    .fx-streak { left: -8vmax; width: 26vmax; transform: rotate(-8deg); }
    @keyframes swordSweep {
      100% { transform: translate3d(110vw, -38vh, 0) rotate(-8deg); opacity:0; }
    }
  }
`}</style>

    </div>
  );
}
