import { getUpgradeCost, type UpgradeDefinition, type UpgradeId } from '../data/upgrades';

export type UpgradeBuyMode = 'x1' | 'x10' | 'x50' | 'max';

export type UpgradePurchasePreview = {
  levels: number;
  totalCost: number;
  nextCost: number;
};

export function createInitialUpgradeLevels(
  upgradeDefinitions: readonly UpgradeDefinition[],
): Record<UpgradeId, number> {
  return Object.fromEntries(
    upgradeDefinitions.map((upgrade) => [upgrade.id, 0]),
  ) as Record<UpgradeId, number>;
}

export function getSanitizedUpgradeLevels(
  upgradeDefinitions: readonly UpgradeDefinition[],
  upgradeLevels: Readonly<Record<UpgradeId, number>>,
): Record<UpgradeId, number> {
  return Object.fromEntries(
    upgradeDefinitions.map((upgrade) => [
      upgrade.id,
      getUpgradeLevel(upgradeDefinitions, upgradeLevels, upgrade.id),
    ]),
  ) as Record<UpgradeId, number>;
}

export function getUpgradeLevel(
  upgradeDefinitions: readonly UpgradeDefinition[],
  upgradeLevels: Readonly<Record<UpgradeId, number>>,
  upgradeId: UpgradeId,
): number {
  const upgrade = upgradeDefinitions.find((definition) => definition.id === upgradeId);
  const level = upgradeLevels[upgradeId] ?? 0;

  if (!upgrade || !Number.isFinite(level)) {
    return 0;
  }

  return sanitizeUpgradeLevel(level, upgrade.maxLevel);
}

export function isUpgradeMaxed(upgrade: UpgradeDefinition, currentLevel: number): boolean {
  return sanitizeUpgradeLevel(currentLevel, upgrade.maxLevel) >= upgrade.maxLevel;
}

export function getUpgradeCostForLevel(upgrade: UpgradeDefinition, level: number): number {
  return getUpgradeCost(upgrade, sanitizeUpgradeLevel(level, upgrade.maxLevel));
}

export function getUpgradePurchasePreview(
  upgrade: UpgradeDefinition,
  currentLevel: number,
  availableCoins: number,
  buyMode: UpgradeBuyMode,
): UpgradePurchasePreview {
  const sanitizedLevel = sanitizeUpgradeLevel(currentLevel, upgrade.maxLevel);
  const nextCost = getUpgradeCostForLevel(upgrade, sanitizedLevel);
  const maxLevelsToBuy = getUpgradeLevelsForBuyMode(buyMode);
  let levels = 0;
  let totalCost = 0;

  while (
    sanitizedLevel + levels < upgrade.maxLevel
    && levels < maxLevelsToBuy
  ) {
    const levelCost = getUpgradeCostForLevel(upgrade, sanitizedLevel + levels);

    if (levelCost <= 0 || availableCoins < totalCost + levelCost) {
      break;
    }

    totalCost += levelCost;
    levels += 1;
  }

  return {
    levels,
    totalCost,
    nextCost,
  };
}

export function getMaxAffordableUpgradeLevels(
  upgrade: UpgradeDefinition,
  currentLevel: number,
  availableCoins: number,
): UpgradePurchasePreview {
  return getUpgradePurchasePreview(upgrade, currentLevel, availableCoins, 'max');
}

export function getUpgradeLevelsForBuyMode(buyMode: UpgradeBuyMode): number {
  if (buyMode === 'max') {
    return Number.POSITIVE_INFINITY;
  }

  return Number.parseInt(buyMode.slice(1), 10);
}

export function applyUpgradePurchase(
  upgradeLevels: Readonly<Record<UpgradeId, number>>,
  upgradeId: UpgradeId,
  levelsPurchased: number,
): Record<UpgradeId, number> {
  return {
    ...upgradeLevels,
    [upgradeId]: (upgradeLevels[upgradeId] ?? 0) + levelsPurchased,
  };
}

export function canPurchaseUpgrade(
  upgrade: UpgradeDefinition,
  currentLevel: number,
  availableCoins: number,
  buyMode: UpgradeBuyMode,
): boolean {
  return !isUpgradeMaxed(upgrade, currentLevel)
    && getUpgradePurchasePreview(upgrade, currentLevel, availableCoins, buyMode).levels > 0;
}

function sanitizeUpgradeLevel(level: number, maxLevel: number): number {
  if (!Number.isFinite(level) || level < 0) {
    return 0;
  }

  return Math.min(Math.max(Math.floor(level), 0), maxLevel);
}
