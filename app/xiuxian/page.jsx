"use client";

import { useEffect, useMemo, useState } from "react";
import AppInner from "./AppInner";
import UserInfo from "./components/UserInfo";

/* ========= 常量 ========= */
const SAVE_KEY = "xiuxian-save-v1";     // AppInner 自動存檔
const PROFILE_KEY = "xiuxian-profile";  // 創角檔
const ENTERED_KEY = "xiuxian-entered";  // 是否按過「進入修仙世界」
const STORY_KEY = "xiuxian-story";      // 劇情進度（未完成續看）

// 入口 / 門派 / 通用背景（請把對應圖片放入 public/bg/）
const BG_DEFAULT = "/bg/bg-clouds.jpg";
const BG_BY_FACTION = {
  "正派": "/bg/sect-righteous.jpg",
  "邪修": "/bg/sect-evil.jpg",
  "散修": "/bg/sect-rogue.jpg",
};

// 門派專屬場景（你要準備這 9 張圖放在 public/bg/）
const SECT_SCENE_BG = {
  // 正派
  tianjian: "/bg/scene-tianjian.jpg",
  danyang:  "/bg/scene-danyang.jpg",
  fulu:     "/bg/scene-fulu.jpg",
  // 邪修
  xuesha:   "/bg/scene-xuesha.jpg",
  moxin:    "/bg/scene-moxin.jpg",
  youming:  "/bg/scene-youming.jpg",
  // 散修
  shanxiu:  "/bg/scene-shanxiu.jpg",
  youxia:   "/bg/scene-youxia.jpg",
  shusheng: "/bg/scene-shusheng.jpg",
};

// 若沒準備到 sect 專圖，使用這些派系級 fallback
const SECT_SCENE_FALLBACK = {
  "正派": "/bg/sect-righteous.jpg",
  "邪修": "/bg/sect-evil.jpg",
  "散修": "/bg/sect-rogue.jpg",
};

// 隨機名
const RANDOM_NAMES = ["蘇子夜","白無塵","北冥秋","南宮霜","顧長歌","雲清","洛玄一","陸沉舟"];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/* ========= 小元件 ========= */
function Stepper({ step }){
  const items = ["命名", "選門派", "屬性點數"];
  return (
    <ol className="flex items-center gap-3 text-sm mb-6">
      {items.map((t,i)=> (
        <li key={t} className={`px-3 py-1 rounded-full border ${i===step? "border-indigo-400 bg-indigo-500/10":"border-white/10 text-slate-400"}`}>
          {i+1}. {t}
        </li>
      ))}
    </ol>
  );
}

/* ========= ① 開場頁（登入/封面） ========= */
function Landing({ onEnter }){
  return (
    <div className="min-h-screen relative text-slate-100">
      <img src={BG_DEFAULT} alt="背景" className="absolute inset-0 w-full h-full object-cover opacity-70" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 h-screen flex flex-col items-center justify-center px-6">
        <img src="/logo.png" alt="Logo" className="h-20 mb-4 drop-shadow-[0_6px_30px_rgba(0,0,0,.6)]" onError={(e)=> (e.currentTarget.style.display="none")} />
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide">修仙 · 啟程</h1>
        <p className="mt-3 text-slate-300">吐納養氣，斬妖除魔，步步登天。</p>
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

/* ========= ② 創角嚮導（讀 /data/factions.json） ========= */
function Creator({ onDone }){
  const [step, setStep] = useState(0); // 0:命名 1:門派 2:屬性
  const [name, setName] = useState("蘇子夜");

  // 讀取 factions.json
  const [cfg, setCfg] = useState(null);
  const [type, setType] = useState(null);     // 正派/邪修/散修
  const [sectKey, setSectKey] = useState(null);

  // 屬性（動態依照 JSON 的 attributes 清單）
  const [attrs, setAttrs] = useState({});
  const sumAttrs = (o)=> Object.values(o).reduce((a,b)=> a+(+b||0), 0);

  useEffect(()=>{
    (async ()=>{
      try{
        const res = await fetch("/data/factions.json", { cache: "no-store" });
        const data = await res.json();
        setCfg(data);

        // 預設選第一個類型與第一個門派
        const types = Object.keys(data.factions || {});
        const t0 = types[0] || "散修";
        const s0 = (data.factions[t0] && data.factions[t0][0]) || null;
        setType(t0);
        setSectKey(s0?.key || null);

        // 初始化屬性
        const init = {};
        (data.attributes || ["體質","智力","才貌","家境"]).forEach(k => init[k] = 0);
        setAttrs(init);
      }catch(e){
        console.error(e);
        // 簡單 fallback
        setCfg({ attributes:["體質","智力","才貌","家境"], startPoints:16, factions:{ "散修":[{key:"shanxiu",name:"山野苦修者",desc:"",bonuses:{}} ] } });
        setType("散修"); setSectKey("shanxiu");
        setAttrs({ 體質:0, 智力:0, 才貌:0, 家境:0 });
      }
    })();
  },[]);

  if(!cfg || !type){
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        載入門派資料中…
      </div>
    );
  }

  const types = Object.keys(cfg.factions || {});
  const sectList = (cfg.factions[type] || []);
  const sect = sectList.find(s=> s.key === sectKey) || sectList[0];
  const CAP = cfg.startPoints ?? 16;
  const left = CAP - sumAttrs(attrs);

  const setA = (k, v)=>{
    v = Math.max(0, Math.min(20, +v||0));
    const next = { ...attrs, [k]: v };
    if (sumAttrs(next) <= CAP) setAttrs(next);
  };

  const finish = ()=>{
    // 把門派資訊和「門派加成表」一併存入 profile，Hub/AppInner 都能直接用
    const payload = {
      name: (name||"").trim() || "無名散修",
      faction: type,
      sectKey: sect?.key || null,
      sectName: sect?.name || null,
      sectBonuses: sect?.bonuses || {},
      attrs,
      // 門派場景背景（含 fallback）
      sectSceneBg: SECT_SCENE_BG[sect?.key] || SECT_SCENE_FALLBACK[type] || BG_BY_FACTION[type] || BG_DEFAULT,
      applyBonusAfter: cfg?.rules?.applyBonusAfterAllocate === true
    };
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(payload)); } catch {}
    onDone(payload);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      {/* 頂部 Banner */}
      <div className="relative h-48 w-full overflow-hidden">
        <img src={( { "正派": "/bg/sect-righteous.jpg", "邪修": "/bg/sect-evil.jpg", "散修": "/bg/sect-rogue.jpg" }[type] ) || "/bg/bg-clouds.jpg"} alt="背景" className="absolute inset-0 w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center">
          <img src="/logo.png" alt="Logo" className="h-14 mb-2 drop-shadow-lg" onError={(e)=> (e.currentTarget.style.display="none")} />
          <h2 className="text-3xl font-bold">角色建立</h2>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <Stepper step={step} />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-5">
          {step===0 && (
            <>
              <div className="text-slate-300">請為你的角色取一個道號：</div>
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={(e)=> setName(e.target.value)}
                  placeholder="取個道號…"
                  className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 outline-none"
                />
                <button
                  onClick={()=> setName(RANDOM_NAMES[Math.floor(Math.random()*RANDOM_NAMES.length)])}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
                >
                  隨機
                </button>
              </div>
            </>
          )}

          {step===1 && (
            <>
              <div className="text-slate-300 mb-2">選擇門派：</div>

              {/* 類型 Tab */}
              <div className="flex gap-2 mb-3">
                {types.map(t => (
                  <button
                    key={t}
                    onClick={()=> { setType(t); const first = (cfg.factions[t]||[])[0]; setSectKey(first?.key||null); }}
                    className={`px-3 py-1.5 rounded-xl border ${t===type? "border-indigo-400 bg-indigo-500/15":"border-white/10 hover:border-white/30 hover:bg-white/5"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* 門派清單（含門派圖片） */}
		<div className="grid sm:grid-cols-2 gap-3">
		  {sectList.map(s=> {
			const img =
			  SECT_SCENE_BG[s.key] ||
			  SECT_SCENE_FALLBACK[type] ||
			  BG_BY_FACTION[type] ||
			  BG_DEFAULT;

			return (
			  <button
				key={s.key}
				onClick={()=> setSectKey(s.key)}
				className={`text-left rounded-2xl border overflow-hidden transition group
				${sectKey===s.key
				  ? "border-indigo-400 bg-indigo-500/15 shadow-[0_0_0_2px_rgba(99,102,241,.25)]"
				  : "border-white/10 hover:border-white/30 hover:bg-white/5"}`}
			  >
				{/* 門派圖 */}
				<div className="relative h-36 w-full overflow-hidden">
				  <img
					src={img}
					alt={s.name}
					className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
					onError={(e)=>{ e.currentTarget.style.display="none"; }}
				  />
				  <div className="absolute inset-0 bg-black/30" />
				  <div className="absolute bottom-2 left-3 right-3 text-lg font-semibold drop-shadow">
					{s.name}
				  </div>
				</div>

				{/* 文字內容 */}
				<div className="px-4 py-3">
				  <div className="text-slate-400 text-sm">{s.desc}</div>
				  <div className="text-xs text-slate-400 mt-1">起始場景：{s.startScene || "—"}</div>
				  {s.tags && (
					<div className="mt-2 flex flex-wrap gap-1">
					  {s.tags.map(t=>(
						<span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10">{t}</span>
					  ))}
					</div>
				  )}
				  {s.bonuses && Object.keys(s.bonuses).length>0 && (
					<div className="mt-2 text-xs text-emerald-300">
					  加成：{Object.entries(s.bonuses).map(([k,v])=> `${k}+${v}`).join("，")}
					</div>
				  )}
				  {sectKey===s.key && <div className="text-xs mt-2 text-indigo-300">已選</div>}
				</div>
			  </button>
			);
		  })}
		</div>


          {step===2 && (
            <>
              <div className="flex items-center justify-between">
                <div className="text-slate-300">分配屬性（總點數上限 {CAP}）</div>
                <div className={`text-xs px-2 py-0.5 rounded ${left>=0? "bg-emerald-700/40 text-emerald-200":"bg-rose-700/40 text-rose-200"}`}>
                  剩餘：{left}
                </div>
              </div>

              <div className="space-y-3">
                {(cfg.attributes || ["體質","智力","才貌","家境"]).map((k)=> (
                  <div key={k} className="grid grid-cols-[72px_1fr_auto] items-center gap-3">
                    <div className="text-slate-200">{k}</div>
                    <input
                      type="range" min={0} max={20} value={attrs[k]||0}
                      onChange={(e)=> {
                        const v = +e.target.value;
                        const next = { ...attrs, [k]: v };
                        if (Object.values(next).reduce((a,b)=>a+(+b||0),0) <= CAP) setAttrs(next);
                      }}
                      className="w-full accent-indigo-500"
                    />
                    <div className="w-10 text-right tabular-nums">{attrs[k]||0}</div>
                  </div>
                ))}
              </div>

              <div className="text-xs text-slate-400">
                * {cfg?.rules?.desc || "屬性將影響修煉、自動產出、事件與突破率"}（門派加成於分配後套用）
              </div>
          )

        {/* 導覽 */}
        <div className="mt-6 flex justify-between">
          <button
            disabled={step===0}
            onClick={()=> setStep(s=> Math.max(0, s-1))}
            className={`px-4 py-2 rounded-xl ${step===0? "bg-slate-700 cursor-not-allowed":"bg-slate-800 hover:bg-slate-700"}`}
          >
            上一步
          </button>

          {step<2 ? (
            <button
              onClick={()=> setStep(s=> Math.min(2, s+1))}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/30"
            >
              下一步
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={left!==0}
              className={`px-5 py-2.5 rounded-xl ${left===0? "bg-emerald-600 hover:bg-emerald-500":"bg-slate-700 cursor-not-allowed"}`}
              title={left===0? "":"請把點數分配完畢"}
            >
              完成創角 → 進入門派
            </button>
          )}
        </div>
  );
}

/* ========= ③ 主線劇情（依門派分支，從 JSON 載入） ========= */
async function loadStoryJSON(faction){
  const map = {
    "正派": "/data/story/righteous.json",
    "邪修": "/data/story/evil.json",
    "散修": "/data/story/rogue.json",
  };
  const url = map[faction] || map["散修"];
  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok) throw new Error("讀取劇情腳本失敗");
  return res.json(); // { meta, scenes: [ {bg,text[],choices?} ] }
}

function Story({ profile, onFinish }){
  const faction = profile?.faction || "散修";
  const [script, setScript] = useState(null); // { meta, scenes }
  const [idx, setIdx] = useState(0);
  const [flags, setFlags] = useState({});

  // 載入 JSON + 續看
  useEffect(() => {
    let mounted = true;
    (async ()=>{
      try{
        const data = await loadStoryJSON(faction);
        if (!mounted) return;
        setScript(data);

        // 續看進度
        try{
          const raw = localStorage.getItem(STORY_KEY);
          if (raw) {
            const saved = JSON.parse(raw);
            if (saved?.faction === faction && Number.isInteger(saved.idx)) {
              setIdx(saved.idx);
              setFlags(saved.flags || {});
            }
          }
        }catch{}
      }catch(e){
        console.error(e);
        // Fallback：若讀檔失敗，給一個簡短替代
        setScript({
          meta: { title: "主線·序章", version: "fallback" },
          scenes: [
            { bg: BG_BY_FACTION[faction] || BG_DEFAULT, text: ["（無法載入劇本，使用預設序章）", "你立於山門之前，風起雲湧。"] },
            { bg: BG_DEFAULT, text: ["前路漫漫，你決意踏入修行之途。"] }
          ]
        });
      }
    })();
    return ()=> { mounted = false; };
  }, [faction]);

  if (!script) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        劇情載入中…
      </div>
    );
  }

  const scenes = script.scenes || [];
  const node = scenes[idx] || scenes[scenes.length-1] || {};
  const bg = node.bg || BG_BY_FACTION[faction] || BG_DEFAULT;

  const saveProgress = (nextIdx, nextFlags=flags)=>{
    try { localStorage.setItem(STORY_KEY, JSON.stringify({ faction, idx: nextIdx, flags: nextFlags })); } catch {}
  };

  const next = ()=>{
    const nextIdx = idx + 1;
    if (nextIdx >= scenes.length) {
      try { localStorage.removeItem(STORY_KEY); } catch {}
      try { localStorage.setItem("xiuxian-story-flags", JSON.stringify({ faction, ...flags })); } catch {}
      onFinish(); // ← 劇情跑完 → 進門派 Hub（不是直接進打坐）
      return;
    }
    setIdx(nextIdx);
    saveProgress(nextIdx);
  };

  const choose = (c)=>{
    const nf = { ...flags, ...(c.flag || {}) };
    setFlags(nf);
    const nextIdx = idx + 1;
    setIdx(nextIdx);
    saveProgress(nextIdx, nf);
  };

  return (
    <div className="min-h-screen relative text-slate-100">
      {/* 背景 */}
      <img src={bg} alt="劇情背景" className="absolute inset-0 w-full h-full object-cover opacity-70" onError={(e)=>{ e.currentTarget.style.display="none"; }} />
      <div className="absolute inset-0 bg-black/55" />

      {/* 內容 */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        <header className="flex items-center gap-3 mb-4">
          <img src="/logo.png" alt="Logo" className="h-10 drop-shadow" onError={(e)=> (e.currentTarget.style.display="none")} />
          <div>
            <h2 className="text-2xl font-bold">{script.meta?.title || `主線 · 序章（${faction}）`}</h2>
            <div className="text-slate-300 text-sm">道號：{profile?.name || "無名散修"}</div>
          </div>
        </header>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="space-y-3 leading-relaxed">
            {(node.text || []).map((line, i)=> (
              <p key={i} className="text-slate-200">{line}</p>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 justify-end">
            {Array.isArray(node.choices) && node.choices.length > 0 ? (
              node.choices.map((c, i)=> (
                <button key={i} onClick={()=> choose(c)} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500">
                  {c.text}
                </button>
              ))
            ) : (
              <button onClick={next} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500">
                繼續
              </button>
            )}
          </div>

          <div className="mt-3 text-right">
            <button
              onClick={()=> { try{ localStorage.removeItem(STORY_KEY); }catch{} onFinish(); }}
              className="text-xs text-slate-400 hover:text-slate-200 underline"
            >
              跳過序章，前往門派
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========= ④ 門派主場景 Hub ========= */
function Hub({ profile, onEnterCultivate }){
  const faction = profile?.faction || "散修";
  const sectKey = profile?.sectKey;
  const sectName = profile?.sectName || "門派";
  const bg = profile?.sectSceneBg || SECT_SCENE_BG[sectKey] || SECT_SCENE_FALLBACK[faction] || BG_BY_FACTION[faction] || BG_DEFAULT;

  const [tab, setTab] = useState("sect"); // sect | quests | explore | demon | market
    const [ui, setUi] = useState(() => buildUserInfoState(profile));

// 每秒刷新一次，讓修煉時（AppInner 更新）左上角數值會即時跟到
useEffect(() => {
  setUi(buildUserInfoState(profile));
  const id = setInterval(() => setUi(buildUserInfoState(profile)), 1000);
  return () => clearInterval(id);
}, [profile]);


  return (
    <div className="min-h-screen relative text-slate-100">
      {/* 背景 */}
      <img src={bg} alt="門派場景" className="absolute inset-0 w-full h-full object-cover opacity-70" />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        {/* 頂部欄 */}
        <div className="flex items-center gap-3 mb-4">
          <img src="/logo.png" alt="Logo" className="h-10 drop-shadow" onError={(e)=> (e.currentTarget.style.display="none")} />
          <div className="flex-1">
            <div className="text-xs text-slate-300">{faction} · {sectName}</div>
            <h2 className="text-2xl font-bold tracking-wide">門派大殿</h2>
          </div>

          {/* 主要功能：閉關修煉（打開 AppInner 覆蓋層） */}
          <button
            onClick={onEnterCultivate}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/30"
          >
            閉關修煉
          </button>
        </div>

        {/* 導覽按鈕 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            ["sect","門派"],
            ["quests","任務"],
            ["explore","探索"],
            ["demon","斬妖"],
            ["market","坊市"]
          ].map(([key,label])=> (
            <button
              key={key}
              onClick={()=> setTab(key)}
              className={`px-3 py-1.5 rounded-xl border ${tab===key? "border-indigo-400 bg-indigo-500/15":"border-white/10 hover:border-white/30 hover:bg-white/5"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 內容卡片 */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 min-h-[320px]">
          {tab==="sect" && (
            <div className="space-y-3">
              <div className="text-slate-300">掌門：「{profile?.name || "小道友"}，修途漫漫，請於門中磨礪心性。」</div>
              <div className="text-sm text-slate-400">可從上方切換至 <b>任務 / 探索 / 斬妖 / 坊市</b>；或點右上角進入 <b>閉關修煉</b> 系統。</div>
            </div>
          )}
          {tab==="quests" && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">門派任務（雛型）</h3>
              <p className="text-slate-300">之後會接入事件模組，顯示可接任務清單與章節。</p>
              <ul className="list-disc pl-5 text-slate-300 text-sm">
                <li>外門巡山 · 清剿山匪（推介境界：煉氣）</li>
                <li>護送道童 · 藥谷採靈芝（推介境界：築基）</li>
              </ul>
            </div>
          )}
          {tab==="explore" && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">門外探索（雛型）</h3>
              <p className="text-slate-300">隨機遭遇：機緣／秘境／奇人／劫匪。之後用事件池實現。</p>
            </div>
          )}
          {tab==="demon" && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">斬妖除魔（雛型）</h3>
              <p className="text-slate-300">之後接戰鬥/擲骰，或觸發事件鏈。</p>
            </div>
          )}
          {tab==="market" && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">坊市（雛型）</h3>
              <p className="text-slate-300">法器、丹藥、功法將在此購買（可與 AppInner 的資源互通）。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========= ⑤ 頁面組裝：封面 → 創角 → 主線 → 門派Hub →（覆蓋層）修煉系統 ========= */
export default function XiuxianPage(){
  const [phase, setPhase] = useState(null); // null | 'landing' | 'creator' | 'story' | 'hub'
  const [player, setPlayer] = useState(null);
  const [showCultivate, setShowCultivate] = useState(false); // 覆蓋層：AppInner

  // 首次決定進入哪一階段
  useEffect(() => {
    try {
      // 有遊戲存檔也改為進「門派 Hub」，修煉系統改成從 Hub 進入
      const save = localStorage.getItem(SAVE_KEY);
      const profRaw = localStorage.getItem(PROFILE_KEY);
      if (profRaw) {
        setPlayer(JSON.parse(profRaw));
      }
      setPhase(save || profRaw ? "hub" : (localStorage.getItem(ENTERED_KEY)==="1" ? "creator" : "landing"));
    } catch {
      setPhase("landing");
    }
  }, []);

  if (phase === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        載入中…
      </div>
    );
  }

  if (phase === "hub") {
    const prof = player || (()=> { try{ return JSON.parse(localStorage.getItem(PROFILE_KEY)||"null"); }catch{return null;} })();
    return (
      <>
        <Hub
          profile={prof}
          onEnterCultivate={()=> setShowCultivate(true)}
        />

        {/* 修煉系統覆蓋層（AppInner 全螢幕） */}
        {showCultivate && (
          <div className="fixed inset-0 z-50 bg-black">
            <div className="absolute top-3 left-3">
              <button
                onClick={()=> setShowCultivate(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-white/10"
              >
                ← 返回門派
              </button>
            </div>
            <AppInner initialPlayer={prof} />
          </div>
        )}
      </>
    );
  }
	function buildUserInfoState(profile){
	  // 讀你遊戲的自動存檔
	  let save = null;
	  try { save = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch {}

	  // 由創角檔與存檔組合出顯示狀態（缺的用預設）
	  const realm = save?.realm || { key: "lianqi", name: "練氣三層" };
	  return {
		nickname: profile?.name || "無名散修",
		sect: profile?.sectName || profile?.faction || "散修",
		realm,
		qi:  Number(save?.qi ?? 230),
		qiMax: Number(save?.qiMax ?? 500),
		xp:  Number(save?.xp ?? 120),
		xpMax: Number(save?.xpMax ?? 300),
		gold: Number(save?.gold ?? 1200),
		gem:  Number(save?.gem ?? 50),
		lifeDays: Number(save?.lifeDays ?? 365),
		avatar: save?.avatar || "/icon-192x192.png",
	  };
	}

  if (phase === "story") {
    const prof = player || (()=> { try{ return JSON.parse(localStorage.getItem(PROFILE_KEY)||"null"); }catch{return null;} })();
    return (
      <Story
        profile={prof}
        onFinish={()=> setPhase("hub")} // 劇情完 → 門派 Hub（不是直接進打坐）
      />
    );
  }

  if (phase === "creator") {
    return (
      <Creator
        onDone={(payload)=> {
          try { localStorage.setItem(PROFILE_KEY, JSON.stringify(payload)); } catch {}
          setPlayer(payload);
          setPhase("story"); // 創角完成 → 進入主線
        }}
      />
    );
  }

  // landing
  return (
    <Landing
      onEnter={() => {
        try { localStorage.setItem(ENTERED_KEY, "1"); } catch {}
        setPhase("creator");
      }}
    />
  );
}
