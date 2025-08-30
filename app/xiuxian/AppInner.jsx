"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BACKGROUNDS } from "../../data/backgrounds";
import { punishQiOverflow as punishQiOverflowRaw } from "./lib/qiOverflow";

/* ===================== 常量 ===================== */
const SAVE_KEY = "xiuxian-save-v1";

const BASE_AUTO_PER_SEC = 100;   // 每秒自動靈力（會再乘各種加成）
const BASE_CLICK_GAIN   = 500;   // 每次點擊靈力
const QI_TO_STONE       = 100;   // 多少靈力煉 1 枚靈石
// 放在 useState 之後
const safeSkills = useMemo(() => {
  const k = s?.skills;
  if (k && typeof k === 'object') {
    return {
      tuna:    Number(k.tuna ?? 0),
      wuxing:  Number(k.wuxing ?? 0),
      jiutian: Number(k.jiutian ?? 0),
    };
  }
  return { tuna: 0, wuxing: 0, jiutian: 0 };
}, [s?.skills]);

/* ====== 壽元：各境界上限（年） ====== */
const LIFE_YEARS_BY_REALM = [30, 60, 120, 240, 480, 960, 1500, 3000];
const toDays = (y) => Math.round((Number(y) || 0) * 365);
const LIFE_DECAY_PER_SEC = 1 / 360; // 每 6 分鐘扣 1 天

/* ===================== 工具 ===================== */
const num  = (x, d = 0) => (Number.isFinite(Number(x)) ? Number(x) : d);
const bool = (x) => x === true;
const fmt = (n) => {
  const v = Number(n) || 0;
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}兆`;
  if (v >= 1e8)  return `${(v / 1e8).toFixed(2)}億`;
  if (v >= 1e4)  return `${(v / 1e4).toFixed(2)}萬`;
  return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(1);
};
const costOfSkill = (base, growth, lv) => Math.ceil(base * Math.pow(growth, lv));

/* 讀/寫存檔（統一 stones/gold/spiritStone） */
const normalizeSave = (obj = {}) => {
  const stones = num(obj.stones ?? obj.spiritStone ?? obj.gold, 0);
  return { ...obj, stones, gold: stones, spiritStone: stones };
};
const writeSave = (obj) => {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(normalizeSave(obj))); } catch {}
};
const loadSaveSafely = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw || raw === "null") {
      if (raw === "null") localStorage.removeItem(SAVE_KEY);
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return sanitizeSave(parsed);
  } catch {
    try { localStorage.removeItem(SAVE_KEY); } catch {}
    return null;
  }
};

/* 統一/矯正欄位（功法用“數字等級”） */
function sanitizeSave(sv) {
  const realmIndex = Math.max(0, parseInt(sv?.realmIndex ?? 0) || 0);
  return normalizeSave({
    qi:        num(sv?.qi, 0),
    stones:    num(sv?.stones, 0),
    daoHeart:  num(sv?.daoHeart, 0),
    realmIndex,
    skills: {
      tuna:   num(sv?.skills?.tuna, 0),
      wuxing: num(sv?.skills?.wuxing, 0),
      jiutian:num(sv?.skills?.jiutian, 0),
    },
    artifacts: {
      qingxiao: bool(sv?.artifacts?.qingxiao),
      zijinhu:  bool(sv?.artifacts?.zijinhu),
      zhenpan:  bool(sv?.artifacts?.zhenpan),
    },
    login: {
      last:       sv?.login?.last || "",
      streak:     num(sv?.login?.streak, 0),
      dayClaimed: bool(sv?.login?.dayClaimed),
    },
    playerName: sv?.playerName || "散仙",
    ascensions: num(sv?.ascensions, 0),
    talent: { auto: num(sv?.talent?.auto, 0), click: num(sv?.talent?.click, 0) },
  });
}

/* 依境界上限（天） */
const maxDaysOf = (realmIndex) =>
  toDays(LIFE_YEARS_BY_REALM[realmIndex] ?? LIFE_YEARS_BY_REALM[0]);

/* 突破後延長壽元 & 衰減 */
function extendLifespan(p, newRealmIndex) {
  const oldMax = p?.lifespan?.maxDays ?? maxDaysOf(p.realmIndex ?? 0);
  const newMax = maxDaysOf(newRealmIndex);
  const delta  = Math.max(0, newMax - oldMax);
  const left   = Math.min((p?.lifespan?.leftDays ?? oldMax) + delta, newMax);
  return { ...p, lifespan: { maxDays: newMax, leftDays: left } };
}
function decayLifespanByDays(p, days) {
  if (!days || days <= 0) return p;
  const left = Math.max(0, (p?.lifespan?.leftDays ?? 0) - days);
  return { ...p, lifespan: { ...(p.lifespan || {}), leftDays: left } };
}

/* qi 溢出懲罰（安全包） */
const safePunish = (stateObj) => {
  try {
    if (typeof punishQiOverflowRaw === "function") {
      const maybe = punishQiOverflowRaw(stateObj);
      return maybe ?? stateObj;
    }
  } catch {}
  return stateObj;
};

/* ===================== 遊戲資料 ===================== */
const REALMS = [
  { key: "lianti",   name: "煉體", multiplier: 0.8,  costQi: 50,     baseChance: 0.95 },
  { key: "lianqi",   name: "練氣", multiplier: 1.0,  costQi: 100,    baseChance: 0.90 },
  { key: "zhujii",   name: "築基", multiplier: 2.0,  costQi: 1000,   baseChance: 0.85 },
  { key: "jindan",   name: "金丹", multiplier: 5.0,  costQi: 12000,  baseChance: 0.75 },
  { key: "yuanying", name: "元嬰", multiplier: 10.0, costQi: 60000,  baseChance: 0.65 },
  { key: "dujie",    name: "渡劫", multiplier: 16.0, costQi: 200000, baseChance: null },
  { key: "zhenxian", name: "真仙", multiplier: 28.0, costQi: 650000, baseChance: 0.55 },
  { key: "daluo",    name: "大羅", multiplier: 48.0, costQi: 2500000,baseChance: 0.45 },
];

const SKILLS = {
  tuna:   { name: "吐納術",   desc: "自動產出 +2% /Lv",  baseCost: 20,  growth: 1.25, autoPct: 0.02 },
  wuxing: { name: "五行訣",   desc: "自動產出 +5% /Lv",  baseCost: 80,  growth: 1.30, autoPct: 0.05 },
  jiutian:{ name: "九天玄功", desc: "自動產出 +10%/Lv", baseCost: 260, growth: 1.35, autoPct: 0.10 },
};

const ARTIFACTS = {
  qingxiao: { key: "qingxiao", name: "青霄劍",   desc: "點擊效率 +25%", clickPct: 0.25, autoPct: 0,    brPct: 0,    cost: 500,  unlockRealmIndex: 2 },
  zijinhu:  { key: "zijinhu",  name: "紫金葫",   desc: "自動產出 +15%", clickPct: 0,    autoPct: 0.15, brPct: 0,    cost: 1000, unlockRealmIndex: 3 },
  zhenpan:  { key: "zhenpan",  name: "鎮仙陣盤", desc: "突破成功 +8%",  clickPct: 0,    autoPct: 0,    brPct: 0.08, cost: 2000, unlockRealmIndex: 4 },
};

/* ===================== 初始存檔（功法=數字等級） ===================== */
const defaultState = () => ({
  qi: 0,
  stones: 0,
  daoHeart: 0,
  realmIndex: 0,
  skills: { tuna: 0, wuxing: 0, jiutian: 0 },
  artifacts: { qingxiao: false, zijinhu: false, zhenpan: false },
  ascensions: 0,
  talent: { auto: 0, click: 0 },
  playerName: "散仙",
  meta: { starterGift: false },
  login: { last: "", streak: 0, dayClaimed: false },
  lastTick: 0,
  lifespan: {
    maxDays: maxDaysOf(0),
    leftDays: maxDaysOf(0),
  },
});

/* ===================== 主元件 ===================== */
export default function AppInner() {
  const [s, setS] = useState(() => defaultState());
  const [msg, setMsg] = useState("");
  const [importText, setImportText] = useState("");
  const tickRef = useRef(null);

  const [dujie, setDujie] = useState({
    open: false, useDaoHeart: true, running: false, logs: [],
    finished: false, nextName: "", costQi: 0,
  });

  /* 首次掛載：安全讀檔 → 合併 → 每日登入 + 相隔天數衰減壽元 */
  useEffect(() => {
    const saved = loadSaveSafely();
    setS((prev) => {
      let next = saved ? { ...prev, ...saved } : { ...prev };

      if (!next.lifespan) {
        const idx = Math.max(0, next.realmIndex ?? 0);
        next.lifespan = { maxDays: maxDaysOf(idx), leftDays: maxDaysOf(idx) };
      }

      const today = new Date().toISOString().slice(0, 10);
      const last  = next.login?.last || null;
      if (last) {
        const diffDays = Math.max(0, Math.floor((Date.parse(today) - Date.parse(last)) / 86400000));
        next = decayLifespanByDays(next, diffDays);
      }
      next.login = {
        last: today,
        streak: last ? (Number(next.login?.streak) || 0) + 1 : 1,
        dayClaimed: false,
      };
      return next;
    });
  }, []);
// 讀檔 + 遷移補丁（放在 autosave 之前）
useEffect(() => {
  const saved = loadSaveSafely();
  if (!saved) return;
  setS(prev => {
    // 先合併
    let next = { ...prev, ...saved };

    // 🔒 不讓奇怪的 saved.skills 蓋掉結構
    if (typeof saved.skills !== 'object' || saved.skills === null) {
      // 舊版可能把 skills 存成數字或空 → 轉成物件
      const n = Number(saved.skills) || 0;
      next.skills = { tuna: n, wuxing: 0, jiutian: 0 };
    } else {
      // 正常情況也做數字化與預設值補齊
      next.skills = {
        tuna:    Number(saved.skills.tuna ?? prev.skills?.tuna ?? 0),
        wuxing:  Number(saved.skills.wuxing ?? prev.skills?.wuxing ?? 0),
        jiutian: Number(saved.skills.jiutian ?? prev.skills?.jiutian ?? 0),
      };
    }
    return next;
  });
}, []);


  /* 單一自動存檔 */
  useEffect(() => { writeSave(s); }, [s]);

/* 加成 */
const realm = REALMS[s.realmIndex] ?? REALMS[REALMS.length - 1];

// 統一用 safeSkills 保護，避免 undefined
const safeSkills = {
  tuna:    Number(s?.skills?.tuna ?? 0),
  wuxing:  Number(s?.skills?.wuxing ?? 0),
  jiutian: Number(s?.skills?.jiutian ?? 0),
};

const skillAutoBonus =
  safeSkills.tuna    * SKILLS.tuna.autoPct +
  safeSkills.wuxing  * SKILLS.wuxing.autoPct +
  safeSkills.jiutian * SKILLS.jiutian.autoPct;
  const artAutoBonus   = s.artifacts.zijinhu ? ARTIFACTS.zijinhu.autoPct : 0;
  const artClickBonus  = s.artifacts.qingxiao ? ARTIFACTS.qingxiao.clickPct : 0;
  const artBreakBonus  = s.artifacts.zhenpan ? ARTIFACTS.zhenpan.brPct : 0;
  const talentAutoBonus  = s.talent.auto  * 0.10;
  const talentClickBonus = s.talent.click * 0.10;

  const totalAutoMultiplier  = (1 + skillAutoBonus + artAutoBonus + talentAutoBonus) * realm.multiplier;
  const totalClickMultiplier = (1 + artClickBonus  + talentClickBonus) * realm.multiplier;

  const autoPerSec = BASE_AUTO_PER_SEC * totalAutoMultiplier;
  const clickGain  = BASE_CLICK_GAIN * totalClickMultiplier;

  /* 每秒自動產出 + 壽元遞減 */
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setS((p) => {
        let next = {
          ...p,
          qi: (Number(p.qi) || 0) + autoPerSec,
          lifespan: {
            ...(p.lifespan || {}),
            leftDays: Math.max(0, (p.lifespan?.leftDays ?? 0) - LIFE_DECAY_PER_SEC),
          },
          lastTick: Date.now(),
        };
        next = safePunish(next);
        return next;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [autoPerSec]);

  /* 動作 */
  const cultivate = () => setS((p) => {
    let next = { ...p, qi: (Number(p.qi) || 0) + clickGain };
    next = safePunish(next);
    return next;
  });

  const refineStones = () => {
    const qiNow = Number(s.qi || 0);
    if (qiNow < QI_TO_STONE) { setMsg("靈力不足，至少需要 100 靈力才能煉化為 1 枚靈石。"); return; }
    const stonesGain = Math.floor(qiNow / QI_TO_STONE);
    const qiCost = stonesGain * QI_TO_STONE;
    setS((p) => {
      let next = {
        ...p,
        qi: Math.max(0, (Number(p.qi) || 0) - qiCost),
        stones: (Number(p.stones) || 0) + stonesGain,
      };
      next = safePunish(next);
      return next;
    });
    setMsg(`煉化完成，獲得 ${stonesGain} 枚靈石。`);
  };

  const buySkill = (sk) => {
    const def = SKILLS[sk], lv = Number(safeSkills[sk] ?? 0);
    const cost = costOfSkill(def.baseCost, def.growth, lv);
    if ((Number(s.stones) || 0) < cost) { setMsg("靈石不足。"); return; }
    setS((p) => ({
      ...p,
      stones: Math.max(0, (Number(p.stones) || 0) - cost),
      skills: { ...p.skills, [sk]: (Number(p.skills[sk]) || 0) + 1 },
    }));
  };

  const buyArtifact = (ak) => {
    const a = ARTIFACTS[ak];
    if (s.artifacts[ak]) { setMsg("已購買過此法寶。"); return; }
    if (s.realmIndex < a.unlockRealmIndex) { setMsg("境界未到，無法驅使此法寶。"); return; }
    if ((Number(s.stones) || 0) < a.cost) { setMsg("靈石不足。"); return; }
    setS((p) => ({
      ...p,
      stones: Math.max(0, (Number(p.stones) || 0) - a.cost),
      artifacts: { ...p.artifacts, [ak]: true },
    }));
  };

  const comprehendDao = () => {
    const ok = Math.random() < 0.5;
    setS((p) => ({ ...p, daoHeart: (Number(p.daoHeart) || 0) + (ok ? 1 : 0) }));
    setMsg(ok ? "頓悟片刻，道心 +1。" : "心浮氣躁，未得所悟。");
  };

  const nextRealm = REALMS[s.realmIndex + 1];
  const canAscend = s.realmIndex >= REALMS.length - 1 && (Number(s.qi) || 0) >= 100_000_000;

  const tryBreakthrough = (useDaoHeart = false) => {
    if (!nextRealm) { setMsg("已至圓滿，去飛升吧！"); return; }
    if ((Number(s.qi) || 0) < nextRealm.costQi) { setMsg("修為不足，尚難撼動瓶頸。"); return; }

    const isIntoDujie = nextRealm.key === "dujie";
    const isDujieNow  = REALMS[s.realmIndex]?.key === "dujie";
    if (isIntoDujie || isDujieNow) {
      setDujie({ open: true, useDaoHeart: true, running: false, logs: [], finished: false,
        nextName: nextRealm.name, costQi: nextRealm.costQi });
      return;
    }

    const baseChance = nextRealm.baseChance ?? 0.5;
    const bonus  = (useDaoHeart ? 0.10 : 0) + (s.artifacts.zhenpan ? ARTIFACTS.zhenpan.brPct : 0);
    const chance = Math.min(0.98, baseChance + bonus);
    const success = Math.random() < chance;

    if (success) {
      setS((p) => {
        const newIndex = (Number(p.realmIndex) || 0) + 1;
        let np = {
          ...p,
          qi: Math.max(0, (Number(p.qi) || 0) - nextRealm.costQi),
          daoHeart: Math.max(0, (Number(p.daoHeart) || 0) - (useDaoHeart ? 1 : 0)),
          realmIndex: newIndex,
        };
        np = extendLifespan(np, newIndex);
        return np;
      });
      setMsg(`突破成功！晉階「${nextRealm.name}」。`);
    } else {
      const lost = Math.floor((Number(s.qi) || 0) * 0.3);
      setS((p) => ({ ...p, qi: Math.max(0, (Number(p.qi) || 0) - lost),
        daoHeart: Math.max(0, (Number(p.daoHeart) || 0) - (useDaoHeart ? 1 : 0)) }));
      setMsg(`走火入魔！損失 ${fmt(lost)} 修為。`);
    }
  };

  const ascend = () => {
    if (!canAscend) { setMsg("尚未圓滿或修為不足，無法飛升。"); return; }
    setS((p) => ({
      ...defaultState(),
      ascensions: (Number(p.ascensions) || 0) + 1,
      talent: { ...p.talent },
      artifacts: { ...p.artifacts },
    }));
    setMsg("雷劫已過，飛升成功！獲得 1 點天命可分配（下版可加）。");
  };

  const hardReset = () => {
    if (!confirm("確定要刪除存檔並重置嗎？")) return;
    try { localStorage.removeItem(SAVE_KEY); } catch {}
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
      setS((p) => ({ ...p, ...sanitizeSave(parsed) }));
      setMsg("存檔已匯入。");
      setImportText("");
    } catch { setMsg("匯入失敗，格式不正確。"); }
  };

  const [clickedFx, setClickedFx] = useState(false);
  const clickTrain = () => { setClickedFx(true); cultivate(); setTimeout(() => setClickedFx(false), 120); };

  /* ============================ UI ============================ */
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-gray-900 to-black text-slate-100 p-4 md:p-8">
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

      <MeditationHeroImg realmKey={REALMS[s.realmIndex]?.key} />

      {dujie.open && (
        <DujieModal
          state={dujie}
          setState={setDujie}
          artBreakBonus={s.artifacts.zhenpan ? ARTIFACTS.zhenpan.brPct : 0}
          onFinish={({ success, daoUsed, failStage, costQi }) => {
            if (success) {
              setS((p) => {
                const newIndex = (Number(p.realmIndex) || 0) + 1;
                let np = {
                  ...p,
                  qi: Math.max(0, (Number(p.qi) || 0) - costQi),
                  daoHeart: Math.max(0, (Number(p.daoHeart) || 0) - daoUsed),
                  realmIndex: newIndex,
                };
                np = extendLifespan(np, newIndex);
                return np;
              });
              setMsg(`九重天雷盡滅！成功晉階「${REALMS[s.realmIndex + 1]?.name || ""}」，消耗道心 ${daoUsed}。`);
            } else {
              const lost = Math.floor((Number(s.qi) || 0) * 0.5);
              setS((p) => ({ ...p,
                qi: Math.max(0, (Number(p.qi) || 0) - lost),
                daoHeart: Math.max(0, (Number(p.daoHeart) || 0) - daoUsed) }));
              setMsg(`渡劫失敗（第 ${failStage} 重），損失 ${fmt(lost)} 修為，道心消耗 ${daoUsed}。`);
            }
          }}
        />
      )}

      {msg && <div className="max-w-6xl mx-auto mt-4 p-3 rounded-xl bg-emerald-900/40 border border-emerald-700/40 text-emerald-200 text-sm">{msg}</div>}

      <section className="max-w-6xl mx-auto mt-6 grid md:grid-cols-3 gap-6">
        <Card title="打坐修煉">
          <div className="text-sm text-slate-300">每次點擊 +{clickGain.toFixed(1)} 靈力；每秒自動 +{autoPerSec.toFixed(1)} 靈力</div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button onClick={clickTrain} className={`px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 active:scale-95 transition ${clickedFx ? "ring-4 ring-amber-400/60" : ""}`}>修煉</button>
            <button onClick={refineStones} className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600">煉化靈石</button>
            <button onClick={comprehendDao} className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600">參悟道心</button>
          </div>
        </Card>

        <Card title="功法強化">
          <ul className="space-y-2 text-sm">
            {["tuna","wuxing","jiutian"].map((k)=> {
              const def = SKILLS[k], lv = Number(s.skills[k] || 0);
              const cost = costOfSkill(def.baseCost, def.growth, lv);
              const can = (Number(s.stones) || 0) >= cost;
              return (
                <li key={k} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-black/30 border border-slate-700/40">
                  <div>
                    <div className="font-medium">{def.name} <span className="opacity-70">Lv.{lv}</span></div>
                    <div className="text-slate-400 text-xs">{def.desc}</div>
                  </div>
                  <button onClick={()=>buySkill(k)} disabled={!can} className={`px-3 py-1.5 rounded-lg ${can? 'bg-sky-700 hover:bg-sky-600':'bg-slate-700 cursor-not-allowed'}`}>
                    升級（{fmt(cost)} 石）
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="法寶鋪（隨境界解鎖）">
          <ul className="space-y-2 text-sm">
            {Object.values(ARTIFACTS).map((a)=> {
              const owned     = !!s.artifacts[a.key];
              const unlocked  = s.realmIndex >= a.unlockRealmIndex;
              const canBuy    = unlocked && !owned && (Number(s.stones || 0) >= a.cost);
              return (
                <li key={a.key} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-black/30 border border-slate-700/40">
                  <div>
                    <div className="font-medium">{a.name}{owned && <span className="ml-2 text-emerald-400">（已持有）</span>}</div>
                    <div className="text-slate-400 text-xs">{a.desc}</div>
                    {!unlocked && <div className="text-xs text-amber-300 mt-1">需達 {REALMS[a.unlockRealmIndex]?.name} 解鎖</div>}
                  </div>
                  <button onClick={()=>buyArtifact(a.key)} disabled={!canBuy}
                          className={`px-3 py-1.5 rounded-lg ${canBuy? 'bg-purple-700 hover:bg-purple-600':'bg-slate-700 cursor-not-allowed'}`}>
                    {owned? '已購買' : `購買（${fmt(a.cost)} 石）`}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <section className="max-w-6xl mx-auto mt-6 grid md:grid-cols-2 gap-6">
        <Card title="突破境界">
          {nextRealm ? (
            <>
              <div className="text-sm text-slate-300">
                目標：{nextRealm.name}　需要修為：{fmt(nextRealm.costQi)}
                {nextRealm.key === "dujie" && <span className="ml-2 text-indigo-300">（將進入「渡劫」）</span>}
              </div>
              {nextRealm.baseChance != null && <div className="text-xs text-slate-400 mt-1">基礎成功率：約 {(nextRealm.baseChance*100).toFixed(0)}%</div>}
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={()=>tryBreakthrough(false)} className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600">嘗試突破</button>
                <button onClick={()=>tryBreakthrough(true)} className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600">道心輔助突破（-1 道心）</button>
              </div>
            </>
          ) : <div className="text-sm text-slate-300">已達當前系統可見的最高境界。</div>}
        </Card>

        <Card title="飛升">
          <div className="text-sm text-slate-300">條件：達到最終境界且修為 ≥ 100,000,000。</div>
          <div className="mt-3">
            <button onClick={ascend} disabled={!canAscend}
                    className={`px-4 py-2 rounded-lg ${canAscend? 'bg-emerald-700 hover:bg-emerald-600':'bg-slate-700 cursor-not-allowed'}`}>
              {canAscend? '飛升成仙！' : '尚未滿足條件'}
            </button>
          </div>
        </Card>
      </section>

      <section className="max-w-6xl mx-auto mt-6 grid md:grid-cols-2 gap-6">
        <RewardsBar s={s} setS={setS} setMsg={setMsg} />
        <Leaderboard s={s} />
      </section>

      <section className="max-w-6xl mx-auto mt-6">
        <DevTools setS={setS} setMsg={setMsg} />
      </section>

      <footer className="max-w-6xl mx-auto text-center mt-10 text-xs text-slate-500">
        © {new Date().getFullYear()} 修仙論道 · MVP 原型
      </footer>
    </div>
  );
}

/* ===================== 子元件 ===================== */
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

function RewardsBar({ s, setS, setMsg }) {
  const claimStarter = () => {
    if (s.meta.starterGift) return;
    setS((p) => ({ ...p, stones: (Number(p.stones)||0) + 500, meta: { ...p.meta, starterGift: true } }));
    setMsg("新手禮包已領取：靈石 +500！");
  };
  const claimDaily = () => {
    if (s.login.dayClaimed === true) return;
    const gain = 30 + Math.min(6, Number(s.login.streak)||0) * 10;
    setS((p) => ({ ...p, stones: (Number(p.stones)||0) + gain, login: { ...p.login, dayClaimed: true } }));
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
          <button onClick={claimStarter} disabled={s.meta.starterGift}
                  className={`px-3 py-1.5 rounded-lg ${s.meta.starterGift ? 'bg-slate-700 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-500'}`}>
            {s.meta.starterGift ? '已領取' : '領取'}
          </button>
        </div>

        <div className="p-3 rounded-xl bg-emerald-900/30 border border-emerald-700/30 text-emerald-100 text-sm flex items-center justify-between">
          <div>
            <div className="font-medium">每日修煉獎</div>
            <div className="text-xs opacity-80">連續 {s.login.streak} 天</div>
          </div>
          <button onClick={claimDaily} disabled={s.login.dayClaimed === true}
                  className={`px-3 py-1.5 rounded-lg ${s.login.dayClaimed ? 'bg-slate-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
            {s.login.dayClaimed ? '已領取' : '領取'}
          </button>
        </div>
      </div>
    </Card>
  );
}

function Leaderboard({ s }) {
  const score = (Number(s.ascensions)||0)*100 + (Number(s.realmIndex)||0)*10 + Math.floor((Number(s.stones)||0)/1000);
  const saveScore = () => {
    try{
      const raw = localStorage.getItem('xiuxian-leaderboard') || '[]';
      const arr = JSON.parse(raw);
      const name = s.playerName || '散仙';
      arr.push({ name, score, time: Date.now() });
      arr.sort((a,b)=> b.score - a.score);
      localStorage.setItem('xiuxian-leaderboard', JSON.stringify(arr.slice(0,10)));
    }catch{}
  };
  useEffect(()=>{ saveScore(); }, [s.ascensions]);
  const board = (()=>{ try{ return JSON.parse(localStorage.getItem('xiuxian-leaderboard')||'[]'); }catch(e){ return []; } })();
  return (
    <Card title="排行榜（本地）">
      <div className="flex items-center gap-2 mb-3">
        <input defaultValue={s.playerName}
               onChange={(e)=> localStorage.setItem('xiuxian-playerName', e.target.value.slice(0,12))}
               placeholder="取個道號…" className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-slate-700 outline-none text-sm" />
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

function MeditationHeroImg({ realmKey }) {
  const stageKey = useMemo(() => {
    if (realmKey === 'daluo') return 'daluo';
    if (realmKey === 'dujie') return 'dujie';
    const immortalSet = new Set(['zhenxian','tianxian','xuanxian','jinxian','taiyi']);
    if (immortalSet.has(realmKey)) return 'zhenxian';
    return realmKey;
  }, [realmKey]);

  const bg = BACKGROUNDS[stageKey] || BACKGROUNDS[realmKey] || BACKGROUNDS._default;

  return (
    <div className="relative max-w-6xl mx-auto mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a]">
      <img src={bg} alt="背景" className="absolute inset-0 w-full h-full object-cover opacity-60 z-0 select-none pointer-events-none" />
      <div className="relative z-30 flex justify-center py-12">
        <img src="/meditate.png" alt="打坐修煉"
             className="w-64 sm:w-80 md:w-[420px] drop-shadow-xl animate-float-slow select-none pointer-events-none" />
        <div className="ml-0 md:ml-10 text-center md:text-left max-w-[520px]">
          <h3 className="text-2xl md:text-3xl font-semibold leading-tight">入定·吐納</h3>
          <p className="text-slate-300 mt-1 leading-relaxed">隨呼吸起伏，靈氣自丹田匯聚——點擊修煉或嘗試突破吧。</p>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="aura w-44 h-44 rounded-full"/>
        <div className="aura w-64 h-64 rounded-full delay-300"/>
        <div className="aura w-80 h-80 rounded-full delay-700"/>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        {Array.from({length: 81}).map((_,i)=> (
          <span key={i} style={{"--a": `${(i/18)*360}deg`, "--r": `${120 + (i%6)*18}px`}} className="spark" />
        ))}
      </div>

      <style>{`
        @keyframes aura { 0%{ transform: scale(0.6); opacity: .35 } 70%{ opacity:.08 } 100%{ transform: scale(1.4); opacity: 0 } }
        .aura{ position:absolute; left:-50%; top:-50%; transform:translate(50%,50%);
               background:radial-gradient(circle, rgba(168,85,247,.25), rgba(59,130,246,.12) 40%, transparent 70%);
               animation:aura 3.6s linear infinite; filter: blur(2px); }
        .aura.delay-300{ animation-delay:.3s }
        .aura.delay-700{ animation-delay:.7s }

        @keyframes orbit { to { transform: rotate(var(--a)) translateX(var(--r)) rotate(calc(-1*var(--a))) } }
        @keyframes twinkle { 0%,100%{ opacity:.2 } 50%{ opacity:1 } }
        .spark{ position:absolute; left:50%; top:50%; width:3px; height:3px; background:#fff; border-radius:9999px;
                transform-origin: -var(--r) 0;
                animation: orbit 6s linear infinite, twinkle 3.2s ease-in-out infinite; }

        @keyframes float-slow { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-12px) } }
        .animate-float-slow{ animation: float-slow 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function DujieModal({ state, setState, artBreakBonus, onFinish }){
  const { open, useDaoHeart, running, logs, finished, nextName, costQi } = state;
  if (!open) return null;

  const start = () => {
    if (running) return;
    setState((p)=> ({ ...p, running:true, logs:[], finished:false }));

    let stage = 1;
    let chance = 0.5;
    let daoUsed = 0;

    const step = () => {
      if (stage > 9) {
        setState((p)=> ({ ...p, running:false, finished:true }));
        onFinish({ success:true, daoUsed, failStage:null, costQi });
        return;
      }
      const base = Math.max(0.75, (0.35 + artBreakBonus));
      const addDao = useDaoHeart ? 0.15 : 0;
      const rollChance = Math.min(0.98, (stage === 1 ? base : chance) + addDao);
      const pass = Math.random() < rollChance;

      if (useDaoHeart) daoUsed += 1;
      setState((p)=> ({ ...p, logs: [...p.logs, { stage, pass, chance: rollChance }] }));

      if (!pass) {
        setState((p)=> ({ ...p, running:false, finished:true }));
        onFinish({ success:false, daoUsed, failStage:stage, costQi });
        return;
      }
      chance = Math.max(0.6, rollChance - 0.03);
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
            <input type="checkbox" checked={useDaoHeart}
                   onChange={(e)=> setState((p)=> ({ ...p, useDaoHeart: e.target.checked }))} />
            使用道心（每重 +8%）
          </label>
        </div>

        <div className="grid grid-cols-3 gap-2 my-3">
          {Array.from({length:9}).map((_,i)=> {
            const row = logs[i];
            const isActive = running && logs.length === i;
            return (
              <div key={i} className={`h-16 rounded-xl border flex items-center justify-center text-lg font-semibold
                ${row ? (row.pass ? 'bg-emerald-600/30 border-emerald-400/40 text-emerald-200' : 'bg-rose-600/30 border-rose-400/40 text-rose-200')
                  : 'bg-slate-800/60 border-slate-600/50 text-slate-300'}
                ${isActive ? 'ring-2 ring-indigo-400 animate-pulse' : ''}`}>
                {row ? (row.pass ? '✓' : '✗') : (isActive ? '⚡' : i+1)}
              </div>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 mb-3">每重成功率會隨進度微降；開啟「使用道心」可每重 +8%，持有鎮仙陣盤另 +8%。</div>

        <div className="flex items-center justify-end gap-2">
          {!finished && <button onClick={start} disabled={running} className={`px-4 py-2 rounded-lg ${running? 'bg-slate-700 cursor-not-allowed':'bg-indigo-700 hover:bg-indigo-600'}`}>{running? '渡劫中…':'開始渡劫'}</button>}
          {finished && <button onClick={()=> setState((p)=> ({ ...p, open:false }))} className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600">確定</button>}
        </div>
      </div>
    </div>
  );
}

function DevTools({ setS, setMsg }) {
  return (
    <Card title="開發者工具（內部測試）">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <button onClick={() => { setS(p => ({ ...p, stones: (Number(p.stones)||0) + 10000 })); setMsg("測試加值：靈石 +10,000"); }} className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700">+10,000 靈石</button>
        <button onClick={() => { setS(p => ({ ...p, qi: (Number(p.qi)||0) + 100000 })); setMsg("測試加值：靈力 +100,000"); }} className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700">+100,000 靈力</button>
        <button onClick={() => { setS(p => ({ ...p, daoHeart: (Number(p.daoHeart)||0) + 5 })); setMsg("測試加值：道心 +5"); }} className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700">+5 道心</button>
      </div>
      <div className="text-xs text-slate-400 mt-2">（僅本機測試使用，之後會移除）</div>
    </Card>
  );
}
