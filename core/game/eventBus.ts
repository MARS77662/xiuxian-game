type Handler = (payload?: any) => void;
const map = new Map<string, Set<Handler>>();

export const bus = {
  on(type: string, fn: Handler){ if(!map.has(type)) map.set(type, new Set()); map.get(type)!.add(fn); return ()=>map.get(type)!.delete(fn); },
  emit(type: string, payload?: any){ map.get(type)?.forEach(fn=>fn(payload)); }
};
