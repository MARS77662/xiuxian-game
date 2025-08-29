	"use client";

	import React, { useEffect, useMemo, useRef, useState } from "react";

	/**
	 * 《修仙論道》— MVP 原型（單檔版）
	 * ------------------------------------------------------------
	 * ✅ 特色：
	 * - 核心循環：修煉(點擊/自動) → 強化(功法/法寶) → 突破 → 飛升(重生加成)
	 * - 本地存檔：localStorage
	 * - 可導出/導入存檔
	 * - 無外部依賴（React + Tailwind）
	 * - 數值皆為示意，便於你後續微調
	 *
	 * 使用方式：
	 * - 在 Next.js 專案建立 `app/xiuxian/page.jsx` 或任一路由檔，貼上本檔案內容即可。
	 * - 若在 CRA/Vite，作為單一元件引入並渲染。
	 */

	// ====== 常數定義 ======
	const SAVE_KEY = "xiuxian-save-v1";

	const REALMS = [
	  { key: "lianqi", name: "練氣", multiplier: 1,  costQi: 100,  baseChance: 0.9 },
	  { key: "zhujii", name: "築基", multiplier: 2,  costQi: 1_000, baseChance: 0.8 },
	  { key: "jiedan", name: "結丹", multiplier: 4,  costQi: 10_000, baseChance: 0.7 },
	  { key: "yuanying", name: "元嬰", multiplier: 8,  costQi: 100_000, baseChance: 0.6 },
	  { key: "huashen", name: "化神", multiplier: 16, costQi: 1_000_000, baseChance: 0.5 },
	  { key: "heti",   name: "合體", multiplier: 32, costQi: 10_000_000, baseChance: 0.4 },
	  { key: "dasheng", name: "大乘", multiplier: 64, costQi: 100_000_000, baseChance: 0.35 },
	];

	const SKILLS = {
	  tuna: { key: "tuna", name: "吐納術", desc: "自動產出 +6%/級", baseCost: 50,  growth: 1.25, autoPct: 0.06, clickPct: 0 },
	  wuxing: { key: "wuxing", name: "五行心法", desc: "自動產出 +8%/級", baseCost: 200, growth: 1.28, autoPct: 0.08, clickPct: 0 },
	  jiutian: { key: "jiutian", name: "九天玄功", desc: "自動產出 +12%/級", baseCost: 800, growth: 1.32, autoPct: 0.12, clickPct: 0 },
	};

	const ARTIFACTS = {
	  qingxiao: { key: "qingxiao", name: "青霄劍",   desc: "點擊效率 +25%", clickPct: 0.25, autoPct: 0, brPct: 0, cost: 500,  unlockRealmIndex: 1 }, // 築基後
	  zijinhu:  { key: "zijinhu",  name: "紫金葫",   desc: "自動產出 +15%", clickPct: 0, autoPct: 0.15, brPct: 0, cost: 1000, unlockRealmIndex: 2 }, // 結丹後
	  zhenpan:  { key: "zhenpan",  name: "鎮仙陣盤", desc: "突破成功 +8%", clickPct: 0, autoPct: 0, brPct: 0.08, cost: 2000, unlockRealmIndex: 3 }, // 元嬰後
	};

	// 每秒基礎自動修煉量（會被各種加成放大）
	const BASE_AUTO_PER_SEC = 1;
	// 每次點擊的基礎修煉量
	const BASE_CLICK_GAIN = 1;
	// 靈力→靈石 兌換率
	const QI_TO_STONE = 100; // 100 靈力 = 1 靈石

	// ====== 工具函數 ======
	const fmt = (n) =>
	  n >= 1e12 ? `${(n / 1e12).toFixed(2)}兆` :
	  n >= 1e8  ? `${(n / 1e8).toFixed(2)}億` :
	  n >= 1e4  ? `${(n / 1e4).toFixed(2)}萬` :
	  Math.floor(n).toLocaleString();

	const costOfSkill = (base, growth, lv) => Math.ceil(base * Math.pow(growth, lv));

	// ====== 初始存檔 ======
	const defaultState = () => ({
	  qi: 0,              // 靈力
	  stones: 0,          // 靈石
	  daoHeart: 0,        // 道心
	  realmIndex: 0,      // 當前境界索引
	  skills: { tuna: 0, wuxing: 0, jiutian: 0 },
	  artifacts: { qingxiao: false, zijinhu: false, zhenpan: false },
	  // 飛升（重生）
	  ascensions: 0,      // 次數
	  talent: { auto: 0, click: 0 }, // 永久天賦（每級 +10%）
	  // 其他
	  lastTick: Date.now(),
	});

	// ====== 主元件 ======
	export default function XiuXianLunDaoApp() {
	  const [s, setS] = useState(defaultState);
	  const tickRef = useRef(null);
	  const [msg, setMsg] = useState("");
	  const [importText, setImportText] = useState("");

	  // 載入存檔
	  useEffect(() => {
		try {
		  const raw = localStorage.getItem(SAVE_KEY);
		  if (raw) {
			const parsed = JSON.parse(raw);
			setS((prev) => ({ ...prev, ...parsed }));
		  }
		} catch (e) {
		  console.warn("讀檔失敗", e);
		}
	  }, []);

	  // 自動存檔
	  useEffect(() => {
		const id = setInterval(() => {
		  localStorage.setItem(SAVE_KEY, JSON.stringify(s));
		}, 3000);
		return () => clearInterval(id);
	  }, [s]);

	  // ====== 加成計算 ======
	  const realm = REALMS[s.realmIndex] ?? REALMS[REALMS.length - 1];

	  const skillAutoBonus = (
		s.skills.tuna * SKILLS.tuna.autoPct +
		s.skills.wuxing * SKILLS.wuxing.autoPct +
		s.skills.jiutian * SKILLS.jiutian.autoPct
	  );

	  const artAutoBonus = (s.artifacts.zijinhu ? ARTIFACTS.zijinhu.autoPct : 0);
	  const artClickBonus = (s.artifacts.qingxiao ? ARTIFACTS.qingxiao.clickPct : 0);
	  const artBreakBonus = (s.artifacts.zhenpan ? ARTIFACTS.zhenpan.brPct : 0);

	  const talentAutoBonus = s.talent.auto * 0.10;
	  const talentClickBonus = s.talent.click * 0.10;

	  const totalAutoMultiplier = (1 + skillAutoBonus + artAutoBonus + talentAutoBonus) * realm.multiplier;
	  const totalClickMultiplier = (1 + artClickBonus + talentClickBonus) * realm.multiplier;

	  const autoPerSec = BASE_AUTO_PER_SEC * totalAutoMultiplier;
	  const clickGain = BASE_CLICK_GAIN * totalClickMultiplier;

	  // ====== 自動產出 Tick ======
	  useEffect(() => {
		tickRef.current && clearInterval(tickRef.current);
		tickRef.current = setInterval(() => {
		  setS((p) => ({ ...p, qi: p.qi + autoPerSec }));
		}, 1000);
		return () => tickRef.current && clearInterval(tickRef.current);
	  }, [autoPerSec]);

	  // ====== 動作處理 ======
	  const cultivate = () => setS((p) => ({ ...p, qi: p.qi + clickGain }));

	  const refineStones = () => {
		if (s.qi < QI_TO_STONE) { setMsg("靈力不足，至少需要100靈力才能煉化為 1 枚靈石。"); return; }
		const stonesGain = Math.floor(s.qi / QI_TO_STONE);
		const qiCost = stonesGain * QI_TO_STONE;
		setS((p) => ({ ...p, qi: p.qi - qiCost, stones: p.stones + stonesGain }));
		setMsg(`煉化完成，獲得 ${stonesGain} 枚靈石。`);
	  };

	  const buySkill = (sk) => {
		const def = SKILLS[sk];
		const lv = s.skills[sk];
		const cost = costOfSkill(def.baseCost, def.growth, lv);
		if (s.stones < cost) { setMsg("靈石不足。"); return; }
		setS((p) => ({
		  ...p,
		  stones: p.stones - cost,
		  skills: { ...p.skills, [sk]: p.skills[sk] + 1 },
		}));
	  };

	  const buyArtifact = (ak) => {
		const a = ARTIFACTS[ak];
		if (s.artifacts[ak]) { setMsg("已購買過此法寶。"); return; }
		if (s.realmIndex < a.unlockRealmIndex) { setMsg("境界未到，無法驅使此法寶。"); return; }
		if (s.stones < a.cost) { setMsg("靈石不足。"); return; }
		setS((p) => ({ ...p, stones: p.stones - a.cost, artifacts: { ...p.artifacts, [ak]: true } }));
	  };

	  const comprehendDao = () => {
		// 2 分鐘冷卻可自行擴充；此處簡化為 50% 機率 +1 道心
		const ok = Math.random() < 0.5;
		setS((p) => ({ ...p, daoHeart: p.daoHeart + (ok ? 1 : 0) }));
		setMsg(ok ? "頓悟片刻，道心+1。" : "心浮氣躁，未得所悟。");
	  };

	  const tryBreakthrough = (useDaoHeart = false) => {
		const target = REALMS[s.realmIndex + 1];
		if (!target) { setMsg("已至大乘圓滿，去飛升吧！"); return; }
		const cost = target.costQi;
		if (s.qi < cost) { setMsg("修為不足，尚難撼動瓶頸。"); return; }
		if (useDaoHeart && s.daoHeart <= 0) { setMsg("道心不足。"); return; }

		const baseChance = target.baseChance;
		const bonus = (useDaoHeart ? 0.1 : 0) + artBreakBonus; // 道心一次性 +10%
		const chance = Math.min(0.98, baseChance + bonus);
		const success = Math.random() < chance;

		if (success) {
		  setS((p) => ({
			...p,
			qi: p.qi - cost,
			daoHeart: p.daoHeart - (useDaoHeart ? 1 : 0),
			realmIndex: p.realmIndex + 1,
		  }));
		  setMsg(`突破成功！晉階「${target.name}」。`);
		} else {
		  // 失敗懲罰：損失 30% 修為
		  const lost = Math.floor(s.qi * 0.3);
		  setS((p) => ({
			...p,
			qi: Math.max(0, p.qi - lost),
			daoHeart: p.daoHeart - (useDaoHeart ? 1 : 0),
		  }));
		  setMsg(`走火入魔！損失 ${fmt(lost)} 修為。`);
		}
	  };

	  const canAscend = s.realmIndex >= REALMS.length - 1 && s.qi >= 100_000_000;

	  const ascend = () => {
		if (!canAscend) { setMsg("尚未圓滿大乘或修為不足，無法飛升。"); return; }
		// 飛升：清空資源/等級，但保留法寶（你可調整）與永久天賦點數 +1
		setS((p) => ({
		  ...defaultState(),
		  ascensions: p.ascensions + 1,
		  talent: { ...p.talent },
		  artifacts: { ...p.artifacts },
		}));
		setMsg("雷劫已過，飛升成功！獲得 1 點天命可分配。");
	  };

	  const investTalent = (type) => {
		// 每次飛升自動獲得 1 點（此處：用 ascensions - 已投點 簡化判定）
		const spent = s.talent.auto + s.talent.click;
		const available = s.ascensions - spent;
		if (available <= 0) { setMsg("沒有可用的天命點數。"); return; }
		setS((p) => ({ ...p, talent: { ...p.talent, [type]: p.talent[type] + 1 } }));
	  };

	  const hardReset = () => {
		if (!confirm("確定要刪除存檔並重置嗎？")) return;
		localStorage.removeItem(SAVE_KEY);
		setS(defaultState());
		setMsg("已重置存檔。");
	  };

	  const exportSave = () => {
		const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(s))));
		navigator.clipboard?.writeText(b64);
		setMsg("存檔已複製到剪貼簿。");
	  };
	  const importSave = () => {
		try {
		  const parsed = JSON.parse(decodeURIComponent(escape(atob(importText))));
		  setS((p) => ({ ...p, ...parsed }));
		  setMsg("存檔已匯入。");
		  setImportText("");
		} catch (e) {
		  setMsg("匯入失敗，格式不正確。");
		}
	  };

	  // ====== UI ======
	  return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-gray-900 to-black text-slate-100 p-4 md:p-8">
		  {/* Header */}
		  <header className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8 max-w-6xl mx-auto">
			<div>
			  <h1 className="text-3xl md:text-4xl font-bold tracking-wide">修仙論道 · MVP</h1>
			  <p className="text-slate-300">核心循環原型：修煉 → 強化 → 突破 → 飛升（本地存檔）</p>
			</div>
			<div className="flex-1" />
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
			  <Stat label="靈力" value={fmt(s.qi)} />
			  <Stat label="靈石" value={fmt(s.stones)} />
			  <Stat label="道心" value={fmt(s.daoHeart)} />
			  <Stat label="境界" value={`${REALMS[s.realmIndex]?.name ?? "無"} ×${REALMS[s.realmIndex]?.multiplier ?? 1}`} />
			</div>
		  </header>

		  {/* 修仙打坐動畫 Hero */}
		  <MeditationHeroImg />

		  {msg && (
			<div className="max-w-6xl mx-auto mt-4 p-3 rounded-xl bg-emerald-900/40 border border-emerald-700/40 text-emerald-200 text-sm">
			  {msg}
			</div>
		  )}

		  {/* Actions */}
		  <section className="max-w-6xl mx-auto mt-6 grid md:grid-cols-3 gap-6">
			{/* 左：修煉/煉化/悟道 */}
			<Card title="修煉與內功">
			  <div className="space-y-3">
				<button onClick={cultivate} className="w-full py-4 rounded-2xl shadow-md bg-amber-600 hover:bg-amber-500 active:scale-[0.99] transition">
				  修煉（點擊） +{fmt(clickGain)}
				</button>
				<div className="text-xs text-slate-300">自動修煉：每秒 +{fmt(autoPerSec)}（含境界與功法加成）</div>

				<div className="grid grid-cols-2 gap-2 mt-3">
				  <button onClick={refineStones} className="py-2 rounded-xl bg-sky-700 hover:bg-sky-600">煉化靈石（100靈力→1靈石）</button>
				  <button onClick={comprehendDao} className="py-2 rounded-xl bg-fuchsia-700 hover:bg-fuchsia-600">參悟道心（50% 得 1）</button>
				</div>
			  </div>
			</Card>

			{/* 中：功法與法寶 */}
			<Card title="功法修習">
			  <div className="space-y-2">
				{Object.values(SKILLS).map((sk) => {
				  const lv = s.skills[sk.key];
				  const cost = costOfSkill(sk.baseCost, sk.growth, lv);
				  return (
					<div key={sk.key} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-800/60">
					  <div>
						<div className="font-medium">{sk.name} <span className="text-xs text-slate-400">Lv.{lv}</span></div>
						<div className="text-xs text-slate-400">{sk.desc}</div>
					  </div>
					  <button onClick={() => buySkill(sk.key)} className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-sm">
						升級（{cost} 靈石）
					  </button>
					</div>
				  );
				})}
			  </div>
			</Card>

			<Card title="法寶淬鍊">
			  <div className="space-y-2">
				{Object.values(ARTIFACTS).map((a) => (
				  <div key={a.key} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-800/60">
					<div>
					  <div className="font-medium">{a.name} {s.artifacts[a.key] && <span className="text-emerald-400 ml-1">✓</span>}</div>
					  <div className="text-xs text-slate-400">{a.desc}（解鎖：{REALMS[a.unlockRealmIndex].name}）</div>
					</div>
					<button onClick={() => buyArtifact(a.key)} disabled={s.artifacts[a.key]} className={`px-3 py-1.5 rounded-lg text-sm ${s.artifacts[a.key] ? "bg-slate-700 cursor-not-allowed" : "bg-indigo-700 hover:bg-indigo-600"}`}>
					  {s.artifacts[a.key] ? "已擁有" : `購買（${a.cost} 靈石）`}
					</button>
				  </div>
				))}
			  </div>
			</Card>
		  </section>

		  {/* Breakthrough / Ascend */}
		  <section className="max-w-6xl mx-auto mt-6 grid md:grid-cols-2 gap-6">
			<Card title="突破境界">
			  <div className="space-y-3">
				<div className="text-sm">目前境界：<b>{REALMS[s.realmIndex].name}</b>（產出 ×{REALMS[s.realmIndex].multiplier}）</div>
				{REALMS[s.realmIndex + 1] ? (
				  <div className="text-sm">
					下個境界：<b>{REALMS[s.realmIndex + 1].name}</b>，
					需求修為：<b>{fmt(REALMS[s.realmIndex + 1].costQi)}</b>，
					基礎成功率：<b>{Math.round(REALMS[s.realmIndex + 1].baseChance * 100)}%</b>
				  </div>
				) : (
				  <div className="text-sm text-amber-300">已至大乘圓滿，可待時機飛升。</div>
				)}

				<div className="flex gap-2">
				  <button onClick={() => tryBreakthrough(false)} className="flex-1 py-2 rounded-xl bg-rose-700 hover:bg-rose-600">嘗試突破</button>
				  <button onClick={() => tryBreakthrough(true)} className="flex-1 py-2 rounded-xl bg-rose-800 hover:bg-rose-700">以道心穩境突破（+10%）</button>
				</div>
			  </div>
			</Card>

			<Card title="飛升 · 天命">
			  <div className="space-y-3">
				<div className="text-sm">飛升條件：到達<b>大乘</b>且修為 ≥ <b>{fmt(100_000_000)}</b></div>
				<div className="text-sm">當前已飛升：<b>{s.ascensions}</b> 次</div>
				<button onClick={ascend} className={`w-full py-2 rounded-xl ${canAscend ? "bg-amber-700 hover:bg-amber-600" : "bg-slate-700 cursor-not-allowed"}`}>飛升（重生）</button>

				<div className="pt-2 border-t border-slate-700/60 space-y-2">
				  <div className="text-sm">可分配天命點：<b>{Math.max(0, s.ascensions - (s.talent.auto + s.talent.click))}</b></div>
				  <div className="grid grid-cols-2 gap-2">
					<button onClick={() => investTalent("auto")} className="py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-sm">天賦·真我（自動 +10%/級）<br/>當前：{s.talent.auto}級</button>
					<button onClick={() => investTalent("click")} className="py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-sm">天賦·劍心（點擊 +10%/級）<br/>當前：{s.talent.click}級</button>
				  </div>
				</div>
			  </div>
			</Card>
		  </section>

		  {/* Save / Import / Debug */}
		  <section className="max-w-6xl mx-auto mt-6 grid md:grid-cols-2 gap-6">
			<Card title="存檔 / 匯入">
			  <div className="space-y-2">
				<button onClick={exportSave} className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700">導出存檔（複製到剪貼簿）</button>
				<textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="貼上導出字串以匯入……" className="w-full h-24 p-2 rounded-xl bg-black/40 border border-slate-700 outline-none" />
				<button onClick={importSave} className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700">匯入存檔</button>
			  </div>
			</Card>

			<Card title="開發者工具">
			  <div className="grid grid-cols-2 gap-2 text-sm">
				<button onClick={() => setS((p) => ({ ...p, qi: p.qi + 10_000 }))} className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700">+1萬靈力</button>
				<button onClick={() => setS((p) => ({ ...p, stones: p.stones + 100 }))} className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700">+100靈石</button>
				<button onClick={() => setS((p) => ({ ...p, daoHeart: p.daoHeart + 1 }))} className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700">+1道心</button>
				<button onClick={hardReset} className="py-2 rounded-xl bg-rose-900 hover:bg-rose-800">重置存檔</button>
			  </div>
			  <div className="text-xs text-slate-400 mt-2">（上面三個按鈕可在設計階段幫你快速壓測數值手感）</div>
			</Card>
		  </section>

		  <footer className="max-w-6xl mx-auto text-center mt-10 text-xs text-slate-500">
			© {new Date().getFullYear()} 修仙論道 · MVP 原型 — 由 Mars & 小月 打造
		  </footer>
		</div>
	  );
	}

	function Card({ title, children }) {
	  return (
		<div className="rounded-2xl p-4 md:p-5 bg-white/5 border border-white/10 shadow-xl">
		  <div className="flex items-center justify-between mb-3">
			<h2 className="text-lg font-semibold tracking-wide">{title}</h2>
		  </div>
		  {children}
		</div>
	  );
	}

	function Stat({ label, value }) {
	  return (
		<div className="rounded-xl px-3 py-2 bg-white/5 border border-white/10">
		  <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
		  <div className="font-semibold">{value}</div>
		</div>
	  );
	}

	// === 打坐修仙動畫元件 ===
	function MeditationHero(){
	  return (
		<div className="relative max-w-6xl mx-auto mt-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/60 to-black/60">
		  {/* 背景星點 */}
		  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
			<defs>
			  <radialGradient id="g" cx="50%" cy="40%" r="60%">
				<stop offset="0%" stopColor="rgba(99,102,241,0.35)"/>
				<stop offset="60%" stopColor="rgba(99,102,241,0.08)"/>
				<stop offset="100%" stopColor="transparent"/>
			  </radialGradient>
			</defs>
			<rect width="100%" height="100%" fill="url(#g)"/>
		  </svg>

		  {/* 靈氣漣漪 */}
		  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
			<div className="aura w-40 h-40 rounded-full"/>
			<div className="aura w-56 h-56 rounded-full delay-300"/>
			<div className="aura w-72 h-72 rounded-full delay-700"/>
		  </div>

		  {/* 打坐剪影（SVG） */}
		  <div className="relative flex items-center justify-center px-6 py-16 md:py-20">
			<svg viewBox="0 0 200 200" className="w-40 md:w-56 drop-shadow-xl animate-float-slow">
			  {/* 身體剪影 */}
			  <path d="M100 30c-12 0-22 10-22 22s10 22 22 22 22-10 22-22-10-22-22-22zM62 120c8-18 24-28 38-28s30 10 38 28l10 22c3 6-1 12-7 12H59c-6 0-10-6-7-12l10-22zM45 150c-6 0-10 6-7 12 6 12 30 18 62 18s56-6 62-18c3-6-1-12-7-12z" fill="rgba(255,255,255,0.85)"/>
			  {/* 光圈 */}
			  <circle cx="100" cy="110" r="54" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" className="animate-pulse"/>
			</svg>
			<div className="ml-6 md:ml-10">
			  <h3 className="text-2xl md:text-3xl font-semibold">入定·吐納</h3>
			  <p className="text-slate-300 mt-1">隨呼吸起伏，靈氣自丹田匯聚——點擊修煉或嘗試突破吧。</p>
			</div>
		  </div>

		  {/* 內嵌樣式（動畫） */}
		  <style>{`
			@keyframes float-slow { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-6px) } }
			.animate-float-slow{ animation: float-slow 5s ease-in-out infinite; }
			@keyframes aura { 0%{ transform: scale(0.6); opacity: .35 } 70%{ opacity:.08 } 100%{ transform: scale(1.4); opacity: 0 } }
			.aura{ position:absolute; left:-50%; top:-50%; transform:translate(50%,50%); background:radial-gradient(circle, rgba(168,85,247,.25), rgba(59,130,246,.12) 40%, transparent 70%); animation:aura 3.6s linear infinite; filter: blur(2px); }
			.aura.delay-300{ animation-delay:.3s }
			.aura.delay-700{ animation-delay:.7s }
		  `}</style>
		</div>
	  );
	}


	// === 打坐修仙動畫元件（插畫版） ===
	function MeditationHeroImg(){
	  return (
		<div className="relative max-w-6xl mx-auto mt-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/60 to-black/60">
		  {/* 背景柔光 */}
		  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
			<defs>
			  <radialGradient id="g2" cx="50%" cy="40%" r="60%">
				<stop offset="0%" stopColor="rgba(99,102,241,0.35)"/>
				<stop offset="60%" stopColor="rgba(99,102,241,0.08)"/>
				<stop offset="100%" stopColor="transparent"/>
			  </radialGradient>
			</defs>
			<rect width="100%" height="100%" fill="url(#g2)"/>
		  </svg>

		  {/* 靈氣漣漪（擴散） */}
		  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
			<div className="aura w-44 h-44 rounded-full"/>
			<div className="aura w-64 h-64 rounded-full delay-300"/>
			<div className="aura w-80 h-80 rounded-full delay-700"/>
		  </div>

		  {/* 氣旋（渦輪光） */}
		  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
			<div className="vortex w-[540px] h-[540px] opacity-[.18]"/>
			<div className="vortex w-[420px] h-[420px] opacity-[.22] rotate-180"/>
		  </div>

		  {/* 星火粒子（沿軌道旋轉） */}
		  <div className="absolute inset-0 pointer-events-none">
			{Array.from({length: 18}).map((_,i)=> (
			  <span key={i} style={{"--a": `${(i/18)*360}deg`, "--r": `${120 + (i%6)*18}px`}} className="spark"/>
			))}
		  </div>

		  {/* 插畫：請把你的圖片放到 /public/meditate.png */}
		  <div className="relative flex items-center justify-center px-6 py-16 md:py-20">
			<img src="/meditate.png" alt="打坐修仙" className="max-w-lg w-full md:max-w-[520px] drop-shadow-[0_18px_40px_rgba(0,0,0,.55)] animate-float-slow select-none pointer-events-none"/>
			<div className="ml-6 md:ml-10">
			  <h3 className="text-2xl md:text-3xl font-semibold">入定·吐納</h3>
			  <p className="text-slate-300 mt-1">隨呼吸起伏，靈氣自丹田匯聚——點擊修煉或嘗試突破吧。</p>
			</div>
		  </div>

		  {/* 內嵌樣式（動畫） */}
		  <style>{`
			/* 漂浮 */
			@keyframes float-slow { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-6px) } }
			.animate-float-slow{ animation: float-slow 5s ease-in-out infinite; }

			/* 漣漪 */
			@keyframes aura { 0%{ transform: scale(0.6); opacity: .35 } 70%{ opacity:.08 } 100%{ transform: scale(1.4); opacity: 0 } }
			.aura{ position:absolute; left:-50%; top:-50%; transform:translate(50%,50%); background:radial-gradient(circle, rgba(168,85,247,.25), rgba(59,130,246,.12) 40%, transparent 70%); animation:aura 3.6s linear infinite; filter: blur(2px); }
			.aura.delay-300{ animation-delay:.3s }
			.aura.delay-700{ animation-delay:.7s }

			/* 氣旋：以錐形漸層作旋轉光帶，使用遮罩挖空中心 */
			@keyframes spin { to { transform: rotate(360deg) } }
			.vortex{ position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); border-radius:9999px; background:conic-gradient(from 0deg, rgba(255,255,255,.0) 0deg, rgba(255,255,255,.55) 30deg, rgba(255,255,255,.0) 120deg, rgba(255,255,255,.0) 360deg); filter: blur(6px); animation: spin 18s linear infinite; mask-image: radial-gradient(circle at center, transparent 38%, black 60%); }

			/* 星火粒子：沿圓軌道旋轉，偶爾閃爍 */
			@keyframes orbit { to { transform: rotate(var(--a)) translateX(var(--r)) rotate(calc(-1*var(--a))) } }
			@keyframes twinkle { 0%,100%{ opacity:.2; box-shadow:0 0 0 0 rgba(255,255,255,.0) } 50%{ opacity:1; box-shadow:0 0 12px 3px rgba(255,255,255,.35) } }
			.spark{ position:absolute; left:50%; top:50%; width:3px; height:3px; background:#fff; border-radius:9999px; transform-origin: -var(--r) 0; animation: orbit 6s linear infinite, twinkle 3.2s ease-in-out infinite; }
		  `}</style>
		</div>
	  );
	}

