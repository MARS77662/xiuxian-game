"use client";

import React, { useEffect, useState } from "react";
import AppInner from "./AppInner"; // 下面會新建這支

export default function ClientPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 這個元件永遠只用到 2 個 hooks，不會變
  if (!mounted) return null;
  return <AppInner />;
}
