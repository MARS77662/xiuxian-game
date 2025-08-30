"use client";
import { useState } from "react";
import AppInner from "./AppInner";

function CharacterCreate({ onStart }) {
  const [name, setName] = useState("蘇子夜");
  const [faction, setFaction] = useState("正派");
  const [attrs, setAttrs] = useState({ 體質: 5, 智力: 5, 才貌: 5, 家境: 5 });

  const handleStart = () => {
    onStart({ name, faction, attrs });
  };

  return (
    <div className="p-6 max-w-md mx-auto text-slate-100">
      <h2 className="text-2xl font-bold mb-4">創建角色</h2>
      <div className="mb-2">
        <label>姓名：</label>
        <input value={name} onChange={e=>setName(e.target.value)} className="text-black px-2" />
      </div>
      <div className="mb-2">
        <label>門派：</label>
        <select value={faction} onChange={e=>setFaction(e.target.value)} className="text-black px-2">
          <option value="正派">正派</option>
          <option value="邪修">邪修</option>
          <option value="散修">散修</option>
        </select>
      </div>
      <div className="mb-2">
        <label>屬性分配：</label>
        {Object.keys(attrs).map(k => (
          <div key={k}>
            {k}：
            <input type="number" value={attrs[k]} onChange={e=>setAttrs({...attrs, [k]:parseInt(e.target.value)})} className="text-black px-2 w-16" />
          </div>
        ))}
      </div>
      <button onClick={handleStart} className="mt-4 px-4 py-2 bg-indigo-600 rounded">
        開始修煉
      </button>
    </div>
  );
}

export default function XiuxianPage() {
  const [player, setPlayer] = useState(null);

  if (!player) {
    return <CharacterCreate onStart={setPlayer} />;
  }

  return <AppInner initialPlayer={player} />;
}
