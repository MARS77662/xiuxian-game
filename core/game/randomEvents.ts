import { Player } from "./types";
import { bus } from "./eventBus";
import * as cultivate from "@/core/cultivation";

type GameEvent = { key:string; name:string; weight:(p:Player)=>number; run:(p:Player)=>string };

const events: GameEvent[] = [
  {
    key:"heavenly_herb",
    name:"天材地寶現世",
    weight:(p)=> 1 + p.屬性.才貌*0.2 + p.屬性.家境*0.1,
    run:(p)=>{
      const qi = 10 + Math.round(p.屬性.才貌*1.2);
      cultivate.addQi(p, qi);
      return `你撿到靈藥，獲得氣機 +${qi}`;
    }
  },
  {
    key:"heart_demon",
    name:"心魔試煉",
    weight:(p)=> 1 + (p.門派?.key==="moxin" ? 1.5 : 0.5),
    run:(p)=>{
      const pass = Math.random() < (0.5 + p.屬性.體質*0.02);
      if (pass){ return "你壓制住心魔，心境通透（無事）。"; }
      cultivate.addQi(p, -8);
      return "心魔侵蝕，你的氣機受損（-8）。";
    }
  }
];

export function bindEventRollers(){
  bus.on("roll:event", ()=> {
    const ev = pickWeighted(events);
    const msg = ev.run(currentPlayer!);
    bus.emit("event:resolved", {title: ev.name, message: msg});
  });
  bus.on("explore", ()=>{
    const ev = pickWeighted(events);
    const msg = ev.run(currentPlayer!);
    bus.emit("event:resolved", {title: "探索事件：" + ev.name, message: msg});
  });
}

let currentPlayer: Player|undefined;
export function setCurrentPlayer(p: Player){ currentPlayer = p; }

function pickWeighted(list: GameEvent[]){
  const w = list.map(e=>e.weight(currentPlayer!));
  const sum = w.reduce((a,b)=>a+b,0);
  let r = Math.random()*sum;
  for (let i=0;i<list.length;i++){ r -= w[i]; if (r<=0) return list[i]; }
  return list[list.length-1];
}
