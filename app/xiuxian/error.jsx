"use client";

export default function Error({ error, reset }) {
  // 方便你快速看到實際訊息
  return (
    <div style={{padding:24}}>
      <h2 style={{color:"#fca5a5"}}>頁面錯誤</h2>
      <pre style={{whiteSpace:"pre-wrap", color:"#fecaca"}}>
        {String(error?.message || error)}
      </pre>
      <button onClick={() => reset()} style={{marginTop:12, padding:"8px 12px", background:"#334155", color:"#fff", borderRadius:8}}>
        重試
      </button>
    </div>
  );
}
