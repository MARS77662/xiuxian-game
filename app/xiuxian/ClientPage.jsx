// app/xiuxian/ClientPage.jsx
"use client";

import { useEffect, useState } from "react";
import AppInner from "./AppInner";

/** 只做 mounted gate，避免 SSR/CSR 不一致造成 hooks 次數不同 */
export default function ClientPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <AppInner /> : null;
}
