import type { ZoneId } from '../data/zones';
import {
  canPrestigeFromOwnedMonsters,
  getPrestigeEssenceReward,
} from '../systems/progressionSystem';
import type { FarmSlotState } from '../types/game-state';

export type EssencePowerPurchaseResult =
  | {
    success: true;
    monsterEssence: number;
    essencePowerLevel: number;
    hasPrestigedOnce: true;
  }
  | {
    success: false;
    reason: 'not-enough-essence';
  };

export type ZoneSelectionStatus = 'selected' | 'unlocked' | 'locked';

export type ZoneUnlockSyncResult = {
  unlockedZones: Set<ZoneId>;
  currentZone: ZoneId;
  hasPrestigedOnce: boolean;
};

export function sanitizePrestigeInteger(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.floor(value);
}

export function canAffordEssencePower(monsterEssence: number, essencePowerCost: number): boolean {
  return monsterEssence >= essencePowerCost;
}

export function getEssencePowerPurchaseResult(
  monsterEssence: number,
  essencePowerLevel: number,
  essencePowerCost: number,
): EssencePowerPurchaseResult {
  if (!canAffordEssencePower(monsterEssence, essencePowerCost)) {
    return {
      success: false,
      reason: 'not-enough-essence',
    };
  }

  return {
    success: true,
    monsterEssence: monsterEssence - essencePowerCost,
    essencePowerLevel: essencePowerLevel + 1,
    hasPrestigedOnce: true,
  };
}

export function canPrestige(farmSlots: readonly FarmSlotState[]): boolean {
  return canPrestigeFromOwnedMonsters(farmSlots);
}

export function getPrestigeReward(farmSlots: readonly FarmSlotState[]): number {
  return getPrestigeEssenceReward(farmSlots);
}

export function createInitialUnlockedZones(defaultZoneId: ZoneId): Set<ZoneId> {
  return new Set<ZoneId>([defaultZoneId]);
}

export function isZoneUnlocked(zoneId: ZoneId, unlockedZones: ReadonlySet<ZoneId>): boolean {
  return unlockedZones.has(zoneId);
}

export function getSanitizedUnlockedZones(
  rawZones: Iterable<unknown>,
  validZoneIds: readonly ZoneId[],
  defaultZoneId: ZoneId,
): Set<ZoneId> {
  const zones = new Set<ZoneId>([defaultZoneId]);

  for (const zoneId of rawZones) {
    if (typeof zoneId === 'string' && validZoneIds.includes(zoneId as ZoneId)) {
      zones.add(zoneId as ZoneId);
    }
  }

  return zones;
}

export function getSanitizedCurrentZone(
  currentZone: ZoneId,
  unlockedZones: ReadonlySet<ZoneId>,
  defaultZoneId: ZoneId,
): ZoneId {
  return unlockedZones.has(currentZone) ? currentZone : defaultZoneId;
}

export function shouldUnlockMushroomForestFromPrestige(
  hasPrestigedOnce: boolean,
  monsterEssence: number,
  essencePowerLevel: number,
): boolean {
  return hasPrestigedOnce || monsterEssence > 0 || essencePowerLevel > 0;
}

export function syncZoneUnlockFromPrestigeProgress(
  unlockedZones: ReadonlySet<ZoneId>,
  currentZone: ZoneId,
  hasPrestigedOnce: boolean,
  monsterEssence: number,
  essencePowerLevel: number,
  defaultZoneId: ZoneId,
  mushroomForestZoneId: ZoneId,
): ZoneUnlockSyncResult {
  const nextUnlockedZones = new Set(unlockedZones);
  let nextHasPrestigedOnce = hasPrestigedOnce;

  if (shouldUnlockMushroomForestFromPrestige(hasPrestigedOnce, monsterEssence, essencePowerLevel)) {
    nextHasPrestigedOnce = true;
    nextUnlockedZones.add(mushroomForestZoneId);
  }

  nextUnlockedZones.add(defaultZoneId);

  return {
    unlockedZones: nextUnlockedZones,
    currentZone: getSanitizedCurrentZone(currentZone, nextUnlockedZones, defaultZoneId),
    hasPrestigedOnce: nextHasPrestigedOnce,
  };
}

export function canSwitchToZone(
  zoneId: ZoneId,
  currentZone: ZoneId,
  unlockedZones: ReadonlySet<ZoneId>,
): boolean {
  return unlockedZones.has(zoneId) && currentZone !== zoneId;
}

export function getZoneSelectionStatus(
  zoneId: ZoneId,
  currentZone: ZoneId,
  unlockedZones: ReadonlySet<ZoneId>,
): ZoneSelectionStatus {
  if (currentZone === zoneId) {
    return 'selected';
  }

  if (unlockedZones.has(zoneId)) {
    return 'unlocked';
  }

  return 'locked';
}
