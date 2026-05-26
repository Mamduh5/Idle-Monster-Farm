import type { ZoneId } from '../data/zones';
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

const RITUAL_ESSENCE_REWARD = 1;
const RITUAL_INCOME_BOOST_PER_COMPLETION = 0.1;

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

export function getMonsterRitualPower(monster: FarmSlotState['monster']): number {
  if (!monster) {
    return 0;
  }

  return Math.floor(monster.level * 10 + monster.incomePerSecond);
}

export function getFarmRitualPower(farmSlots: readonly FarmSlotState[]): number {
  return farmSlots.reduce((highestPower, slot) => Math.max(highestPower, getMonsterRitualPower(slot.monster)), 0);
}

export function getRitualRequirement(totalRitualsPerformed: number): number {
  const ritualCount = sanitizePrestigeInteger(totalRitualsPerformed);

  if (ritualCount >= 50) {
    return 7000 + (ritualCount - 50) * 350;
  }

  if (ritualCount >= 20) {
    return 1500 + (ritualCount - 20) * 180;
  }

  if (ritualCount >= 10) {
    return 600 + (ritualCount - 10) * 90;
  }

  return 180 + ritualCount * 40;
}

export function canPerformRitual(farmSlots: readonly FarmSlotState[], totalRitualsPerformed: number): boolean {
  return getFarmRitualPower(farmSlots) >= getRitualRequirement(totalRitualsPerformed);
}

export function getRitualIncomeMultiplier(totalRitualsPerformed: number): number {
  return 1 + sanitizePrestigeInteger(totalRitualsPerformed) * RITUAL_INCOME_BOOST_PER_COMPLETION;
}

export function getPrestigeReward(
  farmSlots: readonly FarmSlotState[],
  totalRitualsPerformed: number,
): number {
  return canPerformRitual(farmSlots, totalRitualsPerformed) ? RITUAL_ESSENCE_REWARD : 0;
}

export function canPerformSafeRitual(
  farmSlots: readonly FarmSlotState[],
  alreadyUsedThisSession: boolean,
  totalRitualsPerformed: number,
): boolean {
  return !alreadyUsedThisSession && getSafeRitualReward(farmSlots, totalRitualsPerformed) > 0;
}

export function getSafeRitualReward(
  farmSlots: readonly FarmSlotState[],
  totalRitualsPerformed: number,
): number {
  return getPrestigeReward(farmSlots, totalRitualsPerformed);
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
  totalRitualsPerformed = 0,
): boolean {
  return hasPrestigedOnce || monsterEssence > 0 || essencePowerLevel > 0 || totalRitualsPerformed > 0;
}

export function syncZoneUnlockFromPrestigeProgress(
  unlockedZones: ReadonlySet<ZoneId>,
  currentZone: ZoneId,
  hasPrestigedOnce: boolean,
  monsterEssence: number,
  essencePowerLevel: number,
  totalRitualsPerformed: number,
  defaultZoneId: ZoneId,
  mushroomForestZoneId: ZoneId,
): ZoneUnlockSyncResult {
  const nextUnlockedZones = new Set(unlockedZones);
  let nextHasPrestigedOnce = hasPrestigedOnce;

  if (shouldUnlockMushroomForestFromPrestige(
    hasPrestigedOnce,
    monsterEssence,
    essencePowerLevel,
    totalRitualsPerformed,
  )) {
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
