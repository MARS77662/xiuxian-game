"use client";
import Link from "next/link";

export default function SectPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 text-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">門派 · 外門</h1>
        <Link href="/xiuxian" className="text-sm px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700">返回修煉</Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="煉丹房" desc="消耗壽元煉製丹藥，成品可短期增益或交易。"/>
        <Card title="神兵室" desc="鑄造兵器、法器。若成靈，可綁定或上交換貢。"/>
        <Card title="藏經閣" desc="以門派貢獻兌換心法、武學祕笈（門規限制）。"/>
        <Card title="執事堂" desc="接取門派任務、升外門/內門、領貢。"/>
      </div>
    </div>
  );
}

function Card({ title, desc }) {
  return (
    <div className="rounded-xl p-4 bg-white/5 border border-white/10">
      <div className="text-lg font-medium">{title}</div>
      <div className="text-sm text-slate-400 mt-1">{desc}</div>
      <button
        className="mt-3 px-3 py-1.5 rounded bg-indigo-700 hover:bg-indigo-600"
        onClick={() => alert(`先占位：之後進入「${title}」子頁`)}
      >
        進入
      </button>
    </div>
  );
}
