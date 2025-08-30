"use client";
import { useEffect, useState } from "react";
import AppInner from "./AppInner";

/* ========= 常量 ========= */
const SAVE_KEY = "xiuxian-save-v1";     // AppInner 自動存檔
const PROFILE_KEY = "xiuxian-profile";  // 創角檔
const ENTERED_KEY = "xiuxian-entered";  // 是否按過「進入修仙世界」
const STORY_KEY = "xiuxian-story";      // 劇情進度（未完成續看）
const CAP = 28;                          // 屬性總點上限

// 入口 / 門派 / 通用背景（請把對應圖片放入 public/bg/）
const BG_DEFAULT = "/bg/bg-clouds.jpg";
const BG_BY_FACTION = {
  "正派": "/bg/sect-righteous.jpg",
  "邪修": "/bg/sect-evil.jpg",
  "散修": "/bg/sect-rogue.jpg",
};

// 門派（創角用）
const FACTIONS = [
  { type: "正派", key: "righteous", title: "正派", desc: "根基穩固、資源豐厚，穩健發展" },
  { type: "邪修", key: "evil",      title: "邪修", desc: "偏鋒爆發、進境迅猛，但風險亦高" },
  { type: "散修", key: "rogue",     title: "散修", desc: "自由逍遙、悟性通達、均衡成長" },
];

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
function FactionCard({ active, title, desc, onClick }){
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl px-4 py-3 border transition
      ${active ? "border-indigo-400 bg-indigo-500/15 shadow-[0_0_0_2px_rgba(99,102,241,.25)]"
               : "border-white/10 hover:border-white/30 hover:bg-white/5"}`}
    >
      <div className="text-xl font-semibold">{title}</div>
      <div className="text-slate-400 text-sm mt-1">{desc}</div>
      {active && <div className="text-xs mt-2 text-indigo-300">已選</div>}
    </button>
  );
}
function NumberRow({ label, value, onChange }){
  return (
    <div className="grid grid-cols-[72px_1fr_auto] items-center gap-3">
      <div className="text-slate-200">{label}</div>
      <input
        type="range"
        min={0}
        max={20}
        value={value}
        onChange={(e)=> onChange(+e.target.value)}
        className="w-full accent-indigo-500"
      />
      <div className="w-10 text-right tabular-nums">{value}</div>
    </div>
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
function Creator({ onDone }){
  const [step, setStep] = useState(0); // 0:命名 1:門派 2:屬性
  const [name, setName] = useState("蘇子夜");
  const [faction, setFaction] = useState("正派");
  const [attrs, setAttrs] = useState({ 體質:5, 智力:5, 才貌:5, 家境:5 });

  const total = attrs.體質 + attrs.智力 + attrs.才貌 + attrs.家境;
  const left  = CAP - total;

  const setA = (k,v)=>{
    const next = { ...attrs, [k]: clamp(v, 0, 20) };
    const sum  = next.體質 + next.智力 + next.才貌 + next.家境;
    if (sum <= CAP) setAttrs(next);
  };

  const finish = ()=>{
    const payload = { name: (name||"").trim() || "無名散修", faction, attrs };
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(payload)); } catch {}
    onDone(payload);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      {/* 頂部 Banner */}
      <div className="relative h-48 w-full overflow-hidden">
        <img src={BG_BY_FACTION[faction] || BG_DEFAULT} alt="背景" className="absolute inset-0 w-full h-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center">
          <img src="/logo.png" alt="Logo" className="h-14 mb-2 drop-shadow-lg" onError={(e)=> (e.currentTarget.style.display="none")} />
          <h2 className="text-3xl font-bold">角色建立</h2>
        </div>
      </div>

      {/* 內容 */}
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
              <div className="grid sm:grid-cols-3 gap-3">
                {FACTIONS.map(f=> (
                  <FactionCard
                    key={f.key}
                    active={faction===f.type}
                    title={f.title}
                    desc={f.desc}
                    onClick={()=> setFaction(f.type)}
                  />
                ))}
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
                <NumberRow label="體質" value={attrs.體質} onChange={(v)=> setA("體質", v)} />
                <NumberRow label="智力" value={attrs.智力} onChange={(v)=> setA("智力", v)} />
                <NumberRow label="才貌" value={attrs.才貌} onChange={(v)=> setA("才貌", v)} />
                <NumberRow label="家境" value={attrs.家境} onChange={(v)=> setA("家境", v)} />
              </div>

              <div className="text-xs text-slate-400">* 屬性將影響修煉、自動產出、事件與突破率</div>
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
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow-lg"
            >
              完成創角 → 進入主線
            </button>
          )}
        </div>
      </div>
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
      onFinish();
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
              跳過序章，直接修煉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========= ④ 頁面組裝：持久化流程（封面 → 創角 → 主線 → 遊戲） ========= */
export default function XiuxianPage(){
  const [phase, setPhase] = useState(null); // null | 'landing' | 'creator' | 'story' | 'game'
  const [player, setPlayer] = useState(null);

  // 首次決定進入哪一階段
  useEffect(() => {
    try {
      // 有遊戲存檔 → 直接進遊戲
      const save = localStorage.getItem(SAVE_KEY);
      if (save) { setPhase("game"); return; }

      // 有創角資料 → 進主線
      const profileRaw = localStorage.getItem(PROFILE_KEY);
      if (profileRaw) {
        const p = JSON.parse(profileRaw);
        setPlayer(p);
        setPhase("story");
        return;
      }

      // 只有按過「進入修仙世界」→ 進創角
      const entered = localStorage.getItem(ENTERED_KEY);
      setPhase(entered === "1" ? "creator" : "landing");
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

  if (phase === "game") return <AppInner initialPlayer={player} />;

  if (phase === "story") {
    const prof = player || (()=> { try{ return JSON.parse(localStorage.getItem(PROFILE_KEY)||"null"); }catch{return null;} })();
    return (
      <Story
        profile={prof}
        onFinish={()=> setPhase("game")}
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
