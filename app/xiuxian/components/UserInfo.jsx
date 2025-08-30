	// app/xiuxian/components/UserInfo.jsx
	import React from "react";
	import "../userinfo.css"; // 引入樣式

	export default function UserInfo({ state }) {
	  const qiPct = Math.max(0, Math.min(1, state.qi / Math.max(1, state.qiMax)));
	  const xpPct = Math.max(0, Math.min(1, state.xp / Math.max(1, state.xpMax)));

	  const realmClass = state.realm?.key ? `realm-${state.realm.key}` : "";

	  return (
		<div id="ui-userinfo" className={`ui-userinfo ${realmClass}`}>
		  <img
			id="ui-avatar"
			className="ui-avatar"
			src={state.avatar || "/icon-192x192.png"}
			alt="avatar"
		  />
		  <div className="ui-col">
			<div className="ui-row">
			  <span id="ui-nickname" className="ui-nickname">
				{state.nickname || "無名散修"}
			  </span>
			  <span id="ui-realm" className="ui-realm badge">
				{state.realm?.name || "凡人"}
			  </span>
			  {state.sect ? <span id="ui-sect" className="ui-sect">· {state.sect}</span> : null}
			</div>

			<div className="ui-bars">
			  <div className="bar">
				<div className="bar-label">靈氣</div>
				<div className="bar-track">
				  <div id="bar-qi" className="bar-fill" style={{ width: `${(qiPct * 100).toFixed(1)}%` }} />
				</div>
				<div id="txt-qi" className="bar-text">
				  {state.qi} / {state.qiMax}
				</div>
			  </div>

			  <div className="bar">
				<div className="bar-label">修為</div>
				<div className="bar-track">
				  <div id="bar-xp" className="bar-fill xp" style={{ width: `${(xpPct * 100).toFixed(1)}%` }} />
				</div>
				<div id="txt-xp" className="bar-text">
				  {state.xp} / {state.xpMax}
				</div>
			  </div>
			</div>

			<div className="ui-res">
			  <span className="res">💰 <b id="res-gold">{state.gold.toLocaleString()}</b></span>
			  <span className="res">💎 <b id="res-gem">{state.gem.toLocaleString()}</b></span>
			  {typeof state.lifeDays === "number" && (
				<span className="res">🕯️ <b id="res-life">{state.lifeDays}</b> 天</span>
			  )}
			</div>
		  </div>
		</div>
	  );
	}
