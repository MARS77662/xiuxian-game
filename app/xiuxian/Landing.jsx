'use client';
import { useEffect, useRef } from "react";
import Image from "next/image";

export default function Landing() {
  return (
    <div className="screen">
      {/* 劍光掃過（改成窄光束，避免整片覆蓋） */}
      <div className="sweep"><div className="beam" /></div>

      {/* LOGO 與文案 */}
      <div className="center">
        <div className="logoWrap">
          <Image
            src="/logo.png"
            alt="修仙起程"
            width={820}
            height={330}
            priority
            className="logoImg"
          />
        </div>
        <p className="loading">修仙起程 · Loading…</p>
        <p className="subtitle strong">佛非是我，憑何渡我?</p>
        <p className="subtitle">天未助我，憑何問我?</p>
      </div>

      {/* 背景粒子 */}
      <div className="particles" />

      <style jsx>{`
        /* 版面 */
        .screen {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: radial-gradient(ellipse at 50% 40%, #0e1a1f, #0a0f12 60%, #06090b 100%);
          color: #e6ffff;
          font-family: ui-sans-serif, system-ui, -apple-system, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
        }
        .center { position: relative; z-index: 2; text-align: center; }

        /* 劍光掃過（窄光束，旋轉 18°，從左到右） */
        .sweep {
          position: absolute; inset: -10% -10%; z-index: 1; pointer-events:none; overflow:hidden;
        }
        .beam {
          position: absolute; top: -20vh; left: -30vw;
          width: 28vw; height: 160vh;
          background: linear-gradient(to right,
            rgba(0,0,0,0) 0%,
            rgba(120,255,240,0.00) 35%,
            rgba(120,255,240,0.28) 50%,
            rgba(120,255,240,0.00) 65%,
            rgba(0,0,0,0) 100%);
          filter: blur(1.5px);
          mix-blend-mode: screen;
          transform: rotate(18deg) translateX(-120vw);
          animation: beamSweep 6s linear infinite;
        }
        @keyframes beamSweep {
          to { transform: rotate(18deg) translateX(120vw); }
        }

        /* Logo 特效：淡入 + 呼吸 + 流光 */
        .logoWrap { position: relative; display: inline-block; }
        .logoImg {
          display: block;
          width: min(86vw, 900px);
          height: auto;
          opacity: 0;
          filter: drop-shadow(0 14px 34px rgba(0,0,0,.45));
          animation:
            logoFadeIn 900ms ease-out forwards,
            logoBreath 3000ms ease-in-out 900ms infinite;
          will-change: transform, filter, opacity;
        }
        .logoWrap::after {
          content: "";
          position: absolute;
          inset: -4% -10%;
          background: linear-gradient(110deg,
            rgba(255,255,255,0) 0%,
            rgba(190,255,255,.55) 50%,
            rgba(255,255,255,0) 100%);
          transform: translateX(-120%);
          animation: logoShimmer 2.8s linear 700ms infinite;
          mix-blend-mode: screen;
          pointer-events: none;
        }
        @keyframes logoFadeIn {
          from { opacity: 0; transform: translateY(6px) scale(.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes logoBreath {
          0%,100% { transform: scale(1);    filter: drop-shadow(0 0 20px rgba(0,255,200,.45)); }
          50%     { transform: scale(1.035); filter: drop-shadow(0 0 36px rgba(120,255,220,.85)); }
        }
        @keyframes logoShimmer { to { transform: translateX(140%); } }

        /* 文案 */
        .loading {
          margin-top: 12px;
          font-size: 1rem;
          letter-spacing: 0.2em;
          color: #b8f7ff;
          animation: textPulse 1500ms ease-in-out infinite;
        }
        .subtitle {
          margin: 6px 0 0;
          color: #c7d2da;
          opacity: 0.9;
          font-size: 0.98rem;
          letter-spacing: 0.08em;
          font-style: italic;
        }
        .subtitle.strong { color: #e5f9ff; }

        @keyframes textPulse { 0%,100% { opacity: .65 } 50% { opacity: 1 } }

        /* 背景粒子（簡版） */
        .particles {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            radial-gradient(2px 2px at 12% 78%, rgba(180,255,240,.25), transparent 60%),
            radial-gradient(1.5px 1.5px at 76% 88%, rgba(180,255,240,.20), transparent 60%),
            radial-gradient(1.8px 1.8px at 44% 32%, rgba(180,255,240,.18), transparent 60%),
            radial-gradient(1.4px 1.4px at 22% 40%, rgba(180,255,240,.15), transparent 60%);
          animation: particlesFloat 12s linear infinite;
          opacity: .6;
        }
        @keyframes particlesFloat { from { transform: translateY(0) } to { transform: translateY(-22px) } }

        /* 動畫無障礙：若使用者偏好減少動效，關閉非必要動畫 */
        @media (prefers-reduced-motion: reduce) {
          .beam, .logoImg, .logoWrap::after, .particles, .loading { animation: none !important; }
          .logoImg { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
