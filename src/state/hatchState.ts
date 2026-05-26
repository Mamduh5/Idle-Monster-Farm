import type { ZoneId } from '../data/zones';
import {
  getEffectiveEggCost,
  getHatchCooldownMs,
  getMushroomHatchChance,
  getNextEggCost,
} from '../systems/progressionSystem';
import type { MonsterDefinition } from '../types/game-state';

export type HatchBlockedReason =
  | 'not-ready'
  | 'farm-full'
  | 'not-enough-coins'
  | 'no-empty-slot';

export type HatchAttemptState =
  | {
    canHatch: true;
    cost: number;
  }
  | {
    canHatch: false;
    reason: HatchBlockedReason;
    cost: number;
  };

export type HatchAttemptOptions = {
  availableCoins: number;
  cost: number;
  hasEmptySlot: boolean;
  hatchCooldownDurationMs: number;
  hatchCooldownMs: number;
  isFarmFull: boolean;
};

export function isHatchReady(hatchCooldownMs: number, hatchCooldownDurationMs: number): boolean {
  return hatchCooldownMs >= hatchCooldownDurationMs;
}

export function getHatchCooldownProgress(hatchCooldownMs: number, hatchCooldownDurationMs: number): number {
  return clamp(hatchCooldownMs / hatchCooldownDurationMs, 0, 1);
}

export function getUpdatedHatchCooldown(
  currentCooldownMs: number,
  deltaMs: number,
  hatchCooldownDurationMs: number,
): number {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0 || isHatchReady(currentCooldownMs, hatchCooldownDurationMs)) {
    return currentCooldownMs;
  }

  return clamp(currentCooldownMs + deltaMs, 0, hatchCooldownDurationMs);
}

export function getAppliedAwayHatchCooldown(
  currentCooldownMs: number,
  elapsedMilliseconds: number,
  hatchCooldownDurationMs: number,
): number {
  return getUpdatedHatchCooldown(currentCooldownMs, elapsedMilliseconds, hatchCooldownDurationMs);
}

export function getCappedHatchCooldown(currentCooldownMs: number, hatchCooldownDurationMs: number): number {
  return Math.min(currentCooldownMs, hatchCooldownDurationMs);
}

export function getHatchCost(currentEggCost: number, eggDiscountLevel: number): number {
  return getEffectiveEggCost(currentEggCost, eggDiscountLevel);
}

export function canAffordHatch(coins: number, hatchCost: number): boolean {
  return coins >= hatchCost;
}

export function getHatchBlockedReason(options: HatchAttemptOptions): HatchBlockedReason | undefined {
  if (!options.hasEmptySlot) {
    return options.isFarmFull ? 'farm-full' : 'no-empty-slot';
  }

  if (!isHatchReady(options.hatchCooldownMs, options.hatchCooldownDurationMs)) {
    return 'not-ready';
  }

  if (!canAffordHatch(options.availableCoins, options.cost)) {
    return 'not-enough-coins';
  }

  return undefined;
}

export function getHatchAttemptState(options: HatchAttemptOptions): HatchAttemptState {
  const reason = getHatchBlockedReason(options);

  if (reason) {
    return {
      canHatch: false,
      reason,
      cost: options.cost,
    };
  }

  return {
    canHatch: true,
    cost: options.cost,
  };
}

export function getNextHatchCostAfterSuccess(currentEggCost: number): number {
  return getNextEggCost(currentEggCost);
}

export function getHatchedMonsterDefinition(
  randomValue: number,
  mushroomChance: number,
  babySlime: MonsterDefinition,
  buttonMushroom: MonsterDefinition,
): MonsterDefinition {
  return randomValue < mushroomChance ? buttonMushroom : babySlime;
}

export function getMushroomHatchChanceForState(mushroomChanceLevel: number, currentZone: ZoneId): number {
  return getMushroomHatchChance(mushroomChanceLevel, currentZone);
}

export function getHatchCooldownDurationForState(hatchSpeedLevel: number): number {
  return getHatchCooldownMs(hatchSpeedLevel);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
