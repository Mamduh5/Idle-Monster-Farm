import { EGG_COST_MULTIPLIER, STARTING_EGG_COST } from '../data/economy';
import { getElementIncomeMultiplier, type ElementType } from '../data/elements';
import { MUSHROOM_FOREST_ZONE_ID, type ZoneId } from '../data/zones';
import type { FarmSlotState, MonsterDefinition, MonsterFamily } from '../types/game-state';

// Pure economy/progression math. Keep this module free of Phaser, storage, and UI side effects.
export const MAX_OFFLINE_SECONDS = 7200;
export const HATCH_COOLDOWN_MS = 3000;
export const BASE_MUSHROOM_HATCH_CHANCE = 0.2;
export const MUSHROOM_FOREST_HATCH_CHANCE_BONUS = 0.05;
export const MUSHROOM_HATCH_CHANCE_PER_LEVEL = 0.04;
export const MIN_HATCH_COOLDOWN_MS = 1200;
export const SLIME_INCOME_BOOST_PER_LEVEL = 0.2;
export const MUSHROOM_INCOME_BOOST_PER_LEVEL = 0.22;
export const RARE_FAMILY_INCOME_BOOST_PER_LEVEL = 0.18;
export const FUSION_POWER_INCOME_BOOST_PER_LEVEL = 0.15;
export const RITUAL_INCOME_BOOST_PER_COMPLETION = 0.1;
export const HATCH_SPEED_REDUCTION_PER_LEVEL = 0.07;
export const OFFLINE_STORAGE_SECONDS_PER_LEVEL = 1800;
export const EGG_DISCOUNT_PER_LEVEL = 0.03;
export const TAP_POWER_REWARD_BOOST_PER_LEVEL = 0.15;
export const ORDER_COIN_REWARD_BOOST_PER_LEVEL = 0.1;
export const COIN_BUG_REWARD_BOOST_PER_LEVEL = 0.2;

const MILLISECONDS_PER_SECOND = 1000;

export function sanitizeEggCost(eggCost: number): number {
  if (!Number.isFinite(eggCost) || eggCost < STARTING_EGG_COST) {
    return STARTING_EGG_COST;
  }

  return Math.ceil(eggCost);
}

export function getNextEggCost(currentEggCost: number): number {
  return Math.max(STARTING_EGG_COST, Math.ceil(sanitizeEggCost(currentEggCost) * EGG_COST_MULTIPLIER));
}

export function getEffectiveEggCost(currentEggCost: number, eggDiscountLevel: number): number {
  const rawCost = sanitizeEggCost(currentEggCost);
  const discountMultiplier = Math.max(0, 1 - sanitizeProgressionLevel(eggDiscountLevel) * EGG_DISCOUNT_PER_LEVEL);

  return Math.max(STARTING_EGG_COST, Math.ceil(rawCost * discountMultiplier));
}

export function getHatchCooldownMs(hatchSpeedLevel: number): number {
  const reduction = sanitizeProgressionLevel(hatchSpeedLevel) * HATCH_SPEED_REDUCTION_PER_LEVEL;
  const cooldown = HATCH_COOLDOWN_MS * Math.max(0, 1 - reduction);

  return Math.max(MIN_HATCH_COOLDOWN_MS, Math.floor(cooldown));
}

export function getCurrentZoneMushroomHatchBonus(currentZone: ZoneId): number {
  return currentZone === MUSHROOM_FOREST_ZONE_ID ? MUSHROOM_FOREST_HATCH_CHANCE_BONUS : 0;
}

export function getMushroomHatchChance(mushroomChanceLevel: number, currentZone: ZoneId): number {
  const chance = BASE_MUSHROOM_HATCH_CHANCE
    + getCurrentZoneMushroomHatchBonus(currentZone)
    + sanitizeProgressionLevel(mushroomChanceLevel) * MUSHROOM_HATCH_CHANCE_PER_LEVEL;

  return clamp(chance, 0, 1);
}

export function getFamilyIncomeMultiplier(
  family: MonsterFamily,
  slimeIncomeBoostLevel: number,
  mushroomIncomeBoostLevel: number,
  fusionPowerLevel = 0,
  cactusIncomeBoostLevel = 0,
  cellIncomeBoostLevel = 0,
  plantIncomeBoostLevel = 0,
): number {
  if (family === 'Mushroom') {
    return 1 + sanitizeProgressionLevel(mushroomIncomeBoostLevel) * MUSHROOM_INCOME_BOOST_PER_LEVEL;
  }

  if (family === 'Slime') {
    return 1 + sanitizeProgressionLevel(slimeIncomeBoostLevel) * SLIME_INCOME_BOOST_PER_LEVEL;
  }

  if (family === 'Spore') {
    return getSporeIncomeMultiplier(fusionPowerLevel);
  }

  if (family === 'Cactus') {
    return getRareFamilyIncomeMultiplier(cactusIncomeBoostLevel);
  }

  if (family === 'Cell') {
    return getRareFamilyIncomeMultiplier(cellIncomeBoostLevel);
  }

  if (family === 'Plant') {
    return getRareFamilyIncomeMultiplier(plantIncomeBoostLevel);
  }

  return 1;
}

export function getSporeIncomeMultiplier(fusionPowerLevel: number): number {
  return 1 + sanitizeProgressionLevel(fusionPowerLevel) * FUSION_POWER_INCOME_BOOST_PER_LEVEL;
}

export function getRareFamilyIncomeMultiplier(upgradeLevel: number): number {
  return 1 + sanitizeProgressionLevel(upgradeLevel) * RARE_FAMILY_INCOME_BOOST_PER_LEVEL;
}

export function getPrestigeIncomeMultiplier(totalRitualsPerformed: number): number {
  return 1 + sanitizeProgressionLevel(totalRitualsPerformed) * RITUAL_INCOME_BOOST_PER_COMPLETION;
}

export function getEffectiveMonsterIncome(
  monster: (Pick<MonsterDefinition, 'family' | 'incomePerSecond'> & { element?: ElementType }) | null | undefined,
  slimeIncomeBoostLevel: number,
  mushroomIncomeBoostLevel: number,
  totalRitualsPerformed: number,
  fusionPowerLevel = 0,
  cactusIncomeBoostLevel = 0,
  cellIncomeBoostLevel = 0,
  plantIncomeBoostLevel = 0,
): number {
  if (!monster || !Number.isFinite(monster.incomePerSecond) || monster.incomePerSecond <= 0) {
    return 0;
  }

  return roundCurrency(
    monster.incomePerSecond
    * getFamilyIncomeMultiplier(
      monster.family,
      slimeIncomeBoostLevel,
      mushroomIncomeBoostLevel,
      fusionPowerLevel,
      cactusIncomeBoostLevel,
      cellIncomeBoostLevel,
      plantIncomeBoostLevel,
    )
    * getPrestigeIncomeMultiplier(totalRitualsPerformed)
    * getElementIncomeMultiplier(monster.element),
  );
}

export function getTotalIncomePerSecond(
  farmSlots: readonly FarmSlotState[],
  slimeIncomeBoostLevel: number,
  mushroomIncomeBoostLevel: number,
  totalRitualsPerformed: number,
  fusionPowerLevel = 0,
  cactusIncomeBoostLevel = 0,
  cellIncomeBoostLevel = 0,
  plantIncomeBoostLevel = 0,
): number {
  return roundCurrency(farmSlots.reduce((totalIncome, slot) => {
    const income = getEffectiveMonsterIncome(
      slot.monster,
      slimeIncomeBoostLevel,
      mushroomIncomeBoostLevel,
      totalRitualsPerformed,
      fusionPowerLevel,
      cactusIncomeBoostLevel,
      cellIncomeBoostLevel,
      plantIncomeBoostLevel,
    );

    if (!Number.isFinite(income) || income <= 0) {
      return totalIncome;
    }

    return totalIncome + income;
  }, 0));
}

export function getTapFarmReward(baseReward: number, comboMultiplier: number, tapPowerLevel: number): number {
  const safeBaseReward = sanitizeCurrency(baseReward);
  const safeComboMultiplier = Number.isFinite(comboMultiplier) && comboMultiplier > 0 ? comboMultiplier : 1;
  const tapPowerMultiplier = 1 + sanitizeProgressionLevel(tapPowerLevel) * TAP_POWER_REWARD_BOOST_PER_LEVEL;

  return sanitizeCurrency(safeBaseReward * safeComboMultiplier * tapPowerMultiplier);
}

export function getOrderCoinReward(baseReward: number, orderBonusLevel: number): number {
  const safeBaseReward = sanitizeCurrency(baseReward);
  const orderMultiplier = 1 + sanitizeProgressionLevel(orderBonusLevel) * ORDER_COIN_REWARD_BOOST_PER_LEVEL;

  return sanitizeCurrency(safeBaseReward * orderMultiplier);
}

export function getCoinBugReward(baseReward: number, coinBugValueLevel: number): number {
  const safeBaseReward = sanitizeCurrency(baseReward);
  const coinBugMultiplier = 1 + sanitizeProgressionLevel(coinBugValueLevel) * COIN_BUG_REWARD_BOOST_PER_LEVEL;

  return sanitizeCurrency(safeBaseReward * coinBugMultiplier);
}

export function getOfflineCapSeconds(offlineStorageLevel: number): number {
  return MAX_OFFLINE_SECONDS + sanitizeProgressionLevel(offlineStorageLevel) * OFFLINE_STORAGE_SECONDS_PER_LEVEL;
}

export function calculateOfflineCoins(
  elapsedMilliseconds: number,
  offlineCapSeconds: number,
  incomePerSecond: number,
): number {
  if (!Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds <= 0) {
    return 0;
  }

  const elapsedSeconds = Math.floor(elapsedMilliseconds / MILLISECONDS_PER_SECOND);
  const cappedElapsedSeconds = Math.min(elapsedSeconds, offlineCapSeconds);
  const offlineCoins = cappedElapsedSeconds * incomePerSecond;

  return sanitizeCurrency(offlineCoins);
}

function sanitizeProgressionLevel(level: number): number {
  if (!Number.isFinite(level) || level < 0) {
    return 0;
  }

  return Math.floor(level);
}

function sanitizeCurrency(coins: number): number {
  if (!Number.isFinite(coins) || coins < 0) {
    return 0;
  }

  return roundCurrency(coins);
}

function roundCurrency(coins: number): number {
  return Math.round(coins * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
