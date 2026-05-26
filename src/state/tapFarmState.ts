import { getTapFarmReward as getProgressionTapFarmReward } from '../systems/progressionSystem';

export const TAP_FARM_REWARD_SECONDS = 0.5;
export const TAP_FARM_MIN_REWARD = 1;
export const TAP_FARM_BURST_THRESHOLD = 20;
export const TAP_FARM_BURST_REWARD_SECONDS = 10;
export const TAP_FARM_BURST_MIN_REWARD = 25;
export const TAP_FARM_COOLDOWN_MS = 90;
export const TAP_FARM_COMBO_TIMEOUT_MS = 4000;
export const TAP_FARM_COMBO_MAX_MULTIPLIER = 2.5;

export type TapFarmConfig = {
  cooldownMs: number;
  comboTimeoutMs: number;
  comboMaxMultiplier: number;
  burstThreshold: number;
  tapRewardSeconds: number;
  tapMinReward: number;
  burstRewardSeconds: number;
  burstMinReward: number;
};

export type TapFarmStateSnapshot = {
  tapFarmEnergy: number;
  tapFarmCombo: number;
  lastTapFarmAt: number;
  lastTapFarmComboAt: number;
};

export type TapFarmTapInput = {
  state: TapFarmStateSnapshot;
  config: TapFarmConfig;
  now: number;
  totalIncomePerSecond: number;
  tapPowerLevel: number;
};

export type TapFarmTapResult = {
  accepted: boolean;
  reason?: 'cooldown';
  nextState: TapFarmStateSnapshot;
  activeCombo: number;
  comboMultiplier: number;
  isTierTap: boolean;
  tapReward: number;
  shouldBurst: boolean;
  burstReward: number;
};

export type TapFarmComboTimeoutResult = {
  expired: boolean;
  nextState: TapFarmStateSnapshot;
};

export const TAP_FARM_DEFAULT_CONFIG: TapFarmConfig = {
  cooldownMs: TAP_FARM_COOLDOWN_MS,
  comboTimeoutMs: TAP_FARM_COMBO_TIMEOUT_MS,
  comboMaxMultiplier: TAP_FARM_COMBO_MAX_MULTIPLIER,
  burstThreshold: TAP_FARM_BURST_THRESHOLD,
  tapRewardSeconds: TAP_FARM_REWARD_SECONDS,
  tapMinReward: TAP_FARM_MIN_REWARD,
  burstRewardSeconds: TAP_FARM_BURST_REWARD_SECONDS,
  burstMinReward: TAP_FARM_BURST_MIN_REWARD,
};

export function isTapFarmOnCooldown(now: number, lastTapFarmAt: number, cooldownMs: number): boolean {
  return now - lastTapFarmAt < cooldownMs;
}

export function isTapFarmComboExpired(now: number, lastTapFarmComboAt: number, comboTimeoutMs: number): boolean {
  return now - lastTapFarmComboAt > comboTimeoutMs;
}

export function getActiveTapFarmCombo(
  combo: number,
  now: number,
  lastComboAt: number,
  comboTimeoutMs: number,
): number {
  if (combo <= 0 || isTapFarmComboExpired(now, lastComboAt, comboTimeoutMs)) {
    return 0;
  }

  return combo;
}

export function getIncrementedTapFarmCombo(
  combo: number,
  now: number,
  lastComboAt: number,
  comboTimeoutMs: number,
): number {
  return getActiveTapFarmCombo(combo, now, lastComboAt, comboTimeoutMs) + 1;
}

export function getTapFarmComboMultiplier(combo: number, maxMultiplier: number): number {
  if (combo >= 70) {
    return maxMultiplier;
  }

  if (combo >= 40) {
    return 2;
  }

  if (combo >= 20) {
    return 1.5;
  }

  if (combo >= 10) {
    return 1.2;
  }

  return 1;
}

export function isTapFarmComboTierTap(combo: number): boolean {
  return [10, 20, 40, 70].includes(combo);
}

export function getUpdatedTapFarmEnergy(currentEnergy: number, threshold: number): number {
  return Math.min(threshold, currentEnergy + 1);
}

export function shouldTriggerFarmBurst(energy: number, threshold: number): boolean {
  return energy >= threshold;
}

export function resetTapFarmEnergy(): number {
  return 0;
}

export function getBaseTapFarmReward(
  totalIncomePerSecond: number,
  minReward: number,
  rewardSeconds: number,
): number {
  return Math.max(minReward, totalIncomePerSecond * rewardSeconds);
}

export function getTapFarmRewardAmount(baseReward: number, comboMultiplier: number, tapPowerLevel: number): number {
  return getProgressionTapFarmReward(baseReward, comboMultiplier, tapPowerLevel);
}

export function getBaseTapFarmBurstReward(
  totalIncomePerSecond: number,
  minReward: number,
  rewardSeconds: number,
): number {
  return Math.max(minReward, totalIncomePerSecond * rewardSeconds);
}

export function getTapFarmBurstRewardAmount(baseReward: number, tapPowerLevel: number): number {
  return getProgressionTapFarmReward(baseReward, 1, tapPowerLevel);
}

export function getTapFarmTapResult(input: TapFarmTapInput): TapFarmTapResult {
  if (isTapFarmOnCooldown(input.now, input.state.lastTapFarmAt, input.config.cooldownMs)) {
    return {
      accepted: false,
      reason: 'cooldown',
      nextState: input.state,
      activeCombo: getActiveTapFarmCombo(
        input.state.tapFarmCombo,
        input.now,
        input.state.lastTapFarmComboAt,
        input.config.comboTimeoutMs,
      ),
      comboMultiplier: 1,
      isTierTap: false,
      tapReward: 0,
      shouldBurst: false,
      burstReward: 0,
    };
  }

  const activeCombo = getIncrementedTapFarmCombo(
    input.state.tapFarmCombo,
    input.now,
    input.state.lastTapFarmComboAt,
    input.config.comboTimeoutMs,
  );
  const comboMultiplier = getTapFarmComboMultiplier(activeCombo, input.config.comboMaxMultiplier);
  const nextEnergy = getUpdatedTapFarmEnergy(input.state.tapFarmEnergy, input.config.burstThreshold);
  const baseReward = getBaseTapFarmReward(input.totalIncomePerSecond, input.config.tapMinReward, input.config.tapRewardSeconds);
  const baseBurstReward = getBaseTapFarmBurstReward(input.totalIncomePerSecond, input.config.burstMinReward, input.config.burstRewardSeconds);

  return {
    accepted: true,
    nextState: {
      tapFarmEnergy: nextEnergy,
      tapFarmCombo: activeCombo,
      lastTapFarmAt: input.now,
      lastTapFarmComboAt: input.now,
    },
    activeCombo,
    comboMultiplier,
    isTierTap: isTapFarmComboTierTap(activeCombo),
    tapReward: getTapFarmRewardAmount(baseReward, comboMultiplier, input.tapPowerLevel),
    shouldBurst: shouldTriggerFarmBurst(nextEnergy, input.config.burstThreshold),
    burstReward: getTapFarmBurstRewardAmount(baseBurstReward, input.tapPowerLevel),
  };
}

export function getTapFarmComboTimeoutResult(
  state: TapFarmStateSnapshot,
  now: number,
  comboTimeoutMs: number,
): TapFarmComboTimeoutResult {
  if (state.tapFarmCombo <= 0 || !isTapFarmComboExpired(now, state.lastTapFarmComboAt, comboTimeoutMs)) {
    return {
      expired: false,
      nextState: state,
    };
  }

  return {
    expired: true,
    nextState: {
      ...state,
      tapFarmCombo: 0,
      lastTapFarmComboAt: -comboTimeoutMs,
    },
  };
}

export function getTapFarmEnergyRatio(energy: number, threshold: number): number {
  const clampedEnergy = getClampedTapFarmEnergy(energy, threshold);

  return clampedEnergy / threshold;
}

export function getClampedTapFarmEnergy(energy: number, threshold: number): number {
  return Math.min(Math.max(Math.floor(energy), 0), threshold);
}
