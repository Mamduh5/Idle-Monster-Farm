import { STARTING_EGG_COST } from '../data/economy';
import { UPGRADE_DEFINITIONS, type UpgradeId } from '../data/upgrades';
import { ONBOARDING_HINT_IDS, type MonsterFamily, type OnboardingHintId } from '../types/game-state';

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
  upgrades: Record<UpgradeId, number>;
  currentEggCost: number;
  onboardingHintsSeen: OnboardingHintId[];
  expansionUnlocked: boolean;
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

  return Math.round(coins * 100) / 100;
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
    upgrades: normalizeUpgradeLevels(rawData.upgrades),
    currentEggCost: normalizeEggCost(rawData.currentEggCost),
    onboardingHintsSeen: normalizeOnboardingHints(rawData.onboardingHintsSeen),
    expansionUnlocked: rawData.expansionUnlocked === true,
  };
}

function normalizeOnboardingHints(rawHints: unknown): OnboardingHintId[] {
  if (!Array.isArray(rawHints)) {
    return [];
  }

  return rawHints.filter((hint): hint is OnboardingHintId => (
    typeof hint === 'string' && ONBOARDING_HINT_IDS.includes(hint as OnboardingHintId)
  ));
}

function normalizeEggCost(rawEggCost: unknown): number {
  const eggCost = Number(rawEggCost);

  if (!Number.isFinite(eggCost) || eggCost < STARTING_EGG_COST) {
    return STARTING_EGG_COST;
  }

  return Math.ceil(eggCost);
}

function normalizeUpgradeLevels(rawUpgrades: unknown): Record<UpgradeId, number> {
  const upgrades = Object.fromEntries(
    UPGRADE_DEFINITIONS.map((upgrade) => [upgrade.id, 0]),
  ) as Record<UpgradeId, number>;

  if (!isRecord(rawUpgrades)) {
    return upgrades;
  }

  UPGRADE_DEFINITIONS.forEach((upgrade) => {
    const level = Number(rawUpgrades[upgrade.id]);

    if (!Number.isFinite(level)) {
      return;
    }

    upgrades[upgrade.id] = Math.min(
      Math.max(Math.floor(level), 0),
      upgrade.maxLevel,
    );
  });

  return upgrades;
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
