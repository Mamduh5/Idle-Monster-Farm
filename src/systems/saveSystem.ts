import type { MonsterFamily } from '../types/game-state';

export const SAVE_STORAGE_KEY = 'idle-monster-farm-save';
export const SAVE_VERSION = 1;

export type SavedMonsterSlot = {
  family: MonsterFamily;
  level: number;
} | null;

export type SavedMonsterDiscovery = {
  family: MonsterFamily;
  level: number;
};

export type LocalSaveData = {
  version: typeof SAVE_VERSION;
  coins: number;
  grid: SavedMonsterSlot[];
  lastActiveAt: number;
  discoveredMonsters: SavedMonsterDiscovery[];
};

export function loadSaveData(slotCount: number): LocalSaveData | null {
  const rawSave = readStorageValue();

  if (!rawSave) {
    return null;
  }

  try {
    return normalizeSaveData(JSON.parse(rawSave), slotCount);
  } catch {
    return null;
  }
}

export function writeSaveData(saveData: LocalSaveData): void {
  try {
    window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(saveData));
  } catch {
    // localStorage may be unavailable in private browsing or restricted embeds.
  }
}

export function clearSaveData(): void {
  try {
    window.localStorage.removeItem(SAVE_STORAGE_KEY);
  } catch {
    // localStorage may be unavailable in private browsing or restricted embeds.
  }
}

export function sanitizeSavedCoins(coins: number): number {
  if (!Number.isFinite(coins) || coins < 0) {
    return 0;
  }

  return Math.floor(coins);
}

function readStorageValue(): string | null {
  try {
    return window.localStorage.getItem(SAVE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function normalizeSaveData(rawData: unknown, slotCount: number): LocalSaveData | null {
  if (!isRecord(rawData) || rawData.version !== SAVE_VERSION) {
    return null;
  }

  const rawGrid = Array.isArray(rawData.grid) ? rawData.grid : [];
  const rawDiscoveries = Array.isArray(rawData.discoveredMonsters)
    ? rawData.discoveredMonsters
    : [];

  return {
    version: SAVE_VERSION,
    coins: sanitizeSavedCoins(Number(rawData.coins)),
    grid: Array.from({ length: slotCount }, (_, index) => normalizeSavedSlot(rawGrid[index])),
    lastActiveAt: normalizeTimestamp(rawData.lastActiveAt),
    discoveredMonsters: rawDiscoveries.flatMap((rawDiscovery) => {
      const discovery = normalizeSavedMonsterReference(rawDiscovery);
      return discovery ? [discovery] : [];
    }),
  };
}

function normalizeSavedSlot(rawSlot: unknown): SavedMonsterSlot {
  if (rawSlot === null || rawSlot === undefined || !isRecord(rawSlot)) {
    return null;
  }

  return normalizeSavedMonsterReference(rawSlot);
}

function normalizeSavedMonsterReference(rawMonster: unknown): SavedMonsterDiscovery | null {
  if (!isRecord(rawMonster)) {
    return null;
  }

  const level = Number(rawMonster.level);

  if (typeof rawMonster.family !== 'string' || !Number.isInteger(level) || level <= 0) {
    return null;
  }

  return {
    family: rawMonster.family as MonsterFamily,
    level,
  };
}

function normalizeTimestamp(rawTimestamp: unknown): number {
  const timestamp = Number(rawTimestamp);

  if (!Number.isFinite(timestamp) || timestamp < 0) {
    return Date.now();
  }

  return Math.floor(timestamp);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
