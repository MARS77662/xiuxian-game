"use client";
import { useMemo, useState } from "react";
import AppInner from "./AppInner";

const FACTIONS = [
  { key: "正派",  title: "正派",  desc: "行俠仗義、根基穩固、資源豐厚",  tag: "穩健" },
  { key: "邪修",  title: "邪修",  desc: "取徑偏鋒、進展迅猛、風險亦高",  tag: "爆發" },
  { key: "散修",  title: "散修",  desc: "自由逍遙、悟性通達、機緣天成",  tag: "均衡" },
];

const RANDOM_NAMES = ["蘇子夜","白無塵","北冥秋","南宮霜","顧長歌","雲清","洛玄一","陸沉舟"];

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function FactionCard({ active, title, desc, tag, onClick }){
  return (
    <button
      onClick={onClick}
      className={`group relative rounded-2xl px-4 py-3 text-left border transition
        ${active ? "border-indigo-400 bg-indigo-500/15 shadow-[0_0_0_2px_rgba(99,102,241,.25)]"
                 : "border-white/10 hover:border-white/30 hover:bg-white/5"}`}
    >
      <div className="text-sm text-slate-300">{tag}</div>
      <div className="text-xl font-semibold">{title}</div>
      <div className="text-slate-400 text-sm mt-1">{desc}</div>
      {active && <div className="absolute right-3 top-3 text-xs px-2 py-0.5 rounded bg-indigo-600/60">已選</div>}
    </button>
  );
}

function NumberRow({ label, value, onChange }){
  return (
    <div className="grid grid-cols-[84px_1fr_auto] items-center gap-3">
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

function CharacterCreate({ onStart }){
  const [name, setName] = useState("蘇子夜");
  const [faction, setFaction] = useState("正派");
  const [attrs, setAttrs] = useState({ 體質: 5, 智力: 5, 才貌: 5, 家境: 5 });
  const total = attrs.體質 + attrs.智力 + attrs.才貌 + attrs.家境;
  const cap   = 28; // 總點數上限
  const left  = cap - total;

  const setA = (k, v) => {
    // 先暫設，再依剩餘點數限制
    const next = { ...attrs, [k]: clamp(v, 0, 20) };
    const sum  = next.體質 + next.智力 + next.才貌 + next.家境;
    if (sum <= cap) { setAttrs(next); return; }

    // 超過上限就回推
    const over = sum - cap;
    next[k] = clamp(next[k] - over, 0, 20);
    setAttrs(next);
  };

  const randomName = () => setName(RANDOM_NAMES[Math.floor(Math.random()*RANDOM_NAMES.length)]);

  const start = () => {
    onStart({ name: name.trim() || "無名散修", faction, attrs });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold">創建角色</h1>

        {/* 基本資料 */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-400 mb-1">道號</div>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e)=> setName(e.target.value)}
                placeholder="取個道號…"
                className="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 outline-none"
              />
              <button onClick={randomName} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700">隨機</button>
            </div>

            <div className="mt-5 text-sm text-slate-400 mb-2">選擇陣營</div>
            <div className="grid sm:grid-cols-3 gap-3">
              {FACTIONS.map(f=> (
                <FactionCard
                  key={f.key}
                  active={faction===f.key}
                  title={f.title}
                  desc={f.desc}
                  tag={f.tag}
                  onClick={()=> setFaction(f.key)}
                />
              ))}
            </div>
          </div>

          {/* 屬性分配 */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between mb-3">
