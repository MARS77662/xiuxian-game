"use client";
import { GameProvider } from "./lib/gameState";

export default function ClientProviders({ children }) {
  return <GameProvider>{children}</GameProvider>;
}
