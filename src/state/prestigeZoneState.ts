import {
  BLOOM_GARDEN_ZONE_ID,
  CACTUS_DESERT_ZONE_ID,
  CELL_MARSH_ZONE_ID,
  SPORE_GROVE_ZONE_ID,
  type ZoneId,
} from '../data/zones';
import type { FarmSlotState, MonsterFamily, MonsterInstance } from '../types/game-state';

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

export type RitualSacrificeCandidate = {
  slotId: number;
  monster: MonsterInstance;
  ritualPower: number;
};

export type RitualCompletionResult =
  | {
    success: true;
    sacrificeSlotId: number;
    sacrificeMonster: MonsterInstance;
    sacrificePower: number;
    rewardEssence: number;
    nextTotalRitualsPerformed: number;
    nextRequirement: number;
    nextIncomeMultiplier: number;
  }
  | {
    success: false;
    reason: 'not-enough-ritual-power' | 'missing-sacrifice';
  };

const RITUAL_ESSENCE_REWARD_TIERS = [
  { multiplier: 6, reward: 6 },
  { multiplier: 4.5, reward: 5 },
  { multiplier: 3.25, reward: 4 },
  { multiplier: 2.25, reward: 3 },
  { multiplier: 1.5, reward: 2 },
  { multiplier: 1, reward: 1 },
] as const;
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

export function canAffordRareHatch(monsterEssence: number, rareHatchCost: number): boolean {
  return monsterEssence >= rareHatchCost;
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
  return getRitualSacrificeCandidate(farmSlots, totalRitualsPerformed) !== undefined;
}

export function getRitualIncomeMultiplier(totalRitualsPerformed: number): number {
  return 1 + sanitizePrestigeInteger(totalRitualsPerformed) * RITUAL_INCOME_BOOST_PER_COMPLETION;
}

export function getRitualEssenceRewardTier(sacrificePower: number, requirement: number): number {
  if (!Number.isFinite(sacrificePower) || !Number.isFinite(requirement) || requirement <= 0) {
    return 0;
  }

  if (sacrificePower < requirement) {
    return 0;
  }

  const matchedTier = RITUAL_ESSENCE_REWARD_TIERS.find((tier) => sacrificePower >= requirement * tier.multiplier);

  return matchedTier?.reward ?? 0;
}

export function getRitualEssenceRewardForPower(sacrificePower: number, requirement: number): number {
  return Math.min(6, getRitualEssenceRewardTier(sacrificePower, requirement));
}

export function getPrestigeReward(
  farmSlots: readonly FarmSlotState[],
  totalRitualsPerformed: number,
): number {
  const requirement = getRitualRequirement(totalRitualsPerformed);
  const sacrificeCandidate = getRitualSacrificeCandidate(farmSlots, totalRitualsPerformed);

  return sacrificeCandidate
    ? getRitualEssenceRewardForPower(sacrificeCandidate.ritualPower, requirement)
    : 0;
}

export function getRitualSacrificeCandidate(
  farmSlots: readonly FarmSlotState[],
  totalRitualsPerformed: number,
): RitualSacrificeCandidate | undefined {
  const requirement = getRitualRequirement(totalRitualsPerformed);

  return farmSlots.reduce<RitualSacrificeCandidate | undefined>((bestCandidate, slot) => {
    if (!slot.monster) {
      return bestCandidate;
    }

    const ritualPower = getMonsterRitualPower(slot.monster);

    if (ritualPower < requirement) {
      return bestCandidate;
    }

    const candidate: RitualSacrificeCandidate = {
      slotId: slot.id,
      monster: slot.monster,
      ritualPower,
    };

    if (!bestCandidate) {
      return candidate;
    }

    if (candidate.ritualPower !== bestCandidate.ritualPower) {
      return candidate.ritualPower > bestCandidate.ritualPower ? candidate : bestCandidate;
    }

    if (candidate.monster.level !== bestCandidate.monster.level) {
      return candidate.monster.level > bestCandidate.monster.level ? candidate : bestCandidate;
    }

    return candidate.slotId < bestCandidate.slotId ? candidate : bestCandidate;
  }, undefined);
}

export function canPerformSafeRitual(
  farmSlots: readonly FarmSlotState[],
  totalRitualsPerformed: number,
): boolean {
  return getSafeRitualReward(farmSlots, totalRitualsPerformed) > 0;
}

export function getSafeRitualReward(
  farmSlots: readonly FarmSlotState[],
  totalRitualsPerformed: number,
): number {
  return getPrestigeReward(farmSlots, totalRitualsPerformed);
}

export function getRitualCompletionResult(
  farmSlots: readonly FarmSlotState[],
  totalRitualsPerformed: number,
): RitualCompletionResult {
  const requirement = getRitualRequirement(totalRitualsPerformed);
  const sacrificeCandidate = getRitualSacrificeCandidate(farmSlots, totalRitualsPerformed);

  if (!sacrificeCandidate && getFarmRitualPower(farmSlots) < requirement) {
    return {
      success: false,
      reason: 'not-enough-ritual-power',
    };
  }

  if (!sacrificeCandidate) {
    return {
      success: false,
      reason: 'missing-sacrifice',
    };
  }

  const nextTotalRitualsPerformed = sanitizePrestigeInteger(totalRitualsPerformed + 1);
  const rewardEssence = getRitualEssenceRewardForPower(sacrificeCandidate.ritualPower, requirement);

  if (rewardEssence <= 0) {
    return {
      success: false,
      reason: 'not-enough-ritual-power',
    };
  }

  return {
    success: true,
    sacrificeSlotId: sacrificeCandidate.slotId,
    sacrificeMonster: sacrificeCandidate.monster,
    sacrificePower: sacrificeCandidate.ritualPower,
    rewardEssence,
    nextTotalRitualsPerformed,
    nextRequirement: getRitualRequirement(nextTotalRitualsPerformed),
    nextIncomeMultiplier: getRitualIncomeMultiplier(nextTotalRitualsPerformed),
  };
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
  discoveredFamilies: ReadonlySet<MonsterFamily> = new Set<MonsterFamily>(),
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

  if (totalRitualsPerformed >= 2 || discoveredFamilies.has('Spore')) {
    nextUnlockedZones.add(SPORE_GROVE_ZONE_ID);
  }

  if (totalRitualsPerformed >= 4 || discoveredFamilies.has('Cactus')) {
    nextUnlockedZones.add(CACTUS_DESERT_ZONE_ID);
  }

  if (totalRitualsPerformed >= 5 || discoveredFamilies.has('Cell')) {
    nextUnlockedZones.add(CELL_MARSH_ZONE_ID);
  }

  if (totalRitualsPerformed >= 7 || discoveredFamilies.has('Plant')) {
    nextUnlockedZones.add(BLOOM_GARDEN_ZONE_ID);
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
