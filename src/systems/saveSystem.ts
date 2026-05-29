import { STARTING_EGG_COST } from '../data/economy';
import { BOSS_BATTLE_DEFINITIONS, BOSS_BATTLE_STAGE_IDS } from '../data/bossBattles';
import { sanitizeElementFragmentInventory, type ElementFragmentInventory } from '../data/elements';
import { MISSION_DEFINITIONS, MISSION_IDS, type MissionId } from '../data/missions';
import { ORDER_IDS, type OrderId } from '../data/orders';
import { UPGRADE_DEFINITIONS, type UpgradeId } from '../data/upgrades';
import { GRASS_FARM_ZONE_ID, ZONE_IDS, type ZoneId } from '../data/zones';
import {
  isMonsterFamily,
  ONBOARDING_HINT_IDS,
  type MonsterFamily,
  type OnboardingHintId,
} from '../types/game-state';

export const SAVE_STORAGE_KEY = 'idle-monster-farm-save';
export const SAVE_VERSION = 1;
const BOSS_DAILY_CLEAR_LIMIT = 2;

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
  monsterEssence: number;
  essencePowerLevel: number;
  rareHatchLevel: number;
  totalRitualsPerformed: number;
  currentEggCost: number;
  onboardingHintsSeen: OnboardingHintId[];
  expansionUnlocked: boolean;
  missionProgress: Record<MissionId, number>;
  completedMissionIds: MissionId[];
  claimedMissionIds: MissionId[];
  claimedOrderIds: OrderId[];
  claimedBossBattleStageIds: string[];
  elementFragments: ElementFragmentInventory;
  bossDailyClearCounts: Record<string, number>;
  bossDailyClearLastResetDay: string;
  unlockedZones: ZoneId[];
  currentZone: ZoneId;
  hasPrestigedOnce: boolean;
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

  const hasPrestigedOnce = rawData.hasPrestigedOnce === true;
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
    monsterEssence: normalizePrestigeInteger(rawData.monsterEssence),
    essencePowerLevel: normalizePrestigeInteger(rawData.essencePowerLevel),
    rareHatchLevel: normalizePrestigeInteger(rawData.rareHatchLevel),
    totalRitualsPerformed: normalizeTotalRitualsPerformed(rawData.totalRitualsPerformed, hasPrestigedOnce),
    currentEggCost: normalizeEggCost(rawData.currentEggCost),
    onboardingHintsSeen: normalizeOnboardingHints(rawData.onboardingHintsSeen),
    expansionUnlocked: rawData.expansionUnlocked === true,
    missionProgress: normalizeMissionProgress(rawData.missionProgress),
    completedMissionIds: normalizeMissionIds(rawData.completedMissionIds),
    claimedMissionIds: normalizeMissionIds(rawData.claimedMissionIds),
    claimedOrderIds: normalizeOrderIds(rawData.claimedOrderIds),
    claimedBossBattleStageIds: normalizeBossBattleStageIds(rawData.claimedBossBattleStageIds),
    elementFragments: sanitizeElementFragmentInventory(rawData.elementFragments),
    bossDailyClearCounts: normalizeBossDailyClearCounts(rawData.bossDailyClearCounts),
    bossDailyClearLastResetDay: normalizeBossDailyClearLastResetDay(rawData.bossDailyClearLastResetDay),
    unlockedZones: normalizeUnlockedZones(rawData.unlockedZones),
    currentZone: normalizeCurrentZone(rawData.currentZone, rawData.unlockedZones),
    hasPrestigedOnce,
  };
}

function normalizeTotalRitualsPerformed(rawTotalRitualsPerformed: unknown, hasPrestigedOnce: boolean): number {
  if (rawTotalRitualsPerformed === undefined) {
    return hasPrestigedOnce ? 1 : 0;
  }

  return normalizePrestigeInteger(rawTotalRitualsPerformed);
}

function normalizeUnlockedZones(rawZones: unknown): ZoneId[] {
  const zones = new Set<ZoneId>([GRASS_FARM_ZONE_ID]);

  if (Array.isArray(rawZones)) {
    rawZones.forEach((zoneId) => {
      if (typeof zoneId === 'string' && ZONE_IDS.includes(zoneId as ZoneId)) {
        zones.add(zoneId as ZoneId);
      }
    });
  }

  return Array.from(zones);
}

function normalizeCurrentZone(rawCurrentZone: unknown, rawUnlockedZones: unknown): ZoneId {
  const unlockedZones = normalizeUnlockedZones(rawUnlockedZones);

  if (
    typeof rawCurrentZone === 'string'
    && ZONE_IDS.includes(rawCurrentZone as ZoneId)
    && unlockedZones.includes(rawCurrentZone as ZoneId)
  ) {
    return rawCurrentZone as ZoneId;
  }

  return GRASS_FARM_ZONE_ID;
}

function normalizeMissionProgress(rawProgress: unknown): Record<MissionId, number> {
  const missionProgress = Object.fromEntries(
    MISSION_DEFINITIONS.map((mission) => [mission.id, 0]),
  ) as Record<MissionId, number>;

  if (!isRecord(rawProgress)) {
    return missionProgress;
  }

  MISSION_DEFINITIONS.forEach((mission) => {
    const progress = Number(rawProgress[mission.id]);

    if (!Number.isFinite(progress)) {
      return;
    }

    missionProgress[mission.id] = Math.min(Math.max(Math.floor(progress), 0), mission.goal);
  });

  return missionProgress;
}

function normalizeMissionIds(rawMissionIds: unknown): MissionId[] {
  if (!Array.isArray(rawMissionIds)) {
    return [];
  }

  return Array.from(new Set(rawMissionIds.filter((missionId): missionId is MissionId => (
    typeof missionId === 'string' && MISSION_IDS.includes(missionId as MissionId)
  ))));
}

function normalizeOrderIds(rawOrderIds: unknown): OrderId[] {
  if (!Array.isArray(rawOrderIds)) {
    return [];
  }

  return Array.from(new Set(rawOrderIds.filter((orderId): orderId is OrderId => (
    typeof orderId === 'string' && ORDER_IDS.includes(orderId as OrderId)
  ))));
}

function normalizeBossBattleStageIds(rawStageIds: unknown): string[] {
  if (!Array.isArray(rawStageIds)) {
    return [];
  }

  return Array.from(new Set(rawStageIds.filter((stageId): stageId is string => (
    typeof stageId === 'string' && BOSS_BATTLE_STAGE_IDS.includes(stageId)
  ))));
}

function normalizeBossDailyClearCounts(rawCounts: unknown): Record<string, number> {
  const counts: Record<string, number> = {};

  if (!isRecord(rawCounts)) {
    return counts;
  }

  BOSS_BATTLE_DEFINITIONS.forEach((boss) => {
    const count = Number(rawCounts[boss.id]);

    if (!Number.isFinite(count)) {
      return;
    }

    counts[boss.id] = Math.min(Math.max(0, Math.floor(count)), BOSS_DAILY_CLEAR_LIMIT);
  });

  return counts;
}

function normalizeBossDailyClearLastResetDay(rawDay: unknown): string {
  return typeof rawDay === 'string' ? rawDay : '';
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

function normalizePrestigeInteger(rawValue: unknown): number {
  const value = Number(rawValue);

  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.floor(value);
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

  if (!isMonsterFamily(rawMonster.family) || !Number.isInteger(level) || level <= 0) {
    return null;
  }

  return {
    family: rawMonster.family,
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
