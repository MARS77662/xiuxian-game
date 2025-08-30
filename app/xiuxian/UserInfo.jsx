	"use client";

	/* 依境界推上限（父層沒給 qiMax/xpMax 時的後備邏輯） */
	const QI_CAP_BY_KEY = {
	  lianti: 1000,
	  lianqi: 5000,
	  zhujii: 30000,
	  jindan: 200000,
	  yuanying: 1000000,
	  dujie: 2000000,
	  zhenxian: 10000000,
	  daluo: 50000000,
	};
	const QI_CAP_BY_NAME = {
	  "煉體": 1000,
	  "練氣": 5000,
	  "築基": 30000,
	  "金丹": 200000,
	  "元嬰": 1000000,
	  "渡劫": 2000000,
	  "真仙": 10000000,
	  "大羅": 50000000,
	};
	const XP_CAP_BY_KEY = {
	  lianti: 100,
	  lianqi: 300,
	  zhujii: 800,
	  jindan: 2000,
	  yuanying: 6000,
	  dujie: 12000,
	  zhenxian: 30000,
	  daluo: 90000,
	};
	const XP_CAP_BY_NAME = {
	  "煉體": 100,
	  "練氣": 300,
	  "築基": 800,
	  "金丹": 2000,
	  "元嬰": 6000,
	  "渡劫": 12000,
	  "真仙": 30000,
	  "大羅": 90000,
	};

	function inferCapFromRealm(s, byKey, byName, fallback) {
	  const key = s?.realm?.key;
	  if (key && byKey[key]) return byKey[key];
	  const nm = s?.realm?.name || "";
	  for (const [k, v] of Object.entries(byName)) {
		if (nm.includes(k)) return v;      // 支援「練氣三層」這種字串
	  }
	  // 如果有 realmIndex，也優先用它（0..7）
	  if (Number.isFinite(s?.realmIndex)) {
		const keys = Object.keys(byKey);
		const idx = Math.max(0, Math.min(keys.length - 1, Number(s.realmIndex)));
		return byKey[keys[idx]];
	  }
	  return fallback;
	}

	function Bar({ label, value = 0, max = 0, color = "emerald" }) {
	  const v = Number(value) || 0;
	  const m = Number(max) || 0;

	  // 不讓顯示超過上限
	  const overflow = m > 0 && v > m;
	  const showV = m > 0 ? Math.min(v, m) : v;
	  const pct = m > 0 ? Math.min(100, (showV / m) * 100) : 100;

	  const fmt = (n) => new Intl.NumberFormat("zh-TW").format(Math.round(n));

	  const colorCls =
		color === "emerald" ? "bg-emerald-500" :
		color === "indigo"  ? "bg-indigo-500"  :
		color === "rose"    ? "bg-rose-500"    :
		"bg-slate-500";

	  return (
		<div className="mt-1">
		  <div className="flex items-center justify-between text-[11px] text-slate-300">
			<span>{label}</span>
			<span className="tabular-nums">
			  {m > 0 ? `${fmt(showV)}/${fmt(m)}` : fmt(showV)}
			  {overflow && <span className="ml-1 text-[10px] text-rose-300">MAX</span>}
			</span>
		  </div>
		  <div className="h-2.5 rounded bg-black/30 overflow-hidden">
			<div className={`h-full ${colorCls}`} style={{ width: `${pct}%` }} />
		  </div>
		</div>
	  );
	}

	export default function UserInfo({ state }) {
	  const s = state || {};
				const days = s.lifeDays ?? 0;
				const lifeText = days >= 365 ? `${Math.floor(days / 365)} 年` : `${days} 天`;
	  const name  = s.nickname || "無名散修";
	  const sect  = s.sect || "散修";
	  const realmName = s.realm?.name || "練氣三層";

	  // 若父層沒提供 qiMax/xpMax，依境界自動推上限
	  const qiMaxAuto = inferCapFromRealm(s, QI_CAP_BY_KEY, QI_CAP_BY_NAME, 500);
	  const xpMaxAuto = inferCapFromRealm(s, XP_CAP_BY_KEY, XP_CAP_BY_NAME, 300);
	  const qiMax = Number(s.qiMax) > 0 ? Number(s.qiMax) : qiMaxAuto;
	  const xpMax = Number(s.xpMax) > 0 ? Number(s.xpMax) : xpMaxAuto;

	  const qiLabel = s.overheat ? "靈氣（走火）" : "靈氣";
	  const qiColor = s.overheat ? "rose" : "emerald";

	  return (
		<div
		  className="fixed top-6 left-6 z-40 flex items-center gap-4 px-4 py-3
					 rounded-2xl border border-white/10 bg-slate-900/70 text-slate-100
					 backdrop-blur shadow-lg"
		>
		  <img
			src={s.avatar || "/icon-192x192.png"}
			alt="avatar"
			className="w-16 h-16 rounded-2xl object-cover"
			onError={(e) => (e.currentTarget.style.display = "none")}
		  />

		  <div className="min-w-[260px]">
			<div className="flex items-center gap-2">
			  <div className="text-lg font-bold">{name}</div>
			  <span className="text-sm text-slate-300">{sect}</span>
			</div>
			<div className="mt-0.5 text-xs text-slate-300">
			  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
				{realmName}
			  </span>
			  {Number.isFinite(s.cycle) && (
				<span className="ml-2 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
				  輪迴 × {s.cycle}
				</span>
			  )}
			</div>

			<div className="mt-2">
			  <Bar label={qiLabel} value={s.qi} max={qiMax} color={qiColor} />
			  <Bar label="修為"   value={s.xp} max={xpMax} color="indigo" />
			</div>

			<div className="mt-2 flex items-center gap-4 text-xs text-slate-200">
			  <span title="靈石（一般貨幣）">💰 靈石 {s.gold ?? 0}</span>
			  <span title="寶石（稀有貨幣）">💎 寶石 {s.gem ?? 0}</span>


				<span title="壽元剩餘">📅 {lifeText}</span>


			</div>
		  </div>
		</div>
	  );
	}
