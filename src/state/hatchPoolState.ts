import { HATCH_POOL_DEFINITIONS, RARE_HATCH_WEIGHT_BONUS_PER_LEVEL } from '../data/hatchPool';
import { ZONE_DEFINITIONS, type ZoneId } from '../data/zones';
import type { MonsterFamily } from '../types/game-state';

export type HatchPoolEntryState = {
  family: MonsterFamily;
  baseWeight: number;
  weight: number;
  chance: number;
  rare: boolean;
  unlocked: boolean;
  unlockHintKey: string;
  zoneMultiplier: number;
};

export type HatchPoolOptions = {
  currentZone: ZoneId;
  discoveredFamilies: ReadonlySet<MonsterFamily>;
  mushroomChanceLevel: number;
  rareHatchLevel: number;
};

export function getRareHatchWeightMultiplier(rareHatchLevel: number): number {
  return 1 + sanitizeLevel(rareHatchLevel) * RARE_HATCH_WEIGHT_BONUS_PER_LEVEL;
}

export function getHatchPoolEntries(options: HatchPoolOptions): HatchPoolEntryState[] {
  const zone = ZONE_DEFINITIONS.find((definition) => definition.id === options.currentZone);
  const rareMultiplier = getRareHatchWeightMultiplier(options.rareHatchLevel);
  const mushroomMultiplier = 1 + sanitizeLevel(options.mushroomChanceLevel) * 0.18;

  const entries = HATCH_POOL_DEFINITIONS.map<HatchPoolEntryState>((entry) => {
    const hasRequiredRareLevel = sanitizeLevel(options.rareHatchLevel) >= entry.minimumRareHatchLevel;
    const isDiscovered = options.discoveredFamilies.has(entry.family);
    const unlocked = entry.minimumRareHatchLevel === 0
      || (entry.requiresDiscovery ? hasRequiredRareLevel && isDiscovered : hasRequiredRareLevel || isDiscovered);
    const zoneMultiplier = zone?.hatchWeightMultipliers[entry.family] ?? 1;
    const upgradeMultiplier = entry.rare
      ? rareMultiplier
      : entry.family === 'Mushroom'
        ? mushroomMultiplier
        : 1;
    const weight = unlocked ? Math.max(0, entry.baseWeight * zoneMultiplier * upgradeMultiplier) : 0;

    return {
      family: entry.family,
      baseWeight: entry.baseWeight,
      weight,
      chance: 0,
      rare: entry.rare,
      unlocked,
      unlockHintKey: entry.unlockHintKey,
      zoneMultiplier,
    };
  });
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);

  return entries.map((entry) => ({
    ...entry,
    chance: totalWeight > 0 ? entry.weight / totalWeight : entry.family === 'Slime' ? 1 : 0,
  }));
}

export function getWeightedHatchFamily(entries: readonly HatchPoolEntryState[], randomValue: number): MonsterFamily {
  const unlockedEntries = entries.filter((entry) => entry.unlocked && entry.weight > 0);
  const totalWeight = unlockedEntries.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) {
    return 'Slime';
  }

  const threshold = clamp(Number.isFinite(randomValue) ? randomValue : 0, 0, 0.999999) * totalWeight;
  let runningWeight = 0;

  for (const entry of unlockedEntries) {
    runningWeight += entry.weight;

    if (threshold < runningWeight) {
      return entry.family;
    }
  }

  return unlockedEntries[unlockedEntries.length - 1]?.family ?? 'Slime';
}

function sanitizeLevel(level: number): number {
  if (!Number.isFinite(level) || level < 0) {
    return 0;
  }

  return Math.floor(level);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
