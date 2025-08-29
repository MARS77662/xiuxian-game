	"use client";

	import React, { useEffect, useMemo, useRef, useState } from "react";

	// === 外部資料 ===
	import { REALMS } from "@/data/realms";
	import { SKILLS } from "@/data/skills";
	import { BACKGROUNDS } from "@/data/backgrounds";

	// ====== 常數定義 ======
	const SAVE_KEY = "xiuxian-save-v1";

	// 每秒基礎自動修煉量（會被各種加成放大）
	const BASE_AUTO_PER_SEC = 1;
	// 每次點擊的基礎修煉量
	const BASE_CLICK_GAIN = 1;
	// 靈力→靈石 兌換率
	const QI_TO_STONE = 100; // 100 靈力 = 1 靈石

	// 法寶（放在本檔即可）
	const ARTIFACTS = {
	  qingxiao: { key: "qingxiao", name: "青霄劍",   desc: "點擊效率 +25%", clickPct: 0.25, autoPct: 0, brPct: 0,    cost: 500,  unlockRealmIndex: 2 }, // 築基後
	  zijinhu:  { key: "zijinhu",  name: "紫金葫",   desc: "自動產出 +15%", clickPct: 0,    autoPct: 0.15, brPct: 0,    cost: 1000, unlockRealmIndex: 3 }, // 結丹後
	  zhenpan:  { key: "zhenpan",  name: "鎮仙陣盤", desc: "突破成功 +8%",  clickPct: 0,    autoPct: 0,    brPct: 0.08, cost: 2000, unlockRealmIndex: 4 }, // 元嬰後
	};

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
	  ascensions: 0,
	  talent: { auto: 0, click: 0 },
	  // 新手與每日
	  meta: { starterGift: false },
	  login: { last: "", streak: 0, dayClaimed: false },
	  // 排行
	  playerName: "散仙",
	  lastTick: Date.now(),
	});

	// ====== 自檢（簡易測試） ======
	const DEV_SHOW_TESTS = true;
	function runSelfTests() {
	  const out = [];
	  out.push({ name: "fmt(1234)", pass: fmt(1234) === "1.23萬" || fmt(1234) === "1,234" });
	  out.push({ name: "fmt(10000)", pass: fmt(10000).includes("萬") });
	  const c0 = costOfSkill(100, 1.2, 0);
	  const c1 = costOfSkill(100, 1.2, 1);
	  out.push({ name: "cost growth", pass: c1 > c0 });
	  out.push({ name: "realm multipliers non-decreasing", pass: REALMS.every((r,i,a)=> i===0 || r.multiplier >= a[i-1].multiplier) });
	  out.push({ name: "background default exists", pass: typeof BACKGROUNDS._default === 'string' && BACKGROUNDS._default.length>0 });
	  return out;
	}

	// ====== 主元件 ======
	export default function XiuXianLunDaoApp() {
	  const [s, setS] = useState(defaultState);
	  const tickRef = useRef(null);
	  const [msg, setMsg] = useState("");
	  const [importText, setImportText] = useState("");
	  const tests = useMemo(() => DEV_SHOW_TESTS ? runSelfTests() : [], []);

	  // 渡劫（九重天雷）Modal 狀態
	  const [dujie, setDujie] = useState({
		open: false,
		useDaoHeart: true,
		running: false,
		logs: [], // { stage, pass, chance }
		finished: false,
		nextName: "",
		costQi: 0,
	  });

	  // 載入存檔 & 每日登入
	  useEffect(() => {
		try {
		  const raw = localStorage.getItem(SAVE_KEY);
		  if (raw) setS((prev) => ({ ...prev, ...JSON.parse(raw) }));
		} catch (e) { console.warn("讀檔失敗", e); }
		setS((p)=>{
		  const today = new Date().toISOString().slice(0,10);
		  if (p.login.last !== today) return { ...p, login: { last: today, streak: (p.login.last? p.login.streak + 1 : 1), dayClaimed: false } };
		  return p;
		});
	  }, []);

	  // 自動存檔
	  useEffect(() => {
		const id = setInterval(() => { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); }, 3000);
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
		tickRef.current = setInterval(() => { setS((p) => ({ ...p, qi: p.qi + autoPerSec })); }, 1000);
		return () => tickRef.current && clearInterval(tickRef.current);
	  }, [autoPerSec]);

	  // ====== 動作 ======
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
		setS((p) => ({ ...p, stones: p.stones - cost, skills: { ...p.skills, [sk]: p.skills[sk] + 1 } }));
	  };

	  const buyArtifact = (ak) => {
		const a = ARTIFACTS[ak];
		if (s.artifacts[ak]) { setMsg("已購買過此法寶。"); return; }
		if (s.realmIndex < a.unlockRealmIndex) { setMsg("境界未到，無法驅使此法寶。"); return; }
		if (s.stones < a.cost) { setMsg("靈石不足。"); return; }
		setS((p) => ({ ...p, stones: p.stones - a.cost, artifacts: { ...p.artifacts, [ak]: true } }));
	  };

	  const comprehendDao = () => {
		const ok = Math.random() < 0.5; // 50% 得 1 道心
		setS((p) => ({ ...p, daoHeart: p.daoHeart + (ok ? 1 : 0) }));
		setMsg(ok ? "頓悟片刻，道心+1。" : "心浮氣躁，未得所悟。");
	  };

	  // ====== 突破（含渡劫特化） ======
	  const nextRealm = REALMS[s.realmIndex + 1];
	  const canAscend = s.realmIndex >= REALMS.length - 1 && s.qi >= 100_000_000;

	  const tryBreakthrough = (useDaoHeart = false) => {
		if (!nextRealm) { setMsg("已至圓滿，去飛升吧！"); return; }
		if (s.qi < nextRealm.costQi) { setMsg("修為不足，尚難撼動瓶頸。"); return; }

		const isIntoDujie = nextRealm.key === "dujie";
		const isDujieNow = REALMS[s.realmIndex]?.key === "dujie"; // 渡劫中→往上

		// 若涉及渡劫，改為開啟動畫流程（Modal）
		if (isIntoDujie || isDujieNow) {
		  setDujie({
			open: true,
			useDaoHeart: true, // 預設開啟，可在彈窗切換
			running: false,
			logs: [],
			finished: false,
			nextName: nextRealm.name,
			costQi: nextRealm.costQi,
		  });
		  return;
		}

		// 一般突破
		const baseChance = nextRealm.baseChance;
		const bonus = (useDaoHeart ? 0.1 : 0) + artBreakBonus; // 道心一次性 +10%
		const chance = Math.min(0.98, baseChance + bonus);
		const success = Math.random() < chance;

		if (success) {
		  setS((p) => ({
			...p,
			qi: p.qi - nextRealm.costQi,
			daoHeart: p.daoHeart - (useDaoHeart ? 1 : 0),
			realmIndex: p.realmIndex + 1,
		  }));
		  setMsg(`突破成功！晉階「${nextRealm.name}」。`);
		} else {
		  const lost = Math.floor(s.qi * 0.3);
		  setS((p) => ({
			...p,
			qi: Math.max(0, p.qi - lost),
			daoHeart: p.daoHeart - (useDaoHeart ? 1 : 0),
		  }));
		  setMsg(`走火入魔！損失 ${fmt(lost)} 修為。`);
		}
	  };

		const doDujie = () => {
		  // 九重天雷：每重一擊，基礎成功率為 baseChance + 累加加成。
		  // 可選擇消耗道心：每重 +8%，若持有陣盤再 +8%。
		  if (s.qi < nextRealm.costQi) { setMsg("修為不足，無法引雷。"); return; }
		  let chance = baseChance + bonus; // 第一次
		  let ok = true;
		  let daoUsed = 0;
		  for (let i = 1; i <= 9; i++) {
			// 玩家策略：若道心>0 則自動使用（簡版策略，可擴充成 UI 勾選）
			const addDao = s.daoHeart - daoUsed > 0 ? 0.08 : 0; // 每重可+8%
			const addArtifact = s.artifacts.zhenpan ? 0.08 : 0; // 陣盤護持
			const rollChance = Math.min(0.98, chance + addDao + addArtifact);
			const pass = Math.random() < rollChance;
			if (!pass) { ok = false; break; }
			if (addDao > 0) daoUsed += 1;
			// 下一重略微提高難度（或保持），這裡做微增
			chance = Math.max(0.2, rollChance - 0.03);
		  }
		  if (ok) {
			setS((p) => ({ ...p, qi: p.qi - nextRealm.costQi, daoHeart: Math.max(0, p.daoHeart - daoUsed), realmIndex: p.realmIndex + 1 }));
			setMsg(`九重天雷盡滅！成功晉階「${nextRealm.name}」，消耗道心 ${daoUsed}。`);
		  } else {
			const lost = Math.floor(s.qi * 0.5); // 渡劫失敗懲罰重一些
			setS((p) => ({ ...p, qi: Math.max(0, p.qi - lost), daoHeart: Math.max(0, p.daoHeart - daoUsed) }));
			setMsg(`渡劫失敗！損失 ${fmt(lost)} 修為，道心消耗 ${daoUsed}。`);
		  }
		};

		if (isIntoDujie || isDujieNow) doDujie(); else doNormal();
	  };

	  const ascend = () => {
		if (!canAscend) { setMsg("尚未圓滿或修為不足，無法飛升。"); return; }
		setS((p) => ({
		  ...defaultState(),
		  ascensions: p.ascensions + 1,
		  talent: { ...p.talent },
		  artifacts: { ...p.artifacts },
		}));
		setMsg("雷劫已過，飛升成功！獲得 1 點天命可分配（下版可加）。");
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
		} catch (e) { setMsg("匯入失敗，格式不正確。"); }
	  };

	  // ====== UI ======
	  return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-gray-900 to-black text-slate-100 p-4 md:p-8">
		  {/* Header */}
		  <header className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8 max-w-6xl mx-auto">
			<div>
			  <h1 className="text-3xl md:text-4xl font-bold tracking-wide">修仙論道 · MVP</h1>
			  <p className="text-slate-300">修煉 → 強化 → 突破 → 飛升（含：背景四階段、渡劫特化、本地排行）</p>
			</div>
			<div className="flex-1" />
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
			  <Stat label="靈力" value={fmt(s.qi)} />
			  <Stat label="靈石" value={fmt(s.stones)} />
			  <Stat label="道心" value={fmt(s.daoHeart)} />
			  <Stat label="境界" value={`${REALMS[s.realmIndex]?.name ?? "無"} ×${REALMS[s.realmIndex]?.multiplier ?? 1}`} />
			</div>
		  </header>

		  {/* 背景四階段切換 + 打坐動畫位（保留） */}
		  <MeditationHeroImg realmKey={REALMS[s.realmIndex]?.key} />

		  {dujie.open && (
			<DujieModal
			  state={dujie}
			  setState={setDujie}
			  artBreakBonus={artBreakBonus}
			  onFinish={(result) => {
				const { success, daoUsed, failStage, costQi } = result;
				if (success) {
				  setS((p) => ({
					...p,
					qi: p.qi - costQi,
					daoHeart: Math.max(0, p.daoHeart - daoUsed),
					realmIndex: p.realmIndex + 1,
				  }));
				  setMsg(`九重天雷盡滅！成功晉階「${nextRealm?.name || ''}」，消耗道心 ${daoUsed}。`);
				} else {
				  const lost = Math.floor(s.qi * 0.5);
				  setS((p) => ({
					...p,
					qi: Math.max(0, p.qi - lost),
					daoHeart: Math.max(0, p.daoHeart - daoUsed),
				  }));
				  setMsg(`渡劫失敗（第 ${failStage} 重），損失 ${fmt(lost)} 修為，道心消耗 ${daoUsed}。`);
				}
			  }}
			/>
		  )}

		  {msg && (
			<div className="max-w-6xl mx-auto mt-4 p-3 rounded-xl bg-emerald-900/40 border border-emerald-700/40 text-emerald-200 text-sm">
			  {msg}
			</div>
		  )}

		  {/* 主要操作區 */}
		  <section className="max-w-6xl mx-auto mt-6 grid md:grid-cols-3 gap-6">
			{/* ...（這裡保留你原本的三個 Card：修煉、功法、法寶）... */}
		  </section>

		  {/* 突破 / 渡劫 / 飛升 */}
		  <section className="max-w-6xl mx-auto mt-6 grid md:grid-cols-2 gap-6">
			{/* ...（突破、飛升卡片，保留原碼）... */}
		  </section>

		  {/* 新手/每日 + 排行榜（本地） */}
		  <section className="max-w-6xl mx-auto mt-6 grid md:grid-cols-2 gap-6">
			<RewardsBar s={s} setS={setS} setMsg={setMsg} />
			<Leaderboard s={s} />
		  </section>

		  {/* 存檔 / 匯入 / Debug */}
		  <section className="max-w-6xl mx-auto mt-6 grid md:grid-cols-2 gap-6">
			{/* ...（存檔/匯入 + 自檢卡片，保留原碼）... */}
		  </section>

		  <footer className="max-w-6xl mx-auto text-center mt-10 text-xs text-slate-500">
			© {new Date().getFullYear()} 修仙論道 · MVP 原型
		  </footer>
		</div>
	  ); // ← 這行一定要在這裡結束 return(...)    // ← 這行結束主元件


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

	// === 新手／每日獎勵 ===
	function RewardsBar({ s, setS, setMsg }){
	  const claimStarter = () => {
		if (s.meta.starterGift) return;
		setS((p)=>({ ...p, stones: p.stones + 500, meta: { ...p.meta, starterGift: true } }));
		setMsg("新手禮包已領取：靈石 +500！");
	  };
	  const claimDaily = () => {
		if (s.login.dayClaimed !== false) return;
		const gain = 30 + Math.min(6, s.login.streak)*10; // 40~90
		setS((p)=>({ ...p, stones: p.stones + gain, login: { ...p.login, dayClaimed: true } }));
		setMsg(`每日修煉有成：靈石 +${gain}`);
	  };
	  return (
		<Card title="新手 / 每日獎勵">
		  <div className="grid md:grid-cols-2 gap-3">
			<div className="p-3 rounded-xl bg-amber-900/30 border border-amber-700/30 text-amber-100 text-sm flex items-center justify-between">
			  <div>
				<div className="font-medium">新手禮包</div>
				<div className="text-xs opacity-80">首次入門贈禮：靈石 ×500</div>
			  </div>
			  <button onClick={claimStarter} disabled={s.meta.starterGift} className={`px-3 py-1.5 rounded-lg ${s.meta.starterGift? 'bg-slate-700 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-500'}`}>{s.meta.starterGift? '已領取' : '領取'}</button>
			</div>
			<div className="p-3 rounded-xl bg-emerald-900/30 border border-emerald-700/30 text-emerald-100 text-sm flex items-center justify-between">
			  <div>
				<div className="font-medium">每日修煉獎</div>
				<div className="text-xs opacity-80">連續 {s.login.streak} 天</div>
			  </div>
			  <button onClick={claimDaily} disabled={s.login.dayClaimed===true} className={`px-3 py-1.5 rounded-lg ${s.login.dayClaimed? 'bg-slate-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'}`}>{s.login.dayClaimed? '已領取' : '領取'}</button>
			</div>
		  </div>
		</Card>
	  );
	}

	// === 排行榜（本地） ===
	function Leaderboard({ s }){
	  const score = s.ascensions*100 + s.realmIndex*10 + Math.floor(s.stones/1000);
	  const saveScore = () => {
		try{
		  const raw = localStorage.getItem('xiuxian-leaderboard') || '[]';
		  const arr = JSON.parse(raw);
		  const name = s.playerName || '散仙';
		  arr.push({ name, score, time: Date.now() });
		  arr.sort((a,b)=> b.score - a.score);
		  localStorage.setItem('xiuxian-leaderboard', JSON.stringify(arr.slice(0,10)));
		}catch(e){}
	  };
	  useEffect(()=>{ saveScore(); }, [s.ascensions]);
	  const board = (()=>{ try{ return JSON.parse(localStorage.getItem('xiuxian-leaderboard')||'[]'); }catch(e){ return []; } })();
	  return (
		<Card title="排行榜（本地）">
		  <div className="flex items-center gap-2 mb-3">
			<input defaultValue={s.playerName} onChange={(e)=> localStorage.setItem('xiuxian-playerName', e.target.value.slice(0,12))} placeholder="取個道號…" className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-slate-700 outline-none text-sm" />
			<button onClick={saveScore} className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-sm">提交成績</button>
		  </div>
		  <ol className="space-y-1 text-sm">
			{board.map((r,i)=> (
			  <li key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60">
				<span className="text-slate-300">{i+1}. {r.name}</span>
				<span className="font-mono">{r.score}</span>
			  </li>
			))}
		  </ol>
		  <div className="text-xs text-slate-400 mt-2">* 之後可接 Firebase 變成全球排行榜</div>
		</Card>
	  );
	}

	// === 打坐修仙動畫元件（四階段背景 + 柔光） ===
	function MeditationHeroImg({ realmKey }){
	  const stageKey = useMemo(() => {
		if (realmKey === 'daluo') return 'daluo';
		if (realmKey === 'dujie') return 'dujie';
		const immortalSet = new Set(['zhenxian','tianxian','xuanxian','jinxian','taiyi']);
		if (immortalSet.has(realmKey)) return 'zhenxian';
		return realmKey;
	  }, [realmKey]);
	  const bg = BACKGROUNDS[stageKey] || BACKGROUNDS[realmKey] || BACKGROUNDS._default;
	  return (
		<div className="relative max-w-6xl mx-auto mt-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/60 to-black/60">
		  <div className="absolute inset-0 -z-10">
			<img src={bg} alt="bg" className="w-full h-full object-cover opacity-50" />
		  </div>
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
		  <div className="relative flex flex-col md:flex-row items-center justify-center px-6 py-16 md:py-20 gap-4 md:gap-10 min-h-[220px]">
			<div className="text-center md:text-left max-w-[520px]">
			  <h3 className="text-2xl md:text-3xl font-semibold leading-tight">入定·吐納</h3>
			  <p className="text-slate-300 mt-1 leading-relaxed">隨呼吸起伏，靈氣自丹田匯聚——點擊修煉或嘗試突破吧。</p>
			</div>
		  </div>
		</div>
	  );
	}

	// === 渡劫 Modal（九重天雷動畫 + 道心開關） ===
	function DujieModal({ state, setState, artBreakBonus, onFinish }){
	  const { open, useDaoHeart, running, logs, finished, nextName, costQi } = state;
	  if (!open) return null;

	  const closeIfDone = () => { if (finished && !running) setState((p)=> ({ ...p, open:false })); };

	  const start = () => {
		if (running) return;
		setState((p)=> ({ ...p, running:true, logs:[], finished:false }));

		let stage = 1;
		let chance = 0.5; // 會在第一輪覆蓋
		let daoUsed = 0;

		const step = () => {
		  if (stage > 9) {
			// 成功全部通過
			setState((p)=> ({ ...p, running:false, finished:true }));
			onFinish({ success:true, daoUsed, failStage:null, costQi });
			return;
		  }
		  // 初始機率：用上一輪 chance 或基本面，保守取 55% 起點，並加成
		  const base = Math.max(0.55, (0.35 + artBreakBonus));
		  const addDao = useDaoHeart ? 0.08 : 0;
		  const rollChance = Math.min(0.98, (stage === 1 ? base : chance) + addDao);
		  const pass = Math.random() < rollChance;

		  if (useDaoHeart) daoUsed += 1; // 每重消耗 1 道心（若開啟）

		  setState((p)=> ({ ...p, logs: [...p.logs, { stage, pass, chance: rollChance }] }));

		  if (!pass) {
			setState((p)=> ({ ...p, running:false, finished:true }));
			onFinish({ success:false, daoUsed, failStage:stage, costQi });
			return;
		  }
		  // 下一重略降 3% 形成壓力
		  chance = Math.max(0.2, rollChance - 0.03);
		  stage += 1;
		  setTimeout(step, 800);
		};

		setTimeout(step, 400);
	  };

	  return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
		  <div className="absolute inset-0 bg-black/70" />
		  <div className="relative w-full max-w-lg mx-auto rounded-2xl border border-indigo-500/40 bg-slate-900 shadow-2xl p-5">
			<div className="flex items-center justify-between mb-3">
			  <div>
				<div className="text-sm text-indigo-300">天劫臨身</div>
				<h3 className="text-xl font-semibold">九重天雷 · 渡劫晉階 → {nextName}</h3>
			  </div>
			  <label className="flex items-center gap-2 text-sm">
				<input type="checkbox" checked={useDaoHeart} onChange={(e)=> setState((p)=> ({ ...p, useDaoHeart: e.target.checked }))} />
				使用道心（每重 +8%）
			  </label>
			</div>

			{/* 九格顯示 */}
			<div className="grid grid-cols-3 gap-2 my-3">
			  {Array.from({length:9}).map((_,i)=> {
				const row = logs[i];
				const isActive = running && logs.length === i;
				return (
				  <div key={i} className={`h-16 rounded-xl border flex items-center justify-center text-lg font-semibold
					${row ? (row.pass ? 'bg-emerald-600/30 border-emerald-400/40 text-emerald-200' : 'bg-rose-600/30 border-rose-400/40 text-rose-200')
						: 'bg-slate-800/60 border-slate-600/50 text-slate-300'}
					${isActive ? 'ring-2 ring-indigo-400 animate-pulse' : ''}
				  `}>
					{row ? (row.pass ? '✓' : '✗') : (isActive ? '⚡' : i+1)}
				  </div>
				);
			  })}
			</div>

			{/* 概率提示 */}
			<div className="text-xs text-slate-400 mb-3">每重成功率會隨進度微降；開啟「使用道心」可每重 +8%，持有鎮仙陣盤另 +8%。</div>

			<div className="flex items-center justify-end gap-2">
			  {!finished && <button onClick={start} disabled={running} className={`px-4 py-2 rounded-lg ${running? 'bg-slate-700 cursor-not-allowed':'bg-indigo-700 hover:bg-indigo-600'}`}>{running? '渡劫中…':'開始渡劫'}</button>}
			  {finished && <button onClick={()=> setState((p)=> ({ ...p, open:false }))} className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600">確定</button>}
			</div>

			{/* 簡單的閃電動畫樣式 */}
			<style>{`
			  @keyframes bolt { 0%,100%{ opacity:.2 } 20%{ opacity:1 } 40%{ opacity:.3 } 60%{ opacity:.9 } 80%{ opacity:.4 } }
			  .animate-bolt{ animation: bolt .6s ease-in-out infinite }
			`}</style>
		  </div>
		</div>
	  );
	}
