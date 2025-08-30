export type Phase = "BOOT"|"NAME"|"FACTION"|"ALLOCATE"|"SCENE";

export type Attributes = {
  體質: number; 智力: number; 才貌: number; 家境: number;
};

export type Faction = {
  key: string; name: string; desc: string; startScene: string;
  bonuses: Partial<Attributes>; tags: string[];
};

export type FactionsJson = {
  factions: Record<"正派"|"邪修"|"散修", Faction[]>;
  attributes: (keyof Attributes)[];
  startPoints: number;
  rules: { desc: string; applyBonusAfterAllocate: boolean };
};

// 你原本的 Player 可以延伸，不要重構原欄位
export type Player = {
  name: string;
  門派?: Faction & { 類型: "正派"|"邪修"|"散修" };
  屬性: Attributes;
  qi?: number;           // 你的核心若有同名，就沿用
  stones?: number;
  // …其餘照你原本
};

export type GameCtx = {
  phase: Phase;
  player: Player;
  lastTick: number;
};
