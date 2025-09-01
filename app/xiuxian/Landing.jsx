'use client';
import Image from "next/image";

/* —— Landing（去光條，只保留 Logo 起伏） —— */
export default function Landing({ onEnter }) {
  return (
    <div className="min-h-screen relative text-slate-100">
      {/* 背景（失敗就換雲海） */}
      <img
        src="/bg/landing.jpg"
        alt="背景"
        onError={(e) => { e.currentTarget.src = "/bg/bg-clouds.jpg"; }}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* 暗色遮罩 */}
      <div className="absolute inset-0 bg-black/55 z-10" />

      {/* 內容 */}
      <div className="relative z-20 h-screen flex flex-col items-center justify-center px-6 text-center">
        {/* Logo：保留原尺寸 + 起伏特效 */}
        <Image
          src="/logo.png"
          alt="修仙啟程"
          width={1640}
          height={664}
          priority
          className="logo-img mb-5 h-auto w-[clamp(360px,92vw,1000px)] drop-shadow-[0_10px_35px_rgba(0,0,0,.6)]"
        />

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

      {/* 只保留 Logo 起伏與淡入（純 CSS，不依賴 tailwind animate） */}
      <style jsx global>{`
        @keyframes logoFadeIn {
          from { opacity: 0; transform: translateY(6px) scale(.985); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes logoBreath {
          0%,100% { transform: translateY(0)   scale(1);    filter: drop-shadow(0 0 18px rgba(0,255,200,.35)); }
          50%     { transform: translateY(-4px) scale(1.03); filter: drop-shadow(0 0 34px rgba(120,255,220,.75)); }
        }
        .logo-img {
          opacity: 0;
          animation: logoFadeIn 900ms ease-out forwards, logoBreath 3200ms ease-in-out 900ms infinite;
          will-change: transform, filter, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .logo-img { animation: none; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
