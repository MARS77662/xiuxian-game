// app/xiuxian/page.jsx
"use client";
import UserInfo from "./UserInfo";                 // 你目錄裡有 app/xiuxian/UserInfo.jsx
import EventCenter from "./components/EventCenter"; // 若是具名匯出就改成：import { EventCenter } from "./components/EventCenter";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";


/* ========= 動態載入修煉系統（關閉 SSR，避免 hydration） ========= */
const AppInner = dynamic(() => import("./AppInner"), { ssr: false });

/* ========= 常量 ========= */
const SAVE_KEY     = "xiuxian-save-v1";     // AppInner 自動存檔
const PROFILE_KEY  = "xiuxian-profile";     // 創角檔
const ENTERED_KEY  = "xiuxian-entered";     // 是否按過「進入修仙世界」
const STORY_KEY    = "xiuxian-story";       // 劇情進度（未完成續看）
const SAVE_EVENT   = "xiuxian:save";

// 入口 / 門派 / 通用背景（請把對應圖片放入 public/bg/）
const BG_DEFAULT = "/bg/bg-clouds.jpg";
const BG_BY_FACTION = {
  "正派": "/bg/sect-righteous.jpg",
  "邪修": "/bg/sect-evil.jpg",
  "散修": "/bg/sect-rogue.jpg",
};

// 門派專屬場景（請準備這 9 張圖放在 public/bg/）
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

/* ========= ② 創角嚮導 ========= */
function Creator({ onDone }) {
  const [step, setStep] = useState(0); // 0:命名 1:門派 2:屬性
  const [name, setName] = useState("蘇子夜");

  const [cfg, setCfg] = useState(null);
  const [type, setType] = useState(null);     // 正派/邪修/散修
  const [sectKey, setSectKey] = useState(null);

  const [attrs, setAttrs] = useState({});
  const sumAttrs = (o)=> Object.values(o).reduce((a,b)=> a+(+b||0), 0);

  useEffect(()=>{
    (async ()=>{
      try{
        const res = await fetch("/data/factions.json", { cache: "no-store" });
        const data = await res.json();
        setCfg(data);

        const types = Object.keys(data.factions || {});
        const t0 = types[0] || "散修";
        const s0 = (data.factions[t0] && data.factions[t0][0]) || null;
        setType(t0);
        setSectKey(s0?.key || null);

        const init = {};
        (data.attributes || ["體質","智力","才貌","家境"]).forEach(k => init[k] = 0);
        setAttrs(init);
      }catch(e){
        console.error(e);
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

  const finish = ()=>{
    const payload = {
      name: (name||"").trim() || "無名散修",
      faction: type,
      sectKey: sect?.key || null,
      sectName: sect?.name || null,
      sectBonuses: sect?.bonuses || {},
      attrs,
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
        <img
          src={ SECT_SCENE_BG[sect?.key] || SECT_SCENE_FALLBACK[type] || BG_BY_FACTION[type] || BG_DEFAULT }
          alt="背景"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center">
          <img src="/logo.png" alt="Logo" className="h-14 mb-2 drop-shadow-lg" onError={(e)=> (e.currentTarget.style.display="none")} />
          <h2 className="text-3xl font-bold">角色建立</h2>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <Stepper step={step} />

        {/* 內容卡 */}
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

              {/* 門派清單 */}
              <div className="grid sm:grid-cols-2 gap-3">
                {sectList.map((s) => {
                  const img =
                    SECT_SCENE_BG[s.key] ||
                    SECT_SCENE_FALLBACK[type] ||
                    BG_BY_FACTION[type] ||
                    BG_DEFAULT;

                  const active =
                    sectKey === s.key
                      ? "border-indigo-400 bg-indigo-500/15 shadow-[0_0_0_2px_rgba(99,102,241,.25)]"
                      : "border-white/10 hover:border-white/30 hover:bg-white/5";

                  return (
                    <button
                      key={s.key}
                      onClick={() => setSectKey(s.key)}
                      className={`text-left rounded-2xl border overflow-hidden transition group ${active}`}
                    >
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

                      <div className="px-4 py-3">
                        <div className="text-slate-400 text-sm">{s.desc}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          起始場景：{s.startScene || "—"}
                        </div>

                        {s.tags && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {s.tags.map((t) => (
                              <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {s.bonuses && Object.keys(s.bonuses).length > 0 && (
                          <div className="mt-2 text-xs text-emerald-300">
                            加成：{Object.entries(s.bonuses).map(([k,v])=> `${k}+${v}`).join("，")}
                          </div>
                        )}

                        {sectKey === s.key && (
                          <div className="text-xs mt-2 text-indigo-300">已選</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

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
            </>
          )}
        </div>

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
      </div>
    </div>
  );
}

/* ========= ③ 主線劇情 ========= */
async function loadStoryJSON(faction){
  const map = {
    "正派": "/data/story/righteous.json",
    "邪修": "/data/story/evil.json",
    "散修": "/data/story/rogue.json",
  };
  const url = map[faction] || map["散修"];
  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok) throw new Error("讀取劇情腳本失敗");
  return res.json();
}

function Story({ profile, onFinish }){
  const faction = profile?.faction || "散修";
  const [script, setScript] = useState(null);
  const [idx, setIdx] = useState(0);
  const [flags, setFlags] = useState({});

  useEffect(() => {
    let mounted = true;
    (async ()=>{
      try{
        const data = await loadStoryJSON(faction);
        if (!mounted) return;
        setScript(data);

        // 續看
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
      onFinish(); // 劇情跑完 → 進門派 Hub
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
      <img src={bg} alt="劇情背景" className="absolute inset-0 w-full h-full object-cover opacity-70" onError={(e)=>{ e.currentTarget.style.display="none"; }} />
      <div className="absolute inset-0 bg-black/55" />

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

/* ========= ④ 狀態 → UserInfo（門派大廳左上角） ========= */
function buildUserInfoState(profile){
  let save = null;
  try { save = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch {}

  const idx = Number(save?.realmIndex ?? 0);

  const REALM_MINI = [
    { key: "lianti",  name: "煉體" },
    { key: "lianqi",  name: "練氣" },
    { key: "zhujii",  name: "築基" },
    { key: "jindan",  name: "金丹" },
    { key: "yuanying",name: "元嬰" },
    { key: "dujie",   name: "渡劫" },
    { key: "zhenxian",name: "真仙" },
    { key: "daluo",   name: "大羅" },
  ];
  const realm = REALM_MINI[Math.max(0, Math.min(idx, REALM_MINI.length - 1))];

  const QI_CAP = [1000, 5000, 30000, 200000, 1000000, 2000000, 10000000, 50000000];
  const XP_CAP = [100, 300, 800, 2000, 6000, 12000, 30000, 90000];
  const qiMax = Number(save?.qiMax) || QI_CAP[Math.max(0, Math.min(idx, QI_CAP.length-1))];
  const xpMax = Number(save?.xpMax) || XP_CAP[Math.max(0, Math.min(idx, XP_CAP.length-1))];

  return {
    nickname: profile?.name || "無名散修",
    sect: profile?.sectName || profile?.faction || "散修",
    realm,
    realmIndex: idx,
    qi:  Number(save?.qi ?? 0),
    qiMax,
    xp:  Number(save?.xp ?? 0),
    xpMax,
    gold: Number(save?.stones ?? 0),        // 靈石
    gem:  Number(save?.gems ?? 0),
    lifeDays: Number(save?.lifeDays ?? save?.lifespan?.leftDays ?? 0),
    avatar: save?.avatar || "/icon-192x192.png",
  };
}

/* ========= ⑤ 門派主場景 Hub ========= */
/* 你專案裡應該已有 <UserInfo /> 與 <EventCenter />，這裡直接呼叫 */
function Hub({ profile, onEnterCultivate }) {
  const faction = profile?.faction || "散修";
  const sectKey = profile?.sectKey;
  const sectName = profile?.sectName || "門派";
  const bg =
    profile?.sectSceneBg ||
    SECT_SCENE_BG[sectKey] ||
    SECT_SCENE_FALLBACK[faction] ||
    BG_BY_FACTION[faction] ||
    BG_DEFAULT;

  const [tab, setTab] = useState("sect"); // sect | quests | explore | demon | market
  const [ui, setUi] = useState(() => buildUserInfoState(profile));

  useEffect(() => {
    setUi(buildUserInfoState(profile));
    const id = setInterval(() => setUi(buildUserInfoState(profile)), 1000);
    return () => clearInterval(id);
  }, [profile]);

  return (
    <div className="min-h-screen relative text-slate-100">
      {/* 背景 */}
      <img
        src={bg}
        alt="門派場景"
        className="absolute inset-0 w-full h-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-black/50" />

      {/* 內容容器：手機不用大 padding，名片在文流內會自己把內容推開 */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6 pt-[200px] md:pt-28">
        {/* 名片：回到文流（不跟著畫面移動） */}
		  <div className="mobile-userinfo">
        <UserInfo state={ui} />
		  </div>

        {/* 頂部欄 */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-10 drop-shadow"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <div className="flex-1">
            <div className="text-xs text-slate-300">
              {faction} · {sectName}
            </div>
            <h2 className="text-2xl font-bold tracking-wide">門派大殿</h2>
          </div>

          {/* 主要功能：閉關修煉（打開 AppInner 覆蓋層） */}
          <button
            onClick={onEnterCultivate}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/30"
          >
            關閉修煉
          </button>
        </div>

        {/* 分頁按鈕 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            ["sect", "門派"],
            ["quests", "任務"],
            ["explore", "探索"],
            ["demon", "斬妖"],
            ["market", "坊市"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 rounded-xl border ${
                tab === key
                  ? "border-indigo-400 bg-indigo-500/15"
                  : "border-white/10 hover:border-white/30 hover:bg-white/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 內容卡片 */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 min-h-[320px]">
          {tab === "sect" && (
            <div className="space-y-3">
              <div className="text-slate-300">
                掌門：「{profile?.name || "小道友"}，修途漫漫，請於門中磨礪心性。」
              </div>
              <div className="text-sm text-slate-400">
                可前往 <b>煉丹房 / 神兵室 / 藏經閣 / 執事堂</b>；或點右上角進入{" "}
                <b>閉關修煉</b> 系統。
              </div>

              {/* 四大房間卡片 */}
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                {[
                  {
                    key: "alchemy",
                    name: "煉丹房",
                    desc: "消耗靈草煉製丹藥，成品可短期增益或交易。",
                    img: "/bg/room-alchemy.jpg",
                  },
                  {
                    key: "forge",
                    name: "神兵室",
                    desc: "鍛造兵器、法器。若成靈，可綁定或上交換賣。",
                    img: "/bg/room-forge.jpg",
                  },
                  {
                    key: "library",
                    name: "藏經閣",
                    desc: "以門派貢獻兌換心法、武學祕笈（限期制度）。",
                    img: "/bg/room-library.jpg",
                  },
                  {
                    key: "hall",
                    name: "執事堂",
                    desc: "接取門派任務，升外門/內門、領取獎勵。",
                    img: "/bg/room-hall.jpg",
                  },
                ].map((r) => (
                  <div
                    key={r.key}
                    className="relative rounded-2xl overflow-hidden group shadow-lg border border-white/10"
                  >
                    <img
                      src={r.img}
                      alt={r.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition" />
                    <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{r.name}</h3>
                        <p className="text-slate-300 text-sm">{r.desc}</p>
                      </div>
                      <button
                        onClick={() => alert(`進入 ${r.name}（尚未實作）`)}
                        className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white self-start"
                      >
                        進入
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "quests" && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">事件中心</h3>
              <EventCenter />
            </div>
          )}

          {tab === "explore" && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">門外探索（雛型）</h3>
              <p className="text-slate-300">
                隨機遭遇：機緣／秘境／奇人／劫匪。之後用事件池實現。
              </p>
            </div>
          )}

          {tab === "demon" && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">斬妖除魔（雛型）</h3>
              <p className="text-slate-300">之後接戰鬥/擲骰，或觸發事件鏈。</p>
            </div>
          )}

          {tab === "market" && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">坊市（雛型）</h3>
              <p className="text-slate-300">
                法器、丹藥、功法將在此購買（可與 AppInner 的資源互通）。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
  

/* ========= ⑥ 頁面組裝：封面 → 創角 → 主線 → 門派Hub →（覆蓋層）修煉系統 ========= */
function XiuxianPage(){
  const [phase, setPhase] = useState(null); // null | 'landing' | 'creator' | 'story' | 'hub'
  const [player, setPlayer] = useState(null);
  const [showCultivate, setShowCultivate] = useState(false); // 覆蓋層：AppInner

  // ✅ 已創角 → 直接進 Hub；未創角 → 封面 → 創角 → 劇情
  useEffect(() => {
    try {
      const profRaw = localStorage.getItem(PROFILE_KEY);
      if (profRaw) {
        setPlayer(JSON.parse(profRaw));
        setPhase("hub");
        return;
      }
      const entered = localStorage.getItem(ENTERED_KEY) === "1";
      setPhase(entered ? "creator" : "landing");
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
          <div className="fixed inset-0 z-50 bg-black overflow-y-auto">
            <div className="sticky top-3 left-3 z-10 p-3">
              <button
                onClick={()=> setShowCultivate(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-white/10"
              >
                ← 返回門派
              </button>
            </div>

            <div className="min-h-[100svh]">
              <AppInner initialPlayer={prof} />
            </div>
          </div>
        )}
      </>
    );
  }

  if (phase === "story") {
    const prof = player || (()=> { try{ return JSON.parse(localStorage.getItem(PROFILE_KEY)||"null"); }catch{return null;} })();
    return (
      <Story
        profile={prof}
        onFinish={()=> setPhase("hub")}
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

export default XiuxianPage;
