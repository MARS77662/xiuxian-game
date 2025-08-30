"use client";

import { useEffect, useState } from "react";
import { readSave, readEventsState } from "../lib/save";
import { getEligible, drawRandom, enqueueEvent, getById, resolveChoice } from "../lib/eventEngine";

export default function EventCenter(){
  const [save, setSave] = useState({});
  const [flags, setFlags] = useState({});
  const [eligible, setEligible] = useState([]);

  // 佇列：ids 與 metas（顯示用的 title / brief）
  const [queueIds, setQueueIds] = useState([]);
  const [queueMeta, setQueueMeta] = useState([]);

  const [active, setActive] = useState(null); // 彈窗事件
  const [msg, setMsg] = useState("");

  const reload = async ()=>{
    const s = readSave();
    const es = readEventsState();
    const ids = es.queue || [];

    setSave(s);
    setFlags(es.flags || {});
    setQueueIds(ids);
    setEligible(await getEligible(s, es.flags || {}));

    // 依 ID 取事件標題/摘要，讓列表好看
    const metas = [];
    for (const id of ids) {
      const ev = await getById(id);
      if (ev) metas.push({ id, title: ev.title, brief: ev.brief });
      else metas.push({ id, title: `未知事件`, brief: id });
    }
    setQueueMeta(metas);
  };

  useEffect(()=>{ reload(); }, []);

  const addRandom = async ()=>{
    const s = readSave();
    const es = readEventsState();
    const ev = await drawRandom(s, es.flags || {});
    if (!ev) { setMsg("目前沒有可觸發的事件"); return; }
    enqueueEvent(ev.id);
    setMsg(`已加入事件：${ev.title}`);
    reload();
  };

  const openFromQueue = async (id)=> {
    const ev = await getById(id);
    if (ev) setActive(ev);
  };

  const runChoice = async (key)=> {
    const r = resolveChoice(active, key);
    setMsg(r.message || "");
    setActive(null);
    reload();
  };

  return (
    <div className="space-y-5">
      {msg && (
        <div className="rounded-xl border border-white/10 bg-emerald-900/20 text-emerald-200 px-3 py-2">{msg}</div>
      )}

      {/* 可觸發事件（預覽） */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">可觸發事件（預覽）</h3>
          <button onClick={addRandom} className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500">抽一個隨機事件</button>
        </div>
        {eligible.length === 0 ? (
          <div className="text-slate-400 text-sm">暫無符合條件的事件。</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {eligible.slice(0,6).map(e=> (
              <div key={e.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="font-semibold">{e.title}</div>
                <div className="text-xs text-slate-400 mt-1">{e.brief}</div>
                <div className="mt-2 text-xs opacity-70">權重：{e.weight ?? 1}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 事件佇列（美化顯示） */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">我的事件佇列</h3>
        </div>
        {queueIds.length === 0 ? (
          <div className="text-slate-400 text-sm">目前沒有佇列中的事件，抽一個試試吧。</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {queueMeta.map(m => (
              <button
                key={m.id}
                onClick={()=> openFromQueue(m.id)}
                className="text-left rounded-xl border border-white/10 bg-white/5 p-3 hover:border-white/30"
              >
                <div className="font-semibold">{m.title}</div>
                {m.brief && <div className="text-xs text-slate-400 mt-1">{m.brief}</div>}
                <div className="text-[11px] opacity-60 mt-1">事件ID：{m.id}</div>
                <div className="text-[11px] opacity-60">點擊進入處理</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 事件彈窗 */}
      {active && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 text-slate-100 p-5">
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold">{active.title}</div>
              <button onClick={()=> setActive(null)} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700">關閉</button>
            </div>
            <div className="mt-2 text-slate-300 whitespace-pre-line">{active.body}</div>

            <div className="mt-4 grid gap-2">
              {(active.choices || []).map(ch => {
                const disabled = !!ch.requires && !(
                  (()=> {
                    const s = readSave();
                    const es = readEventsState();
                    const req = ch.requires || {};
                    if (typeof req.minGold === "number" && Number(s?.gold || 0) < req.minGold) return false;
                    if (Array.isArray(req.requiredFlags) && req.requiredFlags.some(f => !es.flags?.[f])) return false;
                    if (Array.isArray(req.absentFlags) && req.absentFlags.some(f => !!es.flags?.[f])) return false;
                    return true;
                  })()
                );

                return (
                  <button
                    key={ch.key}
                    disabled={disabled}
                    onClick={()=> runChoice(ch.key)}
                    className={`text-left rounded-xl border p-3 ${disabled ? "border-white/10 bg-slate-800 text-slate-500 cursor-not-allowed" : "border-indigo-400/50 bg-indigo-500/10 hover:bg-indigo-500/20"}`}
                  >
                    <div className="font-medium">{ch.text}</div>
                    {ch.hint && <div className="text-xs opacity-80 mt-1">{ch.hint}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
